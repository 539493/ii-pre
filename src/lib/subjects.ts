import { Subject } from "@/types/tutor";

export const DEFAULT_SUBJECTS: Subject[] = [];

const CUSTOM_SUBJECTS_KEY = "ai-tutor-custom-subjects";
const FALLBACK_SUBJECT_ICON = "📚";
const FALLBACK_SUBJECT_COLOR = "266 58% 58%";
const FALLBACK_SUBJECT_DESCRIPTION = "Персональный курс и учебные материалы";

type SubjectSuggestion = Pick<Subject, "icon" | "color" | "description"> & {
  templateLabel: string;
  examplePrompt: string;
};

function isSubject(value: unknown): value is Subject {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.icon === "string" &&
    typeof candidate.color === "string" &&
    typeof candidate.description === "string"
  );
}

function normalizeSubjectName(name: string) {
  return name.trim().toLowerCase();
}

function hasKeyword(name: string, keywords: string[]) {
  return keywords.some((keyword) => name.includes(keyword));
}

const LANGUAGE_SUGGESTIONS: Array<{ keywords: string[]; suggestion: SubjectSuggestion }> = [
  {
    keywords: ["англ", "english"],
    suggestion: {
      icon: "🇬🇧",
      color: "214 84% 56%",
      description: "Грамматика, словарь, чтение и разговорная практика",
      templateLabel: "Языковой шаблон",
      examplePrompt: "Объясни Present Perfect и дай 5 примеров",
    },
  },
  {
    keywords: ["русск", "russian"],
    suggestion: {
      icon: "🇷🇺",
      color: "220 70% 50%",
      description: "Грамматика, орфография, пунктуация и работа с текстом",
      templateLabel: "Языковой шаблон",
      examplePrompt: "Разбери правило про причастные обороты",
    },
  },
  {
    keywords: ["немец", "german", "deutsch"],
    suggestion: {
      icon: "🇩🇪",
      color: "42 93% 52%",
      description: "Грамматика, лексика и практика письменной речи",
      templateLabel: "Языковой шаблон",
      examplePrompt: "Объясни порядок слов в немецком предложении",
    },
  },
  {
    keywords: ["франц", "french", "francais", "français"],
    suggestion: {
      icon: "🇫🇷",
      color: "221 83% 57%",
      description: "Лексика, понимание речи и письменная практика",
      templateLabel: "Языковой шаблон",
      examplePrompt: "Разбери спряжение etre и avoir",
    },
  },
  {
    keywords: ["испан", "spanish", "espanol", "español"],
    suggestion: {
      icon: "🇪🇸",
      color: "18 92% 56%",
      description: "Базовая грамматика, слова и разговорные конструкции",
      templateLabel: "Языковой шаблон",
      examplePrompt: "Объясни разницу между ser и estar",
    },
  },
  {
    keywords: ["италь", "italian"],
    suggestion: {
      icon: "🇮🇹",
      color: "144 61% 42%",
      description: "Словарь, грамматика и разговорная практика",
      templateLabel: "Языковой шаблон",
      examplePrompt: "Покажи базовые конструкции для знакомства",
    },
  },
  {
    keywords: ["кита", "chinese", "mandarin"],
    suggestion: {
      icon: "🇨🇳",
      color: "2 79% 58%",
      description: "Иероглифы, лексика и понимание базовых конструкций",
      templateLabel: "Языковой шаблон",
      examplePrompt: "Объясни тоны и приведи простые примеры",
    },
  },
  {
    keywords: ["япон", "japanese"],
    suggestion: {
      icon: "🇯🇵",
      color: "348 75% 58%",
      description: "Письменность, лексика и разговорные шаблоны",
      templateLabel: "Языковой шаблон",
      examplePrompt: "Объясни хирагану и как начать читать",
    },
  },
  {
    keywords: ["корей", "korean"],
    suggestion: {
      icon: "🇰🇷",
      color: "210 76% 55%",
      description: "Алфавит, лексика и построение фраз",
      templateLabel: "Языковой шаблон",
      examplePrompt: "Покажи, как устроен хангыль",
    },
  },
  {
    keywords: ["араб", "arabic"],
    suggestion: {
      icon: "🇸🇦",
      color: "142 64% 38%",
      description: "Письмо, чтение и грамматические конструкции",
      templateLabel: "Языковой шаблон",
      examplePrompt: "Объясни алфавит и направление письма",
    },
  },
];

