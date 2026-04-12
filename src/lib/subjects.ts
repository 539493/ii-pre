import { Subject } from "@/types/tutor";

export const DEFAULT_SUBJECTS: Subject[] = [
  {
    id: "math",
    name: "Математика",
    icon: "📐",
    color: "234 89% 74%",
    description: "Алгебра, геометрия, арифметика и анализ",
  },
  {
    id: "russian",
    name: "Русский язык",
    icon: "📝",
    color: "142 71% 45%",
    description: "Грамматика, орфография, пунктуация и стилистика",
  },
  {
    id: "english",
    name: "Английский язык",
    icon: "🇬🇧",
    color: "24 95% 53%",
    description: "Grammar, vocabulary, reading and writing",
  },
];

const CUSTOM_SUBJECTS_KEY = "ai-tutor-custom-subjects";

export function getCustomSubjects(): Subject[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SUBJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomSubject(subject: Subject) {
  const existing = getCustomSubjects();
  existing.push(subject);
  localStorage.setItem(CUSTOM_SUBJECTS_KEY, JSON.stringify(existing));
}

export function removeCustomSubject(id: string) {
  const existing = getCustomSubjects().filter((s) => s.id !== id);
  localStorage.setItem(CUSTOM_SUBJECTS_KEY, JSON.stringify(existing));
}

export function getAllSubjects(): Subject[] {
  return [...DEFAULT_SUBJECTS, ...getCustomSubjects()];
}

export function getSubjectById(id: string): Subject | undefined {
  return getAllSubjects().find((s) => s.id === id);
}

export function getSubjectSystemPromptConstraint(subject: Subject): string {
  const subjectMap: Record<string, string> = {
    math: "Ты преподаешь ТОЛЬКО математику. Отвечай ТОЛЬКО на вопросы по математике (алгебра, геометрия, арифметика, анализ). Если ученик спрашивает о другом предмете, вежливо напомни что сейчас урок математики.",
    russian: "Ты преподаешь ТОЛЬКО русский язык. Отвечай ТОЛЬКО на вопросы по русскому языку (грамматика, орфография, пунктуация, литература). Если ученик спрашивает о другом предмете, вежливо напомни что сейчас урок русского языка.",
    english: "You teach ONLY English. Answer ONLY questions about English (grammar, vocabulary, reading, writing). If the student asks about another subject, politely remind them this is an English class. Explain in Russian but use English examples.",
  };
  return subjectMap[subject.id] || `Ты преподаешь предмет "${subject.name}". Отвечай ТОЛЬКО на вопросы по этому предмету. Если ученик спрашивает о другом, вежливо напомни какой сейчас урок.`;
}
