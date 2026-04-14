import crypto from "crypto";
import type { Answer } from "@/lib/data/answers";
import type { Event, Form, Question, Session } from "@/lib/data/types";

function id() {
  return crypto.randomUUID();
}

const nowIso = () => new Date().toISOString();

const forms: Form[] = [
  {
    id: "form_demo",
    slug: "demo",
    name: "טופס דמו",
    welcomeTitle: "שלום! 👋",
    welcomeSubtitle: "בוא נתחיל בכמה שאלות קצרות.",
    completionTitle: "תודה! הטופס התקבל",
    completionSubtitle: "אפשר לסגור את החלון.",
    chatCopy: {
      introTitle: "שלום! 👋",
      introSubtitle: "כדי להתחיל נבקש כמה פרטים ואז נשלח קוד אימות למייל.",
      askName: "מה שמך? (לא חובה)",
      askEmail: "מה המייל שנשלח אליו קוד אימות?",
      askPhone: "מה מספר הטלפון שלך?",
      otpPrompt: "שלחתי קוד אימות למייל — הזן אותו כאן:",
    },
    nudges: [],
    nudgeQuestionOrder: 25,
    nudgeText: "יפה מאוד! עוד מעט וסיימת 🙌",
  },
];

const questions: Question[] = Array.from({ length: 30 }).map((_, i) => ({
  id: `q_${i + 1}`,
  formId: "form_demo",
  order: i + 1,
  text: `שאלה ${i + 1}`,
  required: true,
  allowOther: true,
}));

type MockState = {
  sessions: Session[];
  events: Event[];
  answers: Answer[];
};

const g = globalThis as unknown as {
  __ffMockState?: MockState;
};

const state: MockState =
  g.__ffMockState ??
  (g.__ffMockState = {
    sessions: [],
    events: [],
    answers: [],
  });

const sessions = state.sessions;
const events = state.events;
const answers = state.answers;

