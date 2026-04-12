"use client";

import { useMemo, useState } from "react";

type Msg = {
  id: string;
  from: "bot" | "user";
  text: string;
};

export default function FormChatClient({ formSlug }: { formSlug: string }) {
  const [stage, setStage] = useState<
    "collect" | "sending" | "await_code" | "verifying" | "verified"
  >("collect");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messages: Msg[] = useMemo(() => {
    const base: Msg[] = [
      { id: "w1", from: "bot", text: "שלום! 👋" },
      { id: "w2", from: "bot", text: "כדי להתחיל, אני צריך לאמת את כתובת המייל שלך." },
    ];

    if (stage !== "collect") {
      if (name.trim()) base.push({ id: "u1", from: "user", text: `שם: ${name.trim()}` });
      base.push({ id: "u2", from: "user", text: `מייל: ${email.trim()}` });
      base.push({ id: "b3", from: "bot", text: "שלחתי לך קוד אימות למייל. הזן אותו כאן:" });
    }

    if (stage === "verified") {
      base.push({ id: "u3", from: "user", text: `קוד: ${code}` });
      base.push({ id: "b4", from: "bot", text: "אומת בהצלחה ✅ עכשיו נמשיך לשאלון (בקרוב)." });
    }

    return base;
  }, [stage, name, email, code]);

  async function startOtp() {
    setError(null);
    setStage("sending");

    const res = await fetch("/api/form/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ formSlug, name: name.trim() || undefined, email: email.trim() }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "שגיאה בשליחת קוד");
      setStage("collect");
      return;
    }

    const data = (await res.json()) as { sessionId: string };
    setSessionId(data.sessionId);
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

    setStage("verified");
  }

  return (
    <div className="flex flex-1 bg-zinc-50">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-zinc-900">טופס: {formSlug}</div>
            <div className="text-xs text-zinc-500">בדיקת אימות מייל</div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.from === "bot"
                    ? "self-start max-w-[85%] rounded-2xl bg-zinc-100 px-3 py-2 text-sm"
                    : "self-end max-w-[85%] rounded-2xl bg-zinc-900 px-3 py-2 text-sm text-white"
                }
              >
                {m.text}
              </div>
            ))}
          </div>

          {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

          <div className="mt-6 border-t border-zinc-200 pt-4">
            {stage === "collect" || stage === "sending" ? (
              <div className="flex flex-col gap-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="שם (לא חובה)"
                  className="h-11 rounded-xl border border-zinc-300 px-3 outline-none focus:border-zinc-900"
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="מייל"
                  className="h-11 rounded-xl border border-zinc-300 px-3 outline-none focus:border-zinc-900"
                  inputMode="email"
                />
                <button
                  onClick={startOtp}
                  disabled={stage === "sending" || email.trim().length === 0}
                  className="h-11 rounded-xl bg-zinc-900 text-white disabled:opacity-50"
                >
                  {stage === "sending" ? "שולח קוד..." : "שלח קוד אימות"}
                </button>
              </div>
            ) : null}

            {stage === "await_code" || stage === "verifying" ? (
              <div className="flex flex-col gap-3">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="קוד בן 6 ספרות"
                  className="h-11 rounded-xl border border-zinc-300 px-3 text-left tracking-widest outline-none focus:border-zinc-900"
                  inputMode="numeric"
                />
                <button
                  onClick={verifyOtp}
                  disabled={stage === "verifying" || code.length !== 6}
                  className="h-11 rounded-xl bg-zinc-900 text-white disabled:opacity-50"
                >
                  {stage === "verifying" ? "מאמת..." : "אמת קוד"}
                </button>
                <button
                  onClick={() => {
                    setStage("collect");
                    setCode("");
                    setSessionId(null);
                    setError(null);
                  }}
                  className="h-11 rounded-xl border border-zinc-300 bg-white"
                >
                  שלח קוד מחדש
                </button>
              </div>
            ) : null}

            {stage === "verified" ? (
              <div className="text-sm text-zinc-700">המשך השאלון יתווסף בשלב הבא.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
