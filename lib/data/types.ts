export type Form = {
  id: string;
  slug: string;
  name: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  completionTitle: string;
  completionSubtitle: string;
  chatCopy: {
    introTitle: string;
    introSubtitle: string;
    askName: string;
    askEmail: string;
    askPhone: string;
    otpPrompt: string;
  };
  nudges: Array<{ atQuestionOrder: number; text: string }>;
  nudgeQuestionOrder: number | null;
  nudgeText: string | null;
};

export type Question = {
  id: string;
  formId: string;
  order: number;
  text: string;
  required: boolean;
  allowOther: boolean;
};

export type Session = {
  id: string;
  formId: string;
  name: string | null;
  email: string;
  phone: string | null;
  status: "started" | "verified" | "completed";
  otpHash: string | null;
  otpExpiresAt: string | null;
  verifiedAt: string | null;
  currentQuestionOrder: number;
  createdAt: string;
  completedAt: string | null;
  treatmentStatus: "untreated" | "treated" | "reviewing";
  treatmentNote: string | null;
  treatedAt: string | null;
};

export type Event = {
  id: string;
  sessionId: string;
  type: string;
  questionOrder: number | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
};