export const mockStore = {
  resetAll() {
    forms.splice(0, forms.length);
    questions.splice(0, questions.length);
    sessions.splice(0, sessions.length);
    events.splice(0, events.length);
    answers.splice(0, answers.length);
  },
  resetResponsesOnly() {
    sessions.splice(0, sessions.length);
    events.splice(0, events.length);
    answers.splice(0, answers.length);
  },
  listSessions() {
    return [...sessions];
  },
  listForms() {
    return [...forms].sort((a, b) => a.slug.localeCompare(b.slug));
  },
  getFormBySlug(slug: string) {
    return forms.find((f) => f.slug === slug) ?? null;
  },
  getFormById(formId: string) {
    return forms.find((f) => f.id === formId) ?? null;
  },
  createForm(args: { name: string; slug: string }) {
    const row: Form = {
      id: id(),
      slug: args.slug,
      name: args.name,
      welcomeTitle: "שלום! 👋",
      welcomeSubtitle: "בוא נתחיל בכמה שאלות קצרות.",
      completionTitle: "תודה! הטופס התקבל",
      completionSubtitle: "אפשר לסגור את החלון.",
      chatCopy: {
        introTitle: "שלום! 👋",
        introSubtitle: "כדי להתחיל נבקש כמה פרטים ואז נשלח קוד אימות למייל.",
        askName: "מה שמך? (לא חובה)",
        askEmail: "מה המייל שנשלח אליו קוד אימות?",
        askPhone: "מה מספר הטלפון שלך?",
        otpPrompt: "שלחתי קוד אימות למייל — הזן אותו כאן:",
      },
      nudges: [],
      nudgeQuestionOrder: null,
      nudgeText: null,
    };
    forms.push(row);
    return row;
  },
  updateForm(formId: string, patch: Partial<Omit<Form, "id">>) {
    const idx = forms.findIndex((f) => f.id === formId);
    if (idx < 0) return null;
    forms[idx] = { ...forms[idx], ...patch, id: forms[idx].id };
    return forms[idx];
  },
  deleteForm(formId: string) {
    const idx = forms.findIndex((f) => f.id === formId);
    if (idx < 0) return false;
    forms.splice(idx, 1);
    for (let i = questions.length - 1; i >= 0; i--) {
      if (questions[i].formId === formId) questions.splice(i, 1);
    }
    return true;
  },
  getQuestionsByFormId(formId: string) {
    return questions.filter((q) => q.formId === formId).sort((a, b) => a.order - b.order);
  },
  createQuestion(args: { formId: string; order: number; text: string; required: boolean; allowOther: boolean }) {
    const row: Question = {
      id: id(),
      formId: args.formId,
      order: args.order,
      text: args.text,
      required: args.required,
      allowOther: args.allowOther,
    };
    questions.push(row);
    return row;
  },
  updateQuestion(questionId: string, patch: Partial<Omit<Question, "id" | "formId">>) {
    const idx = questions.findIndex((q) => q.id === questionId);
    if (idx < 0) return null;
    questions[idx] = { ...questions[idx], ...patch, id: questions[idx].id, formId: questions[idx].formId };
    return questions[idx];
  },
  deleteQuestion(questionId: string) {
    const idx = questions.findIndex((q) => q.id === questionId);
    if (idx < 0) return false;
    questions.splice(idx, 1);
    for (let i = answers.length - 1; i >= 0; i--) {
      if (answers[i].questionId === questionId) answers.splice(i, 1);
    }
    return true;
  },
  createSession(args: {
    formId: string;
    name: string | null;
    email: string;
    phone: string | null;
    otpHash: string;
    otpExpiresAt: string;
  }) {
    const s: Session = {
      id: id(),
      formId: args.formId,
      name: args.name,
      email: args.email,
      phone: args.phone,
      status: "started",
      otpHash: args.otpHash,
      otpExpiresAt: args.otpExpiresAt,
      verifiedAt: null,
      currentQuestionOrder: 0,
      createdAt: nowIso(),
      completedAt: null,
    };
    sessions.push(s);
    return s;
  },
  getSession(sessionId: string) {
    return sessions.find((s) => s.id === sessionId) ?? null;
  },
  setSessionPhone(sessionId: string, phone: string) {
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) return null;
    s.phone = phone;
    return s;
  },
  verifySession(sessionId: string) {
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) return null;
    s.status = "verified";
    s.verifiedAt = nowIso();
    return s;
  },
  getAnswersBySessionId(sessionId: string) {
    return answers
      .filter((a) => a.sessionId === sessionId)
      .sort((a, b) => a.questionOrder - b.questionOrder);
  },
  upsertAnswer(args: {
    sessionId: string;
    questionId: string;
    questionOrder: number;
    value: "yes" | "no" | "other";
    otherText: string | null;
  }) {
    const existingIdx = answers.findIndex(
      (a) => a.sessionId === args.sessionId && a.questionId === args.questionId,
    );
    const row: Answer = {
      sessionId: args.sessionId,
      questionId: args.questionId,
      questionOrder: args.questionOrder,
      value: args.value,
      otherText: args.otherText,
      createdAt: nowIso(),
    };
    if (existingIdx >= 0) answers[existingIdx] = row;
    else answers.push(row);

    const s = sessions.find((x) => x.id === args.sessionId);
    if (s) s.currentQuestionOrder = Math.max(s.currentQuestionOrder, args.questionOrder);

    return row;
  },
  completeSession(sessionId: string) {
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) return null;
    s.status = "completed";
    s.completedAt = nowIso();
    return s;
  },
  listCompletedSessions() {
    return sessions
      .filter((s) => s.status === "completed")
      .sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt));
  },
  getSessionReport(sessionId: string) {
    const s = sessions.find((x) => x.id === sessionId) ?? null;
    if (!s) return null;
    const qs = questions.filter((q) => q.formId === s.formId).sort((a, b) => a.order - b.order);
    const ans = answers
      .filter((a) => a.sessionId === sessionId)
      .sort((a, b) => a.questionOrder - b.questionOrder);
    return { session: s, questions: qs, answers: ans };
  },
  addEvent(args: { sessionId: string; type: string; questionOrder?: number | null; meta?: Record<string, unknown> | null }) {
    const e: Event = {
      id: id(),
      sessionId: args.sessionId,
      type: args.type,
      questionOrder: args.questionOrder ?? null,
      meta: args.meta ?? null,
      createdAt: nowIso(),
    };
    events.push(e);
    return e;
  },
};
