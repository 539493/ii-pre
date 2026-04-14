import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_QUESTION_COUNT = 100;
const MAX_QUESTION_COUNT = 100;
const MIN_QUESTION_COUNT = 1;
const MAX_BATCH_SIZE = 25;
const MAX_FILL_ATTEMPTS = 12;

interface GeneratedQuestion {
  id?: string;
  question: string;
  type?: string;
  correct_answer: string;
  hint: string;
}

interface GeneratedSection {
  topic: string;
  questions: GeneratedQuestion[];
}

interface GeneratedBatch {
  test_title?: string;
  sections?: GeneratedSection[];
}

function parseDesiredQuestionCount(topic?: string) {
  if (!topic) return DEFAULT_QUESTION_COUNT;

  const directMatch = topic.match(/(\d+)\s*(?:вопрос|вопроса|вопросов|questions?)/i);
  const testOnMatch = topic.match(/(?:тест|экзамен|викторин[аы])\s*на\s*(\d+)/i);
  const fallbackMatch = directMatch || testOnMatch || topic.match(/(?:тест|экзамен|викторин[аы]).*?(\d+)/i);
  if (!fallbackMatch) return DEFAULT_QUESTION_COUNT;

  const requested = Number(fallbackMatch[1]);
  if (!Number.isFinite(requested)) return DEFAULT_QUESTION_COUNT;

  return Math.min(MAX_QUESTION_COUNT, Math.max(MIN_QUESTION_COUNT, requested));
}

function buildBatchSizes(totalQuestions: number) {
  const batchCount = Math.ceil(totalQuestions / MAX_BATCH_SIZE);
  const batches: number[] = [];
  let remaining = totalQuestions;

  for (let i = 0; i < batchCount; i += 1) {
    const batchesLeft = batchCount - i;
    const size = Math.ceil(remaining / batchesLeft);
    batches.push(size);
    remaining -= size;
  }

  return batches;
}

