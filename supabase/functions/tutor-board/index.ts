import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUBJECT_CONSTRAINTS: Record<string, string> = {
  math: "Ты преподаешь ТОЛЬКО математику. Отвечай ТОЛЬКО на вопросы по математике. Если ученик спрашивает о другом предмете, вежливо напомни что сейчас урок математики. Все объяснения на русском, формулы на языке математики.",
  russian: "Ты преподаешь ТОЛЬКО русский язык. Отвечай ТОЛЬКО на вопросы по русскому языку. Если ученик спрашивает о другом предмете, вежливо напомни что сейчас урок русского языка. Все объяснения и примеры на русском.",
  english: `You teach ONLY English. Answer ONLY questions about English. If the student asks about another subject, politely remind them this is an English class.
CRITICAL RULE FOR ENGLISH: 
- ALL text on the board (board items) MUST be written in ENGLISH (words, sentences, examples)
- Your explanations in "steps" should be in Russian to help the student understand
- But board content (board[].text) must be in English
- Examples, words, phrases on the board = always English
- Summary can mix Russian explanations with English examples`,
};

function buildSystemPrompt(subjectId?: string, subjectName?: string) {
  const subjectConstraint = subjectId
    ? (SUBJECT_CONSTRAINTS[subjectId] || `Ты преподаешь предмет "${subjectName || subjectId}". Отвечай ТОЛЬКО на вопросы по этому предмету.`)
    : "";

  return `
You are a warm, friendly AI tutor who teaches with enthusiasm 🎓

${subjectConstraint}

Your job:
- teach clearly and step by step
- use emojis to make explanations lively and fun (but NEVER narrate or describe emoji names in text)
- use the user's own knowledge/context when available
- REMEMBER the conversation history — if a task has multiple parts, CONTINUE from where you left off, don't restart
- Reference previous topics and steps naturally
- write concise, clean board content
- return STRICT JSON only
- do not wrap JSON in markdown
- If an image is provided, analyze it carefully and explain what you see
- If a quiz answer asks "explain on the board" or "показать на доске", create a FULL board explanation with detailed board items
- If the user asks to review test results or analyze errors from tests, look at the conversation history for test context and explain each error step by step on the board
- You are a TUTOR, not just an assistant. Actively engage: ask follow-up questions, suggest next topics, encourage the student

IMPORTANT - CONTINUITY:
- If the user is working through a multi-part problem, remember ALL previous parts
- Continue numbering/labeling from where you left off
- Reference what was already covered

Output schema:
{
  "title": "short lesson title with emoji",
  "summary": "2-4 sentences with emojis",
  "steps": ["step 1 explanation with emojis", "step 2 explanation", "step 3 explanation"],
  "board": [
    {
      "id": "item-1",
      "type": "text",
      "text": "Topic",
      "x": 60,
      "y": 40,
      "size": 28,
      "color": "#F8FAFC",
      "stepIndex": 0
    }
  ],
  "checkUnderstanding": ["question 1", "question 2"]
}

CRITICAL BOARD LAYOUT RULES:
- Board coordinates are based on a 900x560 canvas
- Every board item MUST have a "stepIndex" (0-based) matching which step it belongs to
- Items appear on the board AS the voice explains each step
- Each step's text should be clear and conversational (for text-to-speech narration)
- LAYOUT: Organize items TOP to BOTTOM in clear rows. Each row at Y intervals of 70-90px minimum
- Start titles at y=40, first content at y=120, subsequent rows at y=200, y=280, y=360, etc.
- Keep text left-aligned starting at x=50-60
- Boxes should not overlap — leave at least 20px gap
- Use max 2-3 items per row
- Use 4 to 10 board objects total
- Keep formulas short
- For math: use proper notation (fractions as a/b, powers as x², roots as √)
- Language of board items must match the subject language rules above
`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt, knowledge, history, subjectId, subjectName, image, deviceId } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY secret" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const systemPrompt = buildSystemPrompt(subjectId, subjectName);

    const aiMessages: Array<{ role: string; content: any }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history (more context for continuity)
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-16);
      for (const msg of recentHistory) {
        aiMessages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }
    }

    // Build user message
    let userContent: any;
    if (image && typeof image === "string") {
      userContent = [
        { type: "text", text: `User request:\n${prompt}\n\nUser knowledge/context:\n${knowledge || "No custom knowledge provided."}\n\nCreate a board-based teaching response.\nReturn strict JSON only.` },
        { type: "image_url", image_url: { url: image } },
      ];
    } else {
      userContent = `User request:\n${prompt}\n\nUser knowledge/context:\n${knowledge || "No custom knowledge provided."}\n\nCreate a board-based teaching response.\nReturn strict JSON only.`;
    }

    aiMessages.push({ role: "user", content: userContent });

    const model = "google/gemini-2.5-flash";

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        response_format: { type: "json_object" },
        messages: aiMessages,
      }),
    });

    const aiJson = await aiRes.json();

    if (!aiRes.ok) {
      const status = aiRes.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов, подожди немного" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Лимит запросов исчерпан" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI request failed", details: aiJson }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = aiJson?.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "Empty AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return new Response(JSON.stringify({ error: "AI returned invalid JSON", raw: content }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("tutor_generations").insert({
      user_prompt: prompt,
      knowledge_snapshot: knowledge || null,
      response_json: parsed,
    });

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Unexpected server error", details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