const SUBJECT_SUGGESTIONS: Array<{ keywords: string[]; suggestion: SubjectSuggestion }> = [
  {
    keywords: ["матем", "алгеб", "геометр", "тригоном", "calculus", "math", "algebra", "geometry"],
    suggestion: {
      icon: "📐",
      color: "234 89% 74%",
      description: "Формулы, вычисления, геометрия и задачи на логику",
      templateLabel: "Точные науки",
      examplePrompt: "Реши квадратное уравнение по шагам",
    },
  },
  {
    keywords: ["физ", "physics"],
    suggestion: {
      icon: "⚛️",
      color: "212 83% 61%",
      description: "Законы, формулы, расчеты и понимание процессов",
      templateLabel: "Точные науки",
      examplePrompt: "Объясни второй закон Ньютона простыми словами",
    },
  },
  {
    keywords: ["хим", "chemistry"],
    suggestion: {
      icon: "🧪",
      color: "160 65% 45%",
      description: "Реакции, формулы веществ и практические задачи",
      templateLabel: "Естественные науки",
      examplePrompt: "Покажи, как составлять химические уравнения",
    },
  },
  {
    keywords: ["биолог", "biology"],
    suggestion: {
      icon: "🧬",
      color: "142 59% 44%",
      description: "Организмы, процессы, схемы и терминология",
      templateLabel: "Естественные науки",
      examplePrompt: "Объясни фотосинтез на понятной схеме",
    },
  },
  {
    keywords: ["истори", "history"],
    suggestion: {
      icon: "🏛️",
      color: "32 75% 56%",
      description: "События, даты, контекст и причинно-следственные связи",
      templateLabel: "Гуманитарный шаблон",
      examplePrompt: "Разбери причины и последствия события по пунктам",
    },
  },
  {
    keywords: ["географ", "geography"],
    suggestion: {
      icon: "🗺️",
      color: "191 73% 42%",
      description: "Карты, регионы, климат и природные процессы",
      templateLabel: "Гуманитарный шаблон",
      examplePrompt: "Объясни климатические пояса с примерами",
    },
  },
  {
    keywords: ["литератур", "literature"],
    suggestion: {
      icon: "📚",
      color: "18 78% 58%",
      description: "Произведения, анализ текста и авторские особенности",
      templateLabel: "Гуманитарный шаблон",
      examplePrompt: "Разбери образ героя и главную мысль текста",
    },
  },
  {
    keywords: ["информат", "программ", "код", "computer", "coding", "programming", "informatics"],
    suggestion: {
      icon: "💻",
      color: "221 83% 57%",
      description: "Алгоритмы, код, структуры данных и практика",
      templateLabel: "Технологический шаблон",
      examplePrompt: "Объясни цикл и покажи короткий пример кода",
    },
  },
  {
    keywords: ["эконом", "finance", "финанс"],
    suggestion: {
      icon: "📈",
      color: "146 63% 40%",
      description: "Показатели, расчеты, логика решений и аналитика",
      templateLabel: "Аналитический шаблон",
      examplePrompt: "Объясни тему через таблицу и короткий расчет",
    },
  },
  {
    keywords: ["прав", "юрис", "law"],
    suggestion: {
      icon: "⚖️",
      color: "35 74% 52%",
      description: "Понятия, нормы, кейсы и структурированное мышление",
      templateLabel: "Аналитический шаблон",
      examplePrompt: "Разбери норму права на простом примере",
    },
  },
  {
    keywords: ["музык", "music"],
    suggestion: {
      icon: "🎼",
      color: "282 61% 57%",
      description: "Теория, ритм, формы и музыкальная практика",
      templateLabel: "Творческий шаблон",
      examplePrompt: "Покажи тему через схему и короткие упражнения",
    },
  },
  {
    keywords: ["рисован", "дизайн", "art", "drawing", "paint"],
    suggestion: {
      icon: "🎨",
      color: "334 78% 63%",
      description: "Композиция, визуальный язык, стиль и практика",
      templateLabel: "Творческий шаблон",
      examplePrompt: "Объясни основы композиции на простом примере",
    },
  },
];

