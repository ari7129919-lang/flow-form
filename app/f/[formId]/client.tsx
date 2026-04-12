"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  LockKeyhole,
  MessageCircle,
  Send,
  ShieldCheck,
} from "lucide-react";

type Msg = {
  id: string;
  from: "bot" | "user";
  text: string;
  subtle?: boolean;
  atIso?: string;
  kind?: "text" | "typing";
};

type Bootstrap = {
  form: {
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
  questions: Array<{
    id: string;
    order: number;
    text: string;
    required: boolean;
    allowOther: boolean;
  }>;
};

type AnswerValue = "yes" | "no" | "other";

function digitsOnly(v: string) {
  return v.replace(/\D/g, "");
}

function fmtTime(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

function bubbleClass(from: Msg["from"]) {
  if (from === "user") {
    return "bg-emerald-600 text-white rounded-2xl rounded-br-md";
  }
  return "bg-white text-zinc-900 rounded-2xl rounded-bl-md border border-zinc-200";
}

function normalizeEmail(v: string) {
  return v
    .trim()
    .replace(/[\s\u200e\u200f\u202a-\u202e]/g, "")
    .toLowerCase();
}

export default function FormChatClient({ formSlug }: { formSlug: string }) {
  const [stage, setStage] = useState<
    | "collect_intro"
    | "collect_name"
    | "collect_email"
    | "collect_phone"
    | "sending"
    | "await_code"
    | "verifying"
    | "loading_form"
    | "question"
    | "done"
  >("collect_intro");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifiedOkAtIso, setVerifiedOkAtIso] = useState<string | null>(null);
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [history, setHistory] = useState<
    Array<{
      questionId: string;
      questionOrder: number;
      questionText: string;
      answerText: string;
      atIso: string;
    }>
  >([]);
  const [pendingOtherText, setPendingOtherText] = useState("");
  const [pendingValue, setPendingValue] = useState<AnswerValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [typing, setTyping] = useState(false);
  const [questionShownAtIso, setQuestionShownAtIso] = useState<string | null>(null);
  const [botStatus, setBotStatus] = useState<string>("מאובטח");
  const [progressPulse, setProgressPulse] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const bootRes = await fetch(`/api/form/bootstrap?formSlug=${encodeURIComponent(formSlug)}`);
        if (!bootRes.ok) return;
        const boot = (await bootRes.json()) as Bootstrap;
        setBootstrap(boot);
      } catch {
        // ignore
      }
    })();
  }, [formSlug]);

  const chatCopy =
    bootstrap?.form.chatCopy ??
    ({
      introTitle: "שלום! 👋",
      introSubtitle: "כדי להתחיל נבקש כמה פרטים ואז נשלח קוד אימות למייל.",
      askName: "מה שמך?",
      askEmail: "מה המייל שנשלח אליו קוד אימות?",
      askPhone: "מה מספר הטלפון שלך?",
      otpPrompt: "שלחתי קוד אימות למייל — הזן אותו כאן:",
    } as const);

  const askNameClean = useMemo(() => {
    const raw = String(chatCopy.askName ?? "");
    return raw.replace(/\(\s*לא חובה\s*\)/g, "").replace(/לא חובה/g, "").trim();
  }, [chatCopy.askName]);

  const listRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const currentQuestion = bootstrap?.questions[qIndex] ?? null;
  const totalQuestions = bootstrap?.questions.length ?? 0;
  const progressPct = totalQuestions > 0 ? Math.round(((qIndex + 1) / totalQuestions) * 100) : 0;

  useEffect(() => {
    if (stage !== "question") return;
    setProgressPulse(true);
    const t = setTimeout(() => setProgressPulse(false), 450);
    return () => clearTimeout(t);
  }, [qIndex, stage]);

  useEffect(() => {
    if (stage === "question") {
      setTyping(true);
      setBotStatus("מקליד...");
      const t = setTimeout(() => {
        setTyping(false);
        setBotStatus("אונליין");
        setQuestionShownAtIso(new Date().toISOString());
        requestAnimationFrame(() => scrollToBottom("auto"));
      }, 650);
      return () => clearTimeout(t);
    }
    if (stage === "done") {
      setTyping(false);
      setBotStatus("אונליין");
      setQuestionShownAtIso(new Date().toISOString());
      requestAnimationFrame(() => scrollToBottom("auto"));
    }
  }, [qIndex, stage]);

  const messages: Msg[] = useMemo(() => {
    const base: Msg[] = [];

    if (stage === "done") {
      return base;
    }

    base.push({ id: "w1", from: "bot", text: chatCopy.introTitle, atIso: new Date().toISOString() });
    base.push({
      id: "w2",
      from: "bot",
      text: chatCopy.introSubtitle,
      subtle: true,
      atIso: new Date().toISOString(),
    });

    // Always keep contact info visible after it was entered
    if (stage !== "collect_intro" && stage !== "collect_name" && name.trim()) {
      base.push({ id: "c_name", from: "user", text: `שם: ${name.trim()}`, atIso: new Date().toISOString() });
    }
    if (
      stage !== "collect_intro" &&
      stage !== "collect_name" &&
      stage !== "collect_email" &&
      normalizeEmail(email).length > 0
    ) {
      base.push({ id: "c_email", from: "user", text: `מייל: ${normalizeEmail(email)}`, atIso: new Date().toISOString() });
    }
    if (
      stage !== "collect_intro" &&
      stage !== "collect_name" &&
      stage !== "collect_email" &&
      stage !== "collect_phone" &&
      phone.trim().length > 0
    ) {
      base.push({ id: "c_phone", from: "user", text: `טלפון: ${phone.trim()}`, atIso: new Date().toISOString() });
    }

    if (stage === "collect_name") {
      base.push({ id: "p_name", from: "bot", text: askNameClean, atIso: new Date().toISOString() });
    }
    if (stage === "collect_email") {
      base.push({ id: "p_email", from: "bot", text: chatCopy.askEmail, atIso: new Date().toISOString() });
    }
    if (stage === "collect_phone") {
      base.push({ id: "p_phone", from: "bot", text: chatCopy.askPhone, atIso: new Date().toISOString() });
    }

    if (stage === "sending") {
      base.push({
        id: "otp_sending",
        from: "bot",
        text: "מעולה — שולח/ת עכשיו קוד אימות למייל שלך...",
        subtle: true,
        atIso: new Date().toISOString(),
      });
    }

    if (stage === "await_code" || stage === "verifying" || stage === "loading_form") {
      base.push({
        id: "b3",
        from: "bot",
        text: chatCopy.otpPrompt,
        atIso: new Date().toISOString(),
      });

      if (debugCode && stage === "await_code") {
        base.push({
          id: "dbg",
          from: "bot",
          text: `מצב פיתוח: הקוד הוא ${debugCode}`,
          subtle: true,
          atIso: new Date().toISOString(),
        });
      }
    }

    if (stage === "await_code" || stage === "verifying" || stage === "loading_form") {
      base.push({
        id: "otp_title",
        from: "bot",
        text: "קוד אימות נשלח למייל שלך — הזן אותו כדי להמשיך",
        atIso: new Date().toISOString(),
      });
    }

    if (verifiedOkAtIso && (stage === "loading_form" || stage === "question")) {
      base.push({
        id: "otp_verified_ok",
        from: "bot",
        text: "המייל אומת בהצלחה ✅",
        subtle: true,
        atIso: verifiedOkAtIso,
      });
    }

    if (stage === "question" && bootstrap && currentQuestion) {
      for (const h of history) {
        base.push({ id: `hq_${h.questionId}`, from: "bot", text: h.questionText, atIso: h.atIso });
        base.push({ id: `ha_${h.questionId}`, from: "user", text: h.answerText, atIso: h.atIso });
      }

      if (typing) {
        base.push({ id: "typing", from: "bot", text: "מקליד...", kind: "typing", atIso: new Date().toISOString() });
        return base;
      }

      const nudges = Array.isArray((bootstrap.form as any).nudges) ? (bootstrap.form as any).nudges : [];
      for (const n of nudges) {
        if (!n || typeof n !== "object") continue;
        if (Number(n.atQuestionOrder) === Number(currentQuestion.order) && String(n.text ?? "").trim().length > 0) {
          base.push({
            id: `n_${currentQuestion.order}_${String(n.text).slice(0, 16)}`,
            from: "bot",
            text: String(n.text),
            subtle: true,
            atIso: questionShownAtIso ?? new Date().toISOString(),
          });
        }
      }

      base.push({
        id: `q_${currentQuestion.id}`,
        from: "bot",
        text: currentQuestion.text,
        atIso: questionShownAtIso ?? new Date().toISOString(),
      });
    }

    return base;
  }, [askNameClean, bootstrap, code, currentQuestion, debugCode, email, history, name, phone, questionShownAtIso, stage, typing, verifiedOkAtIso]);

  useEffect(() => {
    if (stage === "collect_intro") {
      const t = setTimeout(() => setStage("collect_name"), 250);
      return () => clearTimeout(t);
    }
  }, [stage]);

  useEffect(() => {
    requestAnimationFrame(() => scrollToBottom("smooth"));
  }, [messages.length]);

  useEffect(() => {
    const d = digitsOnly(phone);
    if (phone.length === 0) {
      setPhoneError(null);
      return;
    }
    if (d.length < 9) {
      setPhoneError("מספר טלפון חייב להכיל לפחות 9 ספרות");
      return;
    }
    setPhoneError(null);
  }, [phone]);

  async function startOtp() {
    setError(null);

    const digits = digitsOnly(phone);
    if (digits.length < 9) {
      setPhoneError("מספר טלפון חייב להכיל לפחות 9 ספרות");
      return;
    }

    setPhoneError(null);

    setStage("sending");

    const cleanEmail = normalizeEmail(email);

    const res = await fetch("/api/form/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        formSlug,
        name: name.trim() || undefined,
        phone: phone.trim(),
        email: cleanEmail,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as
        | { error?: unknown; details?: { fieldErrors?: Record<string, string[]> } }
        | null;
      const phoneMsg = data?.details?.fieldErrors?.phone?.[0];
      if (phoneMsg) setPhoneError(phoneMsg);

      const errMsg = typeof data?.error === "string" && data.error.trim().length > 0 ? data.error : null;
      setError(errMsg ?? `שגיאה בשליחת קוד (${res.status})`);
      setStage("collect_phone");
      return;
    }

    const data = (await res.json()) as { sessionId: string; debugCode?: string };
    setSessionId(data.sessionId);
    setDebugCode(data.debugCode ?? null);
    setStage("await_code");
  }

  async function verifyOtp() {
    if (!sessionId) return;
    setError(null);
    setStage("verifying");

    const res = await fetch("/api/form/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, code }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "שגיאה באימות");
      setStage("await_code");
      return;
    }

    setStage("loading_form");
    setVerifiedOkAtIso(new Date().toISOString());
    try {
      const bootRes = await fetch(`/api/form/bootstrap?formSlug=${encodeURIComponent(formSlug)}`);
      if (!bootRes.ok) {
        setError("לא הצלחתי לטעון שאלות");
        setStage("await_code");
        return;
      }
      const boot = (await bootRes.json()) as Bootstrap;
      setBootstrap(boot);
      setQIndex(0);
      setHistory([]);
      setQuestionShownAtIso(new Date().toISOString());
      setPendingValue(null);
      setPendingOtherText("");
      requestAnimationFrame(() => scrollToBottom("smooth"));
      setStage("question");
    } catch {
      setError("לא הצלחתי לטעון שאלות");
      setStage("await_code");
    }
  }

  function editDetails() {
    setError(null);
    setCode("");
    setSessionId(null);
    setDebugCode(null);
    setBootstrap(null);
    setQIndex(0);
    setHistory([]);
    setPendingValue(null);
    setPendingOtherText("");
    setVerifiedOkAtIso(null);
    setQuestionShownAtIso(null);
    setTyping(false);
    setBotStatus("מאובטח");
    setStage("collect_name");
  }

  async function submitAnswer(value: AnswerValue) {
    if (!sessionId || !bootstrap || !currentQuestion) return;

    setPendingValue(value);
    if (value !== 'other') {
      setSaving(true);
      setError(null);
      try {
        await fetch('/api/form/answer', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            formSlug,
            questionId: currentQuestion.id,
            questionOrder: currentQuestion.order,
            value,
            otherText: null,
          }),
        });

        const answerText = value === 'yes' ? 'כן' : 'לא';
        setHistory((prev) => [
          ...prev,
          {
            questionId: currentQuestion.id,
            questionOrder: currentQuestion.order,
            questionText: currentQuestion.text,
            answerText,
            atIso: new Date().toISOString(),
          },
        ]);

        setPendingValue(null);
        setPendingOtherText('');
        requestAnimationFrame(() => scrollToBottom('smooth'));
        if (qIndex + 1 >= bootstrap.questions.length) {
          await fetch('/api/form/complete', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
          setStage('done');
        } else {
          setQIndex((v) => v + 1);
        }
      } catch {
        setError('שגיאה בשמירת תשובה');
      } finally {
        setSaving(false);
      }
      return;
    }
  }

  async function submitOther() {
    if (!sessionId || !bootstrap || !currentQuestion) return;
    if (!pendingOtherText.trim()) {
      setError('נא לרשום טקסט עבור \'אחר\'');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await fetch('/api/form/answer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          formSlug,
          questionId: currentQuestion.id,
          questionOrder: currentQuestion.order,
          value: 'other',
          otherText: pendingOtherText.trim(),
        }),
      });

      setHistory((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          questionOrder: currentQuestion.order,
          questionText: currentQuestion.text,
          answerText: `אחר: ${pendingOtherText.trim()}`,
          atIso: new Date().toISOString(),
        },
      ]);

      setPendingValue(null);
      setPendingOtherText('');

      if (qIndex + 1 >= bootstrap.questions.length) {
        await fetch('/api/form/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        setStage('done');
      } else {
        setQIndex((v) => v + 1);
      }
    } catch {
      setError('שגיאה בשמירת תשובה');
    } finally {
      setSaving(false);
    }
  }

  if (stage === 'done') {
    const title = bootstrap?.form.completionTitle || 'תודה! הטופס התקבל';
    const subtitle = bootstrap?.form.completionSubtitle || 'אפשר לסגור את החלון.';
    return (
      <div className="fixed inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-zinc-50 to-zinc-100">
        <div className="mx-auto flex h-full w-full max-w-md flex-col p-3 sm:max-w-lg md:max-w-xl">
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Check className="size-6" />
              </div>
              <div className="mt-4 whitespace-pre-wrap text-lg font-semibold text-zinc-900">{title}</div>
              <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{subtitle}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-zinc-50 to-zinc-100">
      <div className="mx-auto flex h-full w-full max-w-md flex-col p-3 sm:max-w-lg md:max-w-xl">
        <div className="flex shrink-0 items-center justify-between rounded-2xl border border-zinc-200 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid size-9 place-items-center rounded-xl hover:bg-zinc-100"
              onClick={() => window.history.back()}
              aria-label="חזרה"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <MessageCircle className="size-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="text-base font-semibold text-zinc-900 md:text-lg">{bootstrap?.form.name ?? "שאלון"}</div>
              <div className="text-xs text-zinc-500">
                {stage === "question" && currentQuestion ? `שאלה ${currentQuestion.order} מתוך ${totalQuestions}` : formSlug}
              </div>
            </div>
          </div>

          {stage === 'question' && totalQuestions > 0 ? (
            <div className="flex items-center gap-2">
              <div className="hidden text-xs text-zinc-600 sm:block">
                {currentQuestion?.order ?? qIndex + 1}/{totalQuestions}
              </div>
              <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={
                    "h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out " +
                    (progressPulse ? "brightness-110" : "")
                  }
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-xl bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
              <LockKeyhole className="size-4" />
              אימות
            </div>
          )}
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(255,255,255,0.85)),url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22 viewBox=%220 0 50 50%22%3E%3Cg fill=%22%23d1fae5%22 fill-opacity=%220.35%22%3E%3Cpath d=%22M25 0l3 6-3 6-3-6 3-6zm0 25l3 6-3 6-3-6 3-6zm0 25l3-6-3-6-3 6 3 6z%22/%3E%3C/g%3E%3C/svg%3E'))] shadow-sm">
          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <div className="mx-auto flex max-w-md flex-col gap-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={m.from === 'user' ? 'flex justify-end' : 'flex justify-start'}
                >
                  {m.from === 'bot' ? (
                    <div className="flex max-w-[90%] items-end gap-2">
                      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                        FF
                      </div>
                      <div
                        className={
                          "px-3 py-2 text-sm leading-6 shadow-sm " +
                          bubbleClass(m.from) +
                          (m.subtle ? " opacity-80" : "")
                        }
                      >
                        {m.kind === "typing" ? (
                          <div className="flex items-center gap-1">
                            <span className="inline-block size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.2s]" />
                            <span className="inline-block size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.1s]" />
                            <span className="inline-block size-1.5 animate-bounce rounded-full bg-zinc-400" />
                          </div>
                        ) : (
                          <span className="whitespace-pre-wrap break-words">{m.text}</span>
                        )}
                        <div className="mt-1 text-left text-[10px] text-zinc-400">{fmtTime(m.atIso)}</div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={
                        "max-w-[85%] px-3 py-2 text-sm leading-6 shadow-sm " +
                        bubbleClass(m.from) +
                        (m.subtle ? " opacity-80" : "")
                      }
                    >
                      <span className="whitespace-pre-wrap break-words">{m.text}</span>
                      <div className="mt-1 text-left text-[10px] text-emerald-100/90">{fmtTime(m.atIso)}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error ? (
            <div className="mx-3 mb-2 shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="shrink-0 border-t border-zinc-200 bg-white/90 p-3 backdrop-blur">
            {stage === 'collect_name' ? (
              <div className="flex flex-col gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    setStage("collect_email");
                  }}
                  placeholder="הקלד/י שם"
                  className="h-11 rounded-xl border border-zinc-300 bg-white px-3 outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setStage('collect_email')}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-white transition-all hover:bg-emerald-700"
                >
                  המשך
                </button>
              </div>
            ) : null}

            {stage === 'collect_email' ? (
              <div className="flex flex-col gap-2">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    if (normalizeEmail(email).length === 0) return;
                    setStage("collect_phone");
                  }}
                  placeholder="מייל"
                  className="h-11 rounded-xl border border-zinc-300 bg-white px-3 outline-none focus:border-emerald-500"
                  inputMode="email"
                />
                <button
                  type="button"
                  onClick={() => setStage('collect_phone')}
                  disabled={normalizeEmail(email).length === 0}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
                >
                  המשך
                </button>
              </div>
            ) : null}

            {stage === 'collect_phone' || stage === 'sending' ? (
              <div className="flex flex-col gap-2">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const disabled =
                      saving ||
                      stage === "sending" ||
                      normalizeEmail(email).length === 0 ||
                      digitsOnly(phone).length < 9;
                    if (disabled) return;
                    startOtp();
                  }}
                  placeholder="טלפון"
                  className="h-11 rounded-xl border border-zinc-300 bg-white px-3 outline-none focus:border-emerald-500"
                  inputMode="tel"
                />

                {phoneError ? <div className="text-sm text-red-600">{phoneError}</div> : null}

                <button
                  onClick={startOtp}
                  disabled={saving || stage === 'sending' || normalizeEmail(email).length === 0 || digitsOnly(phone).length < 9}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Send className="size-4" />
                  {stage === 'sending' ? 'שולח...' : 'שלח קוד אימות'}
                </button>
              </div>
            ) : null}

            {stage === 'await_code' || stage === 'verifying' || stage === 'loading_form' ? (
              <div className="flex flex-col gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const disabled = stage !== "await_code" || code.length !== 6;
                    if (disabled) return;
                    verifyOtp();
                  }}
                  placeholder="קוד בן 6 ספרות"
                  className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-left tracking-widest outline-none focus:border-emerald-500"
                  inputMode="numeric"
                />

                <button
                  onClick={verifyOtp}
                  disabled={stage !== "await_code" || code.length !== 6}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 text-white disabled:opacity-50"
                >
                  <Check className="size-4" />
                  {stage === "verifying" || stage === "loading_form" ? "מאמת..." : "אמת קוד"}
                </button>

                <button
                  onClick={editDetails}
                  className="h-11 rounded-xl border border-zinc-300 bg-white"
                >
                  עריכת פרטים
                </button>

                <div className="text-center text-xs text-zinc-500">
                  טעית במייל/טלפון? לחץ על "עריכת פרטים" כדי לחזור ולתקן.
                </div>
              </div>
            ) : null}

            {stage === "question" && bootstrap && currentQuestion ? (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => submitAnswer("yes")}
                    disabled={saving}
                    className="h-11 rounded-xl bg-emerald-600 text-sm font-medium text-white disabled:opacity-50"
                  >
                    כן
                  </button>
                  <button
                    type="button"
                    onClick={() => submitAnswer("no")}
                    disabled={saving}
                    className="h-11 rounded-xl bg-zinc-900 text-sm font-medium text-white disabled:opacity-50"
                  >
                    לא
                  </button>
                  <button
                    type="button"
                    onClick={() => submitAnswer("other")}
                    disabled={saving}
                    className={
                      "h-11 rounded-xl border text-sm font-medium disabled:opacity-50 " +
                      (pendingValue === "other"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-zinc-300 bg-white")
                    }
                  >
                    אחר
                  </button>
                </div>

                {pendingValue === "other" ? (
                  <div className="flex gap-2">
                    <input
                      value={pendingOtherText}
                      onChange={(e) => setPendingOtherText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        if (saving) return;
                        submitOther();
                      }}
                      placeholder="כתוב כאן..."
                      className="h-11 flex-1 rounded-xl border border-zinc-300 bg-white px-3 outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={submitOther}
                      disabled={saving}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-white disabled:opacity-50"
                      aria-label="שליחה"
                    >
                      <Send className="size-4" />
                    </button>
                  </div>
                ) : null}

                <div className="text-center text-xs text-zinc-500">
                  שאלה {currentQuestion.order} מתוך {totalQuestions}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
