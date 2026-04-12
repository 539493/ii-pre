import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAllSubjects } from "@/lib/subjects";
import { CheckCircle2, Circle, ChevronRight, Trophy, RotateCcw } from "lucide-react";

const DEVICE_ID_KEY = "ai-tutor-device-id";
function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(DEVICE_ID_KEY, id); }
  return id;
}

interface TestQuestion {
  id: string;
  question: string;
  type: string;
  correct_answer: string;
  hint: string;
}

interface UserTest {
  id: string;
  device_id: string;
  subject_id: string;
  title: string;
  lesson_number: number;
  questions: TestQuestion[];
  results: Record<string, { answer: string; correct: boolean; attempts: number }> | null;
  completed: boolean;
  score: number;
  created_at: string;
}

export default function TestsPage() {
  const [tests, setTests] = useState<UserTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<UserTest | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, { correct: boolean; message: string; attempts: number }>>({});
  const [checking, setChecking] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const subjects = getAllSubjects();
  const deviceId = useMemo(() => getDeviceId(), []);

  useEffect(() => { loadTests(); }, []);

  async function loadTests() {
    const { data } = await supabase
      .from("user_tests")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: true });
    if (data) setTests(data as any);
  }

  const filtered = selectedSubject === "all" ? tests : tests.filter(t => t.subject_id === selectedSubject);
  const grouped = useMemo(() => {
    const map = new Map<string, UserTest[]>();
    for (const t of filtered) {
      const key = t.subject_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [filtered]);

  async function checkAnswer(testId: string, q: TestQuestion) {
    const answer = answers[q.id]?.trim();
    if (!answer) return;
    setChecking(q.id);

    const currentAttempts = (feedback[q.id]?.attempts || 0) + 1;

    try {
      const { data } = await supabase.functions.invoke("quiz-check", {
        body: {
          question: q.question,
          answer,
          context: `Correct answer: ${q.correct_answer}. Hint: ${q.hint}`,
          subjectId: selectedTest?.subject_id,
          errorCount: currentAttempts - 1,
        },
      });

      setFeedback(prev => ({
        ...prev,
        [q.id]: {
          correct: data?.correct || false,
          message: data?.message || (data?.correct ? "Верно! 🎉" : q.hint),
          attempts: currentAttempts,
        },
      }));

      // Save result to test
      if (data?.correct && selectedTest) {
        const newResults = { ...(selectedTest.results || {}), [q.id]: { answer, correct: true, attempts: currentAttempts } };
        const allCorrect = selectedTest.questions.every(qq => newResults[qq.id]?.correct);
        const score = Math.round((Object.values(newResults).filter((r: any) => r.correct).length / selectedTest.questions.length) * 100);

        await supabase.from("user_tests").update({
          results: newResults,
          completed: allCorrect,
          score,
        } as any).eq("id", testId);

        setSelectedTest(prev => prev ? { ...prev, results: newResults as any, completed: allCorrect, score } : null);
        loadTests();
      }
    } catch {
      setFeedback(prev => ({ ...prev, [q.id]: { correct: false, message: "Попробуй ещё раз 💪", attempts: currentAttempts } }));
    }
    setChecking(null);
  }

  if (selectedTest) {
    return (
      <div className="flex h-full flex-col overflow-y-auto p-6">
        <button onClick={() => { setSelectedTest(null); setAnswers({}); setFeedback({}); }} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition">
          ← Назад к тестам
        </button>
        <div className="mb-4">
          <h1 className="text-xl font-bold text-foreground">{selectedTest.title}</h1>
          <p className="text-sm text-muted-foreground">Урок {selectedTest.lesson_number} • {selectedTest.questions.length} вопросов</p>
          {selectedTest.completed && (
            <div className="mt-2 flex items-center gap-2 text-green-400 text-sm">
              <Trophy className="h-4 w-4" /> Пройдено! Результат: {selectedTest.score}%
            </div>
          )}
        </div>

        <div className="space-y-4">
          {selectedTest.questions.map((q, i) => {
            const existingResult = selectedTest.results?.[q.id];
            const fb = feedback[q.id];
            const isCorrect = fb?.correct || existingResult?.correct;

            return (
              <div key={q.id} className={`rounded-2xl border p-4 transition-all ${
                isCorrect ? "border-green-500/30 bg-green-500/5" : "border-border bg-card"
              }`}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-foreground">{q.question}</p>
                    {isCorrect ? (
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        {existingResult ? `Ответ: ${existingResult.answer}` : "Верно!"}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          value={answers[q.id] || ""}
                          onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") checkAnswer(selectedTest.id, q); }}
                          placeholder="Твой ответ..."
                          className="flex-1 rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
                          disabled={checking === q.id}
                        />
                        <button
                          onClick={() => checkAnswer(selectedTest.id, q)}
                          disabled={checking === q.id || !answers[q.id]?.trim()}
                          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                        >
                          {checking === q.id ? "..." : "Проверить"}
                        </button>
                      </div>
                    )}
                    {fb && !fb.correct && (
                      <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-xs text-orange-300">
                        {fb.message}
                        {fb.attempts >= 3 && (
                          <p className="mt-1 text-[10px] opacity-70">💡 Подсказка: {q.hint}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Мои тесты</h1>
        <p className="mt-1 text-sm text-muted-foreground">Попроси в чате «составь план обучения» чтобы создать тесты</p>
      </div>

      {/* Subject filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedSubject("all")}
          className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${selectedSubject === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
        >
          Все
        </button>
        {subjects.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedSubject(s.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${selectedSubject === s.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            {s.icon} {s.name}
          </button>
        ))}
      </div>

      {tests.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm text-muted-foreground">Тестов пока нет</p>
            <p className="text-xs text-muted-foreground mt-1">Напиши в чате предмета «составь план обучения»</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([subjectId, subjectTests]) => {
            const subj = subjects.find(s => s.id === subjectId);
            return (
              <div key={subjectId}>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span>{subj?.icon || "📚"}</span> {subj?.name || subjectId}
                </h2>
                <div className="space-y-2">
                  {subjectTests.map(test => (
                    <button
                      key={test.id}
                      onClick={() => { setSelectedTest(test); setAnswers({}); setFeedback({}); }}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition hover:border-primary/30 ${
                        test.completed ? "border-green-500/20 bg-green-500/5" : "border-border bg-card"
                      }`}
                    >
                      {test.completed ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{test.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Урок {test.lesson_number} • {test.questions.length} вопросов
                          {test.completed && ` • ${test.score}%`}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
