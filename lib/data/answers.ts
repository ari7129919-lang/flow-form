export type AnswerValue = "yes" | "no" | "other";

export type Answer = {
  sessionId: string;
  questionId: string;
  questionOrder: number;
  value: AnswerValue;
  otherText: string | null;
  createdAt: string;
};
