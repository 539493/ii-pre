export type BoardTextItem = {
  id: string;
  type: "text" | "formula";
  text: string;
  x: number;
  y: number;
  size?: number;
  color?: string;
  stepIndex?: number;
};

export type BoardBoxItem = {
  id: string;
  type: "box";
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  textColor?: string;
  stepIndex?: number;
};

export type BoardArrowItem = {
  id: string;
  type: "arrow";
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color?: string;
  stepIndex?: number;
};

export type BoardItem = BoardTextItem | BoardBoxItem | BoardArrowItem;

export type TutorResponse = {
  title: string;
  summary: string;
  steps: string[];
  board: BoardItem[];
  checkUnderstanding: string[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  result?: TutorResponse;
  timestamp: Date;
  imageUrl?: string;
};

export type ChatHistoryEntry = {
  role: ChatMessage["role"];
  content: string;
};

export type KnowledgeItem = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

export type Subject = {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
};

export type ProgressRecord = {
  id: string;
  subject_id: string;
  topic: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  created_at: string;
};

export type QuizFeedbackItem = {
  correct: boolean;
  message: string;
  errorCount?: number;
  skipped?: boolean;
  postponed?: boolean;
};

export type QuizCheckResponse = {
  correct: boolean;
  message: string;
};

export type TestAnswerFeedback = QuizCheckResponse & {
  attempts: number;
};

export type TestQuestion = {
  id: string;
  question: string;
  type: string;
  correct_answer: string;
  hint: string;
  topic?: string;
  section_index?: number;
  question_index?: number;
};

export type TestResultItem = {
  answer: string;
  correct: boolean;
  attempts: number;
};

export type TestSection = {
  topic: string;
  questions: TestQuestion[];
};

export type UserTest = {
  id: string;
  device_id: string;
  subject_id: string;
  title: string;
  lesson_number: number;
  questions: TestQuestion[];
  results: Record<string, TestResultItem> | null;
  completed: boolean;
  score: number;
  created_at: string;
};

export type GeneratedTestResponse = {
  test_title: string;
  sections: TestSection[];
  questions: TestQuestion[];
  question_count: number;
};

export type Profile = {
  name: string;
  age: string;
  grade: string;
  bio: string;
  educationLevel: string;
  studyGoal: string;
  interests: string[];
  notificationsEnabled: boolean;
  memberSince: string;
};
