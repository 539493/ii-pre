import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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
    const { question, answer, context, subjectId, errorCount } = await req.json();

    if (!question || !answer) {
      return new Response(JSON.stringify({ error: "Missing question or answer" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const errCount = errorCount || 0;
    const supportLevel = errCount === 0 ? "direct" : errCount === 1 ? "detailed" : "very detailed";

    const systemPrompt = `You are a friendly tutor checking a student's answer.
Rules:
- If the answer is correct or mostly correct, respond with {"correct": true, "message": "warm praise message with emojis, then suggest trying more practice problems on this topic"}
- If the answer is wrong, GIVE a clear correct explanation
- Error attempt ${errCount + 1}: give a ${supportLevel} explanation
  - direct: clearly say what is wrong and what the correct answer or correct idea is
  - detailed: explain the correct reasoning step by step in a short, easy format
  - very detailed: explain the full logic slowly and clearly, as if teaching from scratch
- If the exact correct answer is available in context, explicitly include it
- If the exact answer is not explicitly given, provide the most likely correct answer and explain the reasoning
- Structure wrong-answer messages in this style:
  Правильный ответ: ...
  Почему так: ...
  Как запомнить или решить: ...
- Keep the explanation concise but clear: normally 3-6 short lines
- If this is error attempt 3+, add a final supportive line: "Давай вернёмся к этому позже и потом быстро повторим ещё раз 🔄"
- Use the student's language (match the question language)
- Be encouraging and warm, never judgmental
- Use emojis but NEVER narrate emoji names
- Return STRICT JSON only, no markdown wrapping

Subject: ${subjectId || "general"}`;

    const model = Deno.env.get("GEMINI_MODEL") || "gemini-1.5-flash";
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: `Topic context: ${context || "general"}

Question: ${question}
Student's answer: ${answer}
This is attempt #${errCount + 1}

Check if the answer is correct and respond with JSON. If the answer is wrong, give the learner the correct explanation, not just a hint.`,
            }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          response_mime_type: "application/json",
        },
      }),
    });

    const aiJson = await aiRes.json();
    const content = aiJson?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part?.text || "")
      .join("")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { correct: false, message: "Попробуй ещё раз! 💪" };
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