function normalizeTopicName(topic: string, fallbackIndex: number) {
  const trimmed = topic.trim();
  return trimmed || `Тема ${fallbackIndex + 1}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { subjectId, subjectName, topic, deviceId, history, desiredQuestionCount: desiredQuestionCountRaw } = await req.json();

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: progress } = await supabase
      .from("progress_records")
      .select("*")
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false })
      .limit(50);

    const progressContext = progress?.length
      ? `Student progress:\n${progress.map((p) => `- ${p.topic}: ${p.correct_answers}/${p.total_questions} correct`).join("\n")}`
      : "No previous progress data.";

    const historyContext = Array.isArray(history) && history.length
      ? `Recent chat topics:\n${history.slice(-10).map((h: { content: string }) => `- ${h.content}`).join("\n")}`
      : "";

    const normalizedDesired = Number.isFinite(desiredQuestionCountRaw)
      ? Number(desiredQuestionCountRaw)
      : null;
    const desiredQuestionCount = normalizedDesired !== null
      ? Math.min(MAX_QUESTION_COUNT, Math.max(MIN_QUESTION_COUNT, normalizedDesired))
      : parseDesiredQuestionCount(topic);
    const batchSizes = buildBatchSizes(desiredQuestionCount);

    const baseSystemPrompt = `You are a test generator for subject: ${subjectName || subjectId}.
Based on the student's learning history and progress, create parts of ONE complete test.

${progressContext}
${historyContext}

The final result must become ONE standalone test with EXACTLY ${desiredQuestionCount} questions in total.
You are currently generating only one batch of that large final test.

Return STRICT JSON only:
{
  "test_title": "название теста с эмодзи",
  "sections": [
    {
      "topic": "Название темы",
      "questions": [
        {
          "id": "q1",
          "question": "Вопрос?",
          "type": "text",
          "correct_answer": "правильный ответ",
          "hint": "подсказка при ошибке"
        }
      ]
    }
  ]
}

Rules:
- Questions should progress from easy to hard
- Include a mix of types: factual, application, analysis
- Make questions specific and testable
- Hints should guide without revealing the answer
- All text in Russian (except English subject where questions/answers are in English)
- Include emojis in the test title
- Return content for ONE batch only, but preserve the same overall test style
- The final output in the app must remain ONE test, not multiple tests
- Sections are internal thematic groups inside the same final test
- Each section should have 4-8 questions
- Keep section names short and clear
- Use type "text" unless another simple type is absolutely necessary
- IMPORTANT: when asked for a number of questions, respect that number exactly across the final test`;

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    async function generateBatch(batchIndex: number, batchSize: number, existingTopics: string[]) {
      const userPrompt = topic
        ? `Create batch ${batchIndex + 1} of ${batchSizes.length} for the topic "${topic}".
Generate EXACTLY ${batchSize} questions for this batch.
Avoid repeating these already covered topics if possible: ${existingTopics.join(", ") || "none"}.
Keep the questions suitable for one large final test.`
        : `Create batch ${batchIndex + 1} of ${batchSizes.length} for one large comprehensive test.
Generate EXACTLY ${batchSize} questions for this batch.
Avoid repeating these already covered topics if possible: ${existingTopics.join(", ") || "none"}.
Keep the questions suitable for one large final test.`;

      const preferredModel = Deno.env.get("GEMINI_MODEL") || "gemini-1.5-flash";
      const fallbackModels = [
        preferredModel,
        "gemini-1.5-flash-002",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
        "gemini-1.5-pro-002",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
      ];

      let aiJson: any = null;
      let lastStatus = 0;

      const maxRetriesPerModel = 3;
      for (const model of fallbackModels) {
        for (let attempt = 0; attempt < maxRetriesPerModel; attempt += 1) {
          const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: baseSystemPrompt }],
              },
              contents: [
                {
                  role: "user",
                  parts: [{ text: userPrompt }],
                },
              ],
              generationConfig: {
                temperature: 0.4,
                response_mime_type: "application/json",
              },
            }),
          });

          if (aiRes.ok) {
            aiJson = await aiRes.json();
            lastStatus = 200;
            break;
          }

          lastStatus = aiRes.status;
          if (aiRes.status === 429) {
            await sleep(900 * (attempt + 1));
            continue;
          }
          if (aiRes.status === 404) break;
          throw new Error(`AI_ERROR_${aiRes.status}`);
        }

        if (aiJson) break;
      }

      if (!aiJson) {
        throw new Error(`AI_ERROR_${lastStatus || 500}`);
      }

      const content = aiJson?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part?.text || "")
        .join("")
        .trim();
      try {
        return JSON.parse(content) as GeneratedBatch;
      } catch {
        throw new Error("INVALID_AI_JSON");
      }
    }

    const mergedSections = new Map<string, GeneratedQuestion[]>();
    let finalTitle = "";

    const appendBatchSections = (sections: GeneratedSection[]) => {
      for (const rawSection of sections) {
        const topicName = normalizeTopicName(rawSection?.topic || "", mergedSections.size);
        if (!mergedSections.has(topicName)) {
          mergedSections.set(topicName, []);
        }

        for (const rawQuestion of rawSection?.questions || []) {
          mergedSections.get(topicName)!.push({
            ...rawQuestion,
            type: rawQuestion.type || "text",
          });
        }
      }
    };

    for (let batchIndex = 0; batchIndex < batchSizes.length; batchIndex += 1) {
      const batch = await generateBatch(batchIndex, batchSizes[batchIndex], Array.from(mergedSections.keys()));
      if (!finalTitle && batch.test_title) {
        finalTitle = batch.test_title;
      }
      appendBatchSections(batch.sections || []);
    }

    let finalizedSections = Array.from(mergedSections.entries())
      .map(([sectionTopic, sectionQuestions]) => ({
        topic: sectionTopic,
        questions: sectionQuestions,
      }))
      .filter((section) => section.questions.length > 0);

    let currentCount = finalizedSections.reduce((total, section) => total + section.questions.length, 0);

    let fillAttempt = 0;
    while (currentCount < desiredQuestionCount && fillAttempt < MAX_FILL_ATTEMPTS) {
      const missingCount = desiredQuestionCount - currentCount;
      const fillBatchSize = Math.min(10, missingCount);
      const fillBatch = await generateBatch(batchSizes.length + fillAttempt, fillBatchSize, finalizedSections.map((section) => section.topic));
      if (!finalTitle && fillBatch.test_title) {
        finalTitle = fillBatch.test_title;
      }

      const beforeCount = currentCount;
      appendBatchSections(fillBatch.sections || []);
      finalizedSections = Array.from(mergedSections.entries())
        .map(([sectionTopic, sectionQuestions]) => ({
          topic: sectionTopic,
          questions: sectionQuestions,
        }))
        .filter((section) => section.questions.length > 0);
      currentCount = finalizedSections.reduce((total, section) => total + section.questions.length, 0);

      if (currentCount === beforeCount) {
        fillAttempt += 1;
        continue;
      }

      await sleep(350);
      fillAttempt += 1;
    }

    if (currentCount < desiredQuestionCount) {
      return new Response(JSON.stringify({
        error: "AI returned too few questions",
        got: currentCount,
        expected: desiredQuestionCount,
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let remainingQuestions = desiredQuestionCount;
    finalizedSections = finalizedSections
      .map((section) => {
        if (remainingQuestions <= 0) {
          return { ...section, questions: [] };
        }

        const limitedQuestions = section.questions.slice(0, remainingQuestions);
        remainingQuestions -= limitedQuestions.length;
        return {
          ...section,
          questions: limitedQuestions,
        };
      })
      .filter((section) => section.questions.length > 0);

    let absoluteQuestionIndex = 0;
    const flattenedQuestions = finalizedSections.flatMap((section, sectionIndex) =>
      section.questions.map((question, questionIndex) => {
        absoluteQuestionIndex += 1;
        return {
          ...question,
          id: `q-${absoluteQuestionIndex}`,
          topic: section.topic,
          section_index: sectionIndex,
          question_index: questionIndex,
        };
      }),
    );

    if ((finalTitle || topic || subjectName || subjectId) && flattenedQuestions.length > 0 && deviceId) {
      await supabase
        .from("user_tests")
        .delete()
        .eq("device_id", deviceId)
        .eq("subject_id", subjectId);

      await supabase.from("user_tests").insert({
        device_id: deviceId,
        subject_id: subjectId,
        title: finalTitle || `Большой тест по теме ${topic || subjectName || subjectId}`,
        lesson_number: 1,
        questions: flattenedQuestions,
      });
    }

    return new Response(JSON.stringify({
      test_title: finalTitle || `Большой тест по теме ${topic || subjectName || subjectId}`,
      sections: finalizedSections,
      questions: flattenedQuestions,
      question_count: flattenedQuestions.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (String(error) === "Error: RATE_LIMIT") {
      return new Response(JSON.stringify({ error: "Слишком много запросов" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (String(error) === "Error: OUT_OF_CREDITS") {
      return new Response(JSON.stringify({ error: "Лимит исчерпан" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
