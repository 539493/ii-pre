import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_QUESTION_COUNT = 100;
const MAX_QUESTION_COUNT = 100;
const MIN_QUESTION_COUNT = 20;
const MAX_BATCH_SIZE = 25;

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
  if (!directMatch) return DEFAULT_QUESTION_COUNT;

  const requested = Number(directMatch[1]);
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
    const { subjectId, subjectName, topic, deviceId, history } = await req.json();

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
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

    const desiredQuestionCount = parseDesiredQuestionCount(topic);
    const batchSizes = buildBatchSizes(desiredQuestionCount);

    const baseSystemPrompt = `You are a test generator for subject: ${subjectName || subjectId}.
Based on the student's learning history and progress, create parts of ONE complete test.

${progressContext}
${historyContext}

The final result must become ONE standalone test with about ${desiredQuestionCount} questions in total.
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
- Use type "text" unless another simple type is absolutely necessary`;

    async function generateBatch(batchIndex: number, batchSize: number, existingTopics: string[]) {
      const userPrompt = topic
        ? `Create batch ${batchIndex + 1} of ${batchSizes.length} for the topic "${topic}".
Generate about ${batchSize} questions for this batch.
Avoid repeating these already covered topics if possible: ${existingTopics.join(", ") || "none"}.
Keep the questions suitable for one large final test.`
        : `Create batch ${batchIndex + 1} of ${batchSizes.length} for one large comprehensive test.
Generate about ${batchSize} questions for this batch.
Avoid repeating these already covered topics if possible: ${existingTopics.join(", ") || "none"}.
Keep the questions suitable for one large final test.`;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          temperature: 0.4,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: baseSystemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!aiRes.ok) {
        if (aiRes.status === 429) throw new Error("RATE_LIMIT");
        if (aiRes.status === 402) throw new Error("OUT_OF_CREDITS");
        throw new Error(`AI_ERROR_${aiRes.status}`);
      }

      const aiJson = await aiRes.json();
      const content = aiJson?.choices?.[0]?.message?.content;
      try {
        return JSON.parse(content) as GeneratedBatch;
      } catch {
        throw new Error("INVALID_AI_JSON");
      }
    }

    const mergedSections = new Map<string, GeneratedQuestion[]>();
    let finalTitle = "";
    let absoluteQuestionIndex = 0;

    for (let batchIndex = 0; batchIndex < batchSizes.length; batchIndex += 1) {
      const batch = await generateBatch(batchIndex, batchSizes[batchIndex], Array.from(mergedSections.keys()));
      if (!finalTitle && batch.test_title) {
        finalTitle = batch.test_title;
      }

      for (const rawSection of batch.sections || []) {
        const topicName = normalizeTopicName(rawSection?.topic || "", mergedSections.size);
        if (!mergedSections.has(topicName)) {
          mergedSections.set(topicName, []);
        }

        for (const rawQuestion of rawSection?.questions || []) {
          mergedSections.get(topicName)!.push({
            ...rawQuestion,
            id: `q-${absoluteQuestionIndex + 1}`,
            type: rawQuestion.type || "text",
          });
          absoluteQuestionIndex += 1;
        }
      }
    }

    const finalizedSections = Array.from(mergedSections.entries())
      .map(([sectionTopic, sectionQuestions]) => ({
        topic: sectionTopic,
        questions: sectionQuestions,
      }))
      .filter((section) => section.questions.length > 0);

    const flattenedQuestions = finalizedSections.flatMap((section, sectionIndex) =>
      section.questions.map((question, questionIndex) => ({
        ...question,
        topic: section.topic,
        section_index: sectionIndex,
        question_index: questionIndex,
      })),
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
