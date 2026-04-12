import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

    // Get existing progress to tailor tests
    const { data: progress } = await supabase
      .from("progress_records")
      .select("*")
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false })
      .limit(50);

    const progressContext = progress?.length
      ? `Student progress:\n${progress.map(p => `- ${p.topic}: ${p.correct_answers}/${p.total_questions} correct`).join("\n")}`
      : "No previous progress data.";

    const historyContext = Array.isArray(history) && history.length
      ? `Recent chat topics:\n${history.slice(-10).map((h: any) => `- ${h.content}`).join("\n")}`
      : "";

    const systemPrompt = `You are a test generator for subject: ${subjectName || subjectId}.
Based on the student's learning history and progress, create a structured study plan with tests.

${progressContext}
${historyContext}

Generate 3-5 test lessons, each with 3-5 questions.
Each test is a lesson in a learning plan.

Return STRICT JSON only:
{
  "plan_title": "название плана обучения",
  "lessons": [
    {
      "lesson_number": 1,
      "title": "Название урока с эмодзи",
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
- Include emojis in titles`;

    const userPrompt = topic
      ? `Create a test plan for the topic: "${topic}"`
      : `Create a comprehensive test plan based on what the student has been learning`;

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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const status = aiRes.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Лимит исчерпан" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content;
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid AI JSON" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save tests to DB
    if (parsed.lessons && deviceId) {
      for (const lesson of parsed.lessons) {
        await supabase.from("user_tests").insert({
          device_id: deviceId,
          subject_id: subjectId,
          title: lesson.title,
          lesson_number: lesson.lesson_number,
          questions: lesson.questions,
        });
      }
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
