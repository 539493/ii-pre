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