export function suggestSubjectAppearance(name: string): SubjectSuggestion {
  const normalized = normalizeSubjectName(name);

  if (!normalized) {
    return {
      icon: FALLBACK_SUBJECT_ICON,
      color: FALLBACK_SUBJECT_COLOR,
      description: FALLBACK_SUBJECT_DESCRIPTION,
      templateLabel: "Универсальный шаблон",
      examplePrompt: "Объясни тему по шагам и дай короткую проверку",
    };
  }

  const languageMatch = LANGUAGE_SUGGESTIONS.find((entry) => hasKeyword(normalized, entry.keywords));
  if (languageMatch) return languageMatch.suggestion;

  if (hasKeyword(normalized, ["язык", "language", "lingua"])) {
    return {
      icon: "🏳️",
      color: "214 84% 56%",
      description: "Грамматика, лексика, чтение и разговорная практика",
      templateLabel: "Языковой шаблон",
      examplePrompt: "Объясни тему и дай 3 коротких задания",
    };
  }

  const subjectMatch = SUBJECT_SUGGESTIONS.find((entry) => hasKeyword(normalized, entry.keywords));
  if (subjectMatch) return subjectMatch.suggestion;

  return {
    icon: FALLBACK_SUBJECT_ICON,
    color: FALLBACK_SUBJECT_COLOR,
    description: FALLBACK_SUBJECT_DESCRIPTION,
    templateLabel: "Универсальный шаблон",
    examplePrompt: "Объясни тему по шагам и дай короткую проверку",
  };
}

export function getSuggestedSubjectName(rawValue: string) {
  const normalized = normalizeSubjectName(rawValue);

  if (hasKeyword(normalized, ["матем", "math", "algebra", "geometry"])) return "Математика";
  if (hasKeyword(normalized, ["русск", "russian"])) return "Русский язык";
  if (hasKeyword(normalized, ["англ", "english"])) return "Английский язык";
  if (hasKeyword(normalized, ["немец", "german", "deutsch"])) return "Немецкий язык";
  if (hasKeyword(normalized, ["франц", "french"])) return "Французский язык";
  if (hasKeyword(normalized, ["испан", "spanish"])) return "Испанский язык";
  if (hasKeyword(normalized, ["физ", "physics"])) return "Физика";
  if (hasKeyword(normalized, ["хим", "chemistry"])) return "Химия";
  if (hasKeyword(normalized, ["биолог", "biology"])) return "Биология";
  if (hasKeyword(normalized, ["истори", "history"])) return "История";
  if (hasKeyword(normalized, ["географ", "geography"])) return "География";
  if (hasKeyword(normalized, ["информат", "programming", "coding", "computer"])) return "Информатика";
  if (normalized.startsWith("custom-")) return "Предмет";

  return rawValue;
}

export function isFormulaSubject(subject: Subject | string) {
  const normalized = typeof subject === "string" ? normalizeSubjectName(subject) : normalizeSubjectName(subject.name);
  return hasKeyword(normalized, [
    "матем",
    "алгеб",
    "геометр",
    "тригоном",
    "анализ",
    "физ",
    "статист",
    "math",
    "algebra",
    "geometry",
    "physics",
    "calculus",
  ]);
}

export function getCustomSubjects(): Subject[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SUBJECTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isSubject) : [];
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
  return getCustomSubjects();
}

export function getSubjectById(id: string): Subject | undefined {
  return getAllSubjects().find((s) => s.id === id);
}

export function getSubjectSystemPromptConstraint(subject: Subject): string {
  const normalized = normalizeSubjectName(subject.name);

  if (hasKeyword(normalized, ["матем", "алгеб", "геометр", "тригоном", "анализ", "math", "algebra", "geometry"])) {
    return "Ты преподаешь ТОЛЬКО математику. Отвечай ТОЛЬКО на вопросы по математике (алгебра, геометрия, арифметика, анализ). Если ученик спрашивает о другом предмете, вежливо напомни что сейчас урок математики.";
  }

  if (hasKeyword(normalized, ["русск", "russian"])) {
    return "Ты преподаешь ТОЛЬКО русский язык. Отвечай ТОЛЬКО на вопросы по русскому языку (грамматика, орфография, пунктуация, литература). Если ученик спрашивает о другом предмете, вежливо напомни что сейчас урок русского языка.";
  }

  if (hasKeyword(normalized, ["англ", "english"])) {
    return "You teach ONLY English. Answer ONLY questions about English (grammar, vocabulary, reading, writing). If the student asks about another subject, politely remind them this is an English class. Explain in Russian but use English examples.";
  }

  return `Ты преподаешь предмет "${subject.name}". Отвечай ТОЛЬКО на вопросы по этому предмету. Если ученик спрашивает о другом, вежливо напомни какой сейчас урок.`;
}
