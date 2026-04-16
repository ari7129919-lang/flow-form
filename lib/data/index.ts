import { getServerEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { mockStore } from "@/lib/data/mockStore";
import type { AnswerValue } from "@/lib/data/answers";

function isMissingColumnError(err: unknown) {
  const e = err as any;
  const msg = String(e?.message ?? "");
  return e?.code === "42703" || msg.includes("does not exist") || msg.includes("column");
}

export type FormRow = { id: string; slug: string; name: string };

export type AdminForm = {
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

export type AdminQuestion = {
  id: string;
  formId: string;
  order: number;
  text: string;
  required: boolean;
  allowOther: boolean;
};

export type FormBootstrap = {
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

export async function getFormBySlug(slug: string) {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    const f = mockStore.getFormBySlug(slug);
    return f ? { id: f.id, slug: f.slug, name: f.name } : null;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ff_forms")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export type AdminTreatmentStatus = "untreated" | "treated" | "reviewing";

export type AdminSessionRow = {
  id: string;
  formId: string;
  name: string | null;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
  treatmentStatus: AdminTreatmentStatus;
  treatmentNote: string | null;
  treatedAt: string | null;
};

export type AdminSessionsCounts = {
  all: number;
  untreated: number;
  treated: number;
  reviewing: number;
};

function normalizeTreatmentStatus(v: unknown): AdminTreatmentStatus {
  return v === "treated" || v === "reviewing" ? v : "untreated";
}

export async function listAdminSessions(args: {
  formId?: string | null;
  emailQuery?: string | null;
  dateFrom?: string | null; // YYYY-MM-DD
  dateTo?: string | null; // YYYY-MM-DD
  treatmentStatus?: AdminTreatmentStatus | "all" | null;
}): Promise<AdminSessionRow[]> {
  const env = getServerEnv();
  const formId = args.formId ?? null;
  const emailQuery = (args.emailQuery ?? "").trim();
  const dateFrom = args.dateFrom ?? null;
  const dateTo = args.dateTo ?? null;
  const treatmentStatus = args.treatmentStatus ?? null;

  if (env.USE_MOCK_DATA) {
    let sessions = mockStore
      .listSessions()
      .filter((s: any) => s.status === "completed")
      .filter((s: any) => (formId ? String(s.formId) === String(formId) : true));

    if (emailQuery) {
      const q = emailQuery.toLowerCase();
      sessions = sessions.filter((s: any) => String(s.email ?? "").toLowerCase().includes(q));
    }

    if (dateFrom) {
      const from = new Date(dateFrom + "T00:00:00.000Z").getTime();
      sessions = sessions.filter((s: any) => {
        const iso = s.completedAt ?? s.createdAt;
        const t = new Date(iso).getTime();
        return Number.isFinite(t) ? t >= from : true;
      });
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59.999Z").getTime();
      sessions = sessions.filter((s: any) => {
        const iso = s.completedAt ?? s.createdAt;
        const t = new Date(iso).getTime();
        return Number.isFinite(t) ? t <= to : true;
      });
    }

    if (treatmentStatus && treatmentStatus !== "all") {
      sessions = sessions.filter((s: any) => normalizeTreatmentStatus(s.treatmentStatus) === treatmentStatus);
    }

    sessions.sort((a: any, b: any) => String(b.completedAt ?? b.createdAt).localeCompare(String(a.completedAt ?? a.createdAt)));

    return sessions.map((s: any) => ({
      id: String(s.id),
      formId: String(s.formId),
      name: s.name ?? null,
      email: String(s.email ?? ""),
      phone: s.phone ?? null,
      status: String(s.status ?? ""),
      createdAt: String(s.createdAt),
      completedAt: s.completedAt ?? null,
      treatmentStatus: normalizeTreatmentStatus(s.treatmentStatus),
      treatmentNote: s.treatmentNote ?? null,
      treatedAt: s.treatedAt ?? null,
    }));
  }

  const supabase = getSupabaseServerClient();

  const buildQuery = (withTreatmentCols: boolean) => {
    const cols = withTreatmentCols
      ? "id, form_id, name, email, phone, status, created_at, completed_at, treatment_status, treatment_note, treated_at"
      : "id, form_id, name, email, phone, status, created_at, completed_at";
    const q = supabase
      .from("ff_sessions")
      .select(cols)
      .eq("status", "completed")
      .order("completed_at", { ascending: false });
    if (formId) q.eq("form_id", formId);
    if (emailQuery) q.ilike("email", `%${emailQuery}%`);
    if (dateFrom) q.gte("completed_at", dateFrom + "T00:00:00.000Z");
    if (dateTo) q.lte("completed_at", dateTo + "T23:59:59.999Z");
    if (withTreatmentCols && treatmentStatus && treatmentStatus !== "all") q.eq("treatment_status", treatmentStatus);
    return q;
  };

  const primary = await buildQuery(true);
  if (primary.error) {
    if (!isMissingColumnError(primary.error)) throw primary.error;
    const fallback = await buildQuery(false);
    if (fallback.error) throw fallback.error;
    return (fallback.data ?? []).map((s: any) => ({
      id: s.id,
      formId: s.form_id,
      name: s.name ?? null,
      email: s.email,
      phone: s.phone ?? null,
      status: s.status,
      createdAt: s.created_at,
      completedAt: s.completed_at,
      treatmentStatus: "untreated",
      treatmentNote: null,
      treatedAt: null,
    }));
  }

  return (primary.data ?? []).map((s: any) => ({
    id: s.id,
    formId: s.form_id,
    name: s.name ?? null,
    email: s.email,
    phone: s.phone ?? null,
    status: s.status,
    createdAt: s.created_at,
    completedAt: s.completed_at,
    treatmentStatus: normalizeTreatmentStatus(s.treatment_status),
    treatmentNote: s.treatment_note ?? null,
    treatedAt: s.treated_at ?? null,
  }));
}

export async function getAdminSessionsCounts(args: {
  formId?: string | null;
  emailQuery?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}): Promise<AdminSessionsCounts> {
  const env = getServerEnv();
  const sessions = await listAdminSessions({
    formId: args.formId ?? null,
    emailQuery: args.emailQuery ?? null,
    dateFrom: args.dateFrom ?? null,
    dateTo: args.dateTo ?? null,
    treatmentStatus: "all",
  });

  if (env.USE_MOCK_DATA) {
    const counts: AdminSessionsCounts = { all: sessions.length, untreated: 0, treated: 0, reviewing: 0 };
    for (const s of sessions) counts[s.treatmentStatus]++;
    return counts;
  }

  const counts: AdminSessionsCounts = { all: sessions.length, untreated: 0, treated: 0, reviewing: 0 };
  for (const s of sessions) counts[s.treatmentStatus]++;
  return counts;
}

export async function updateSessionTreatment(args: {
  sessionId: string;
  treatmentStatus: AdminTreatmentStatus;
  treatmentNote?: string | null;
}) {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    const s = mockStore.updateTreatment({
      sessionId: args.sessionId,
      treatmentStatus: args.treatmentStatus,
      treatmentNote: args.treatmentNote ?? null,
    });
    if (!s) return;
    mockStore.addEvent({
      sessionId: args.sessionId,
      type: "treatment_updated",
      meta: { treatmentStatus: args.treatmentStatus, treatmentNote: args.treatmentNote ?? null },
    });
    return;
  }

  const supabase = getSupabaseServerClient();
  const treatedAt = args.treatmentStatus === "treated" ? new Date().toISOString() : null;
  const res = await supabase
    .from("ff_sessions")
    .update({
      treatment_status: args.treatmentStatus,
      treatment_note: args.treatmentNote ?? null,
      treated_at: treatedAt,
    })
    .eq("id", args.sessionId);

  if (res.error) {
    if (!isMissingColumnError(res.error)) throw res.error;
    return;
  }

  await supabase.from("ff_events").insert({
    session_id: args.sessionId,
    type: "treatment_updated",
    meta: { treatmentStatus: args.treatmentStatus, treatmentNote: args.treatmentNote ?? null },
  });
}

export async function listForms(): Promise<AdminForm[]> {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    return mockStore.listForms();
  }

  const supabase = getSupabaseServerClient();

  let data: any[] | null = null;
  const primary = await supabase
    .from("ff_forms")
    .select(
      "id, slug, name, welcome_title, welcome_subtitle, completion_title, completion_subtitle, chat_copy, nudges, nudge_question_order, nudge_text",
    )
    .order("slug", { ascending: true });
  if (primary.error) {
    if (!isMissingColumnError(primary.error)) throw primary.error;
    const fallback = await supabase
      .from("ff_forms")
      .select("id, slug, name, welcome_title, welcome_subtitle, completion_title, completion_subtitle, nudge_question_order, nudge_text")
      .order("slug", { ascending: true });
    if (fallback.error) throw fallback.error;
    data = fallback.data as any;
  } else {
    data = primary.data as any;
  }

  return (data ?? []).map((f) => ({
    id: f.id,
    slug: f.slug,
    name: f.name,
    welcomeTitle: f.welcome_title,
    welcomeSubtitle: f.welcome_subtitle,
    completionTitle: f.completion_title,
    completionSubtitle: f.completion_subtitle,
    chatCopy: (f.chat_copy ?? {
      introTitle: "שלום! 👋",
      introSubtitle: "כדי להתחיל נבקש כמה פרטים ואז נשלח קוד אימות למייל.",
      askName: "מה שמך? (לא חובה)",
      askEmail: "מה המייל שנשלח אליו קוד אימות?",
      askPhone: "מה מספר הטלפון שלך?",
      otpPrompt: "שלחתי קוד אימות למייל — הזן אותו כאן:",
    }) as any,
    nudges: Array.isArray(f.nudges) ? f.nudges : [],
    nudgeQuestionOrder: f.nudge_question_order,
    nudgeText: f.nudge_text,
  }));
}

export async function resetAllData(args?: { deleteForms?: boolean }) {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    if (args?.deleteForms) {
      mockStore.resetAll();
    } else {
      mockStore.resetResponsesOnly();
    }
    return;
  }

  const supabase = getSupabaseServerClient();

  await supabase.from("ff_answers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("ff_events").delete().neq("id", 0);
  await supabase.from("ff_sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  if (args?.deleteForms) {
    await supabase.from("ff_questions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("ff_forms").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }

  await supabase.from("ff_settings").upsert({ key: "admin_receiver_email", value: "" });
}

export async function getFormAdmin(formId: string): Promise<{ form: AdminForm; questions: AdminQuestion[] } | null> {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    const f = mockStore.getFormById(formId);
    if (!f) return null;
    const qs = mockStore.getQuestionsByFormId(f.id);
    return {
      form: {
        id: f.id,
        slug: f.slug,
        name: f.name,
        welcomeTitle: f.welcomeTitle,
        welcomeSubtitle: f.welcomeSubtitle,
        completionTitle: f.completionTitle,
        completionSubtitle: f.completionSubtitle,
        chatCopy: (f as any).chatCopy ?? {
          introTitle: "שלום! 👋",
          introSubtitle: "כדי להתחיל נבקש כמה פרטים ואז נשלח קוד אימות למייל.",
          askName: "מה שמך? (לא חובה)",
          askEmail: "מה המייל שנשלח אליו קוד אימות?",
          askPhone: "מה מספר הטלפון שלך?",
          otpPrompt: "שלחתי קוד אימות למייל — הזן אותו כאן:",
        },
        nudges:
          Array.isArray((f as any).nudges) && (f as any).nudges.length > 0
            ? (f as any).nudges
            : f.nudgeQuestionOrder && f.nudgeText
              ? [{ atQuestionOrder: f.nudgeQuestionOrder, text: f.nudgeText }]
              : [],
        nudgeQuestionOrder: f.nudgeQuestionOrder,
        nudgeText: f.nudgeText,
      },
      questions: qs.map((q) => ({
        id: q.id,
        formId: q.formId,
        order: q.order,
        text: q.text,
        required: q.required,
        allowOther: q.allowOther,
      })),
    };
  }

  const supabase = getSupabaseServerClient();
  let f: any = null;

  const primary = await supabase
    .from("ff_forms")
    .select(
      "id, slug, name, welcome_title, welcome_subtitle, completion_title, completion_subtitle, chat_copy, nudges, nudge_question_order, nudge_text",
    )
    .eq("id", formId)
    .maybeSingle();
  if (primary.error) {
    if (!isMissingColumnError(primary.error)) throw primary.error;
    const fallback = await supabase
      .from("ff_forms")
      .select("id, slug, name, welcome_title, welcome_subtitle, completion_title, completion_subtitle, nudge_question_order, nudge_text")
      .eq("id", formId)
      .maybeSingle();
    if (fallback.error) throw fallback.error;
    f = fallback.data as any;
  } else {
    f = primary.data as any;
  }

  if (!f) return null;

  const { data: qs, error: qErr } = await supabase
    .from("ff_questions")
    .select("id, form_id, order, text, required, allow_other")
    .eq("form_id", f.id)
    .order("order", { ascending: true });
  if (qErr) throw qErr;

  return {
    form: {
      id: f.id,
      slug: f.slug,
      name: f.name,
      welcomeTitle: f.welcome_title,
      welcomeSubtitle: f.welcome_subtitle,
      completionTitle: f.completion_title,
      completionSubtitle: f.completion_subtitle,
      chatCopy: (f.chat_copy ?? {
        introTitle: "שלום! 👋",
        introSubtitle: "כדי להתחיל נבקש כמה פרטים ואז נשלח קוד אימות למייל.",
        askName: "מה שמך? (לא חובה)",
        askEmail: "מה המייל שנשלח אליו קוד אימות?",
        askPhone: "מה מספר הטלפון שלך?",
        otpPrompt: "שלחתי קוד אימות למייל — הזן אותו כאן:",
      }) as any,
      nudges:
        Array.isArray(f.nudges) && f.nudges.length > 0
          ? f.nudges
          : f.nudge_question_order && f.nudge_text
            ? [{ atQuestionOrder: f.nudge_question_order, text: f.nudge_text }]
            : [],
      nudgeQuestionOrder: f.nudge_question_order,
      nudgeText: f.nudge_text,
    },
    questions: (qs ?? []).map((q) => ({
      id: q.id,
      formId: q.form_id,
      order: q.order,
      text: q.text,
      required: q.required,
      allowOther: q.allow_other,
    })),
  };
}

export async function createForm(args: { name: string; slug: string }): Promise<AdminForm> {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    return mockStore.createForm(args);
  }

  const supabase = getSupabaseServerClient();
  let data: any;
  const primary = await supabase
    .from("ff_forms")
    .insert({ slug: args.slug, name: args.name })
    .select(
      "id, slug, name, welcome_title, welcome_subtitle, completion_title, completion_subtitle, chat_copy, nudges, nudge_question_order, nudge_text",
    )
    .single();
  if (primary.error) {
    if (!isMissingColumnError(primary.error)) throw primary.error;
    const fallback = await supabase
      .from("ff_forms")
      .insert({ slug: args.slug, name: args.name })
      .select("id, slug, name, welcome_title, welcome_subtitle, completion_title, completion_subtitle, nudge_question_order, nudge_text")
      .single();
    if (fallback.error) throw fallback.error;
    data = fallback.data as any;
  } else {
    data = primary.data as any;
  }
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    welcomeTitle: data.welcome_title,
    welcomeSubtitle: data.welcome_subtitle,
    completionTitle: data.completion_title,
    completionSubtitle: data.completion_subtitle,
    chatCopy: (data.chat_copy ?? {
      introTitle: "שלום! 👋",
      introSubtitle: "כדי להתחיל נבקש כמה פרטים ואז נשלח קוד אימות למייל.",
      askName: "מה שמך? (לא חובה)",
      askEmail: "מה המייל שנשלח אליו קוד אימות?",
      askPhone: "מה מספר הטלפון שלך?",
      otpPrompt: "שלחתי קוד אימות למייל — הזן אותו כאן:",
    }) as any,
    nudges: Array.isArray(data.nudges) ? data.nudges : [],
    nudgeQuestionOrder: data.nudge_question_order,
    nudgeText: data.nudge_text,
  };
}

export async function updateForm(
  formId: string,
  patch: Partial<{
    name: string;
    slug: string;
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
  }>,
) {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    return mockStore.updateForm(formId, patch as any);
  }

  const supabase = getSupabaseServerClient();
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.slug !== undefined) payload.slug = patch.slug;
  if (patch.welcomeTitle !== undefined) payload.welcome_title = patch.welcomeTitle;
  if (patch.welcomeSubtitle !== undefined) payload.welcome_subtitle = patch.welcomeSubtitle;
  if (patch.completionTitle !== undefined) payload.completion_title = patch.completionTitle;
  if (patch.completionSubtitle !== undefined) payload.completion_subtitle = patch.completionSubtitle;
  if (patch.chatCopy !== undefined) payload.chat_copy = patch.chatCopy;
  if (patch.nudges !== undefined) payload.nudges = patch.nudges;
  if (patch.nudgeQuestionOrder !== undefined) payload.nudge_question_order = patch.nudgeQuestionOrder;
  if (patch.nudgeText !== undefined) payload.nudge_text = patch.nudgeText;

  let data: any;
  const primary = await supabase
    .from("ff_forms")
    .update(payload)
    .eq("id", formId)
    .select(
      "id, slug, name, welcome_title, welcome_subtitle, completion_title, completion_subtitle, chat_copy, nudges, nudge_question_order, nudge_text",
    )
    .single();
  if (primary.error) {
    if (!isMissingColumnError(primary.error)) throw primary.error;
    const fallback = await supabase
      .from("ff_forms")
      .update(payload)
      .eq("id", formId)
      .select("id, slug, name, welcome_title, welcome_subtitle, completion_title, completion_subtitle, nudge_question_order, nudge_text")
      .single();
    if (fallback.error) throw fallback.error;
    data = fallback.data as any;
  } else {
    data = primary.data as any;
  }
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    welcomeTitle: data.welcome_title,
    welcomeSubtitle: data.welcome_subtitle,
    completionTitle: data.completion_title,
    completionSubtitle: data.completion_subtitle,
    chatCopy: (data.chat_copy ?? {
      introTitle: "שלום! 👋",
      introSubtitle: "כדי להתחיל נבקש כמה פרטים ואז נשלח קוד אימות למייל.",
      askName: "מה שמך? (לא חובה)",
      askEmail: "מה המייל שנשלח אליו קוד אימות?",
      askPhone: "מה מספר הטלפון שלך?",
      otpPrompt: "שלחתי קוד אימות למייל — הזן אותו כאן:",
    }) as any,
    nudges: Array.isArray(data.nudges) ? data.nudges : [],
    nudgeQuestionOrder: data.nudge_question_order,
    nudgeText: data.nudge_text,
  };
}

export async function deleteForm(formId: string) {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    mockStore.deleteForm(formId);
    return;
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("ff_forms").delete().eq("id", formId);
  if (error) throw error;
}

export async function listQuestionsByFormId(formId: string): Promise<AdminQuestion[]> {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    return mockStore.getQuestionsByFormId(formId);
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ff_questions")
    .select("id, form_id, order, text, required, allow_other")
    .eq("form_id", formId)
    .order("order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((q) => ({
    id: q.id,
    formId: q.form_id,
    order: q.order,
    text: q.text,
    required: q.required,
    allowOther: q.allow_other,
  }));
}

export async function createQuestion(args: {
  formId: string;
  order: number;
  text: string;
  required: boolean;
  allowOther: boolean;
}) {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    return mockStore.createQuestion(args);
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ff_questions")
    .insert({
      form_id: args.formId,
      order: args.order,
      text: args.text,
      required: args.required,
      allow_other: args.allowOther,
    })
    .select("id, form_id, order, text, required, allow_other")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    formId: data.form_id,
    order: data.order,
    text: data.text,
    required: data.required,
    allowOther: data.allow_other,
  };
}

export async function updateQuestion(
  questionId: string,
  patch: Partial<{ order: number; text: string; required: boolean; allowOther: boolean }>,
) {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    return mockStore.updateQuestion(questionId, patch as any);
  }

  const supabase = getSupabaseServerClient();
  const payload: Record<string, unknown> = {};
  if (patch.order !== undefined) payload.order = patch.order;
  if (patch.text !== undefined) payload.text = patch.text;
  if (patch.required !== undefined) payload.required = patch.required;
  if (patch.allowOther !== undefined) payload.allow_other = patch.allowOther;
  const { data, error } = await supabase
    .from("ff_questions")
    .update(payload)
    .eq("id", questionId)
    .select("id, form_id, order, text, required, allow_other")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    formId: data.form_id,
    order: data.order,
    text: data.text,
    required: data.required,
    allowOther: data.allow_other,
  };
}

export async function deleteQuestion(questionId: string) {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    mockStore.deleteQuestion(questionId);
    return;
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("ff_questions").delete().eq("id", questionId);
  if (error) throw error;
}

export async function listCompletedSessions() {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    return mockStore.listCompletedSessions();
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ff_sessions")
    .select("id, form_id, name, email, phone, status, created_at, completed_at")
    .eq("status", "completed")
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getSessionReport(sessionId: string) {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    return mockStore.getSessionReport(sessionId);
  }

  const supabase = getSupabaseServerClient();
  const { data: session, error: sErr } = await supabase
    .from("ff_sessions")
    .select("id, form_id, name, email, phone, status, created_at, completed_at")
    .eq("id", sessionId)
    .single();
  if (sErr) throw sErr;

  const { data: qs, error: qErr } = await supabase
    .from("ff_questions")
    .select("id, order, text")
    .eq("form_id", session.form_id)
    .order("order", { ascending: true });
  if (qErr) throw qErr;

  const { data: ans, error: aErr } = await supabase
    .from("ff_answers")
    .select("question_id, answer, other_text, created_at")
    .eq("session_id", sessionId);
  if (aErr) throw aErr;

  return { session, questions: qs, answers: ans };
}

export async function getFormBootstrap(slug: string): Promise<FormBootstrap | null> {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    const f = mockStore.getFormBySlug(slug);
    if (!f) return null;
    const qs = mockStore.getQuestionsByFormId(f.id);
    return {
      form: {
        id: f.id,
        slug: f.slug,
        name: f.name,
        welcomeTitle: f.welcomeTitle,
        welcomeSubtitle: f.welcomeSubtitle,
        completionTitle: f.completionTitle,
        completionSubtitle: f.completionSubtitle,
        chatCopy: (f as any).chatCopy ?? {
          introTitle: "שלום! 👋",
          introSubtitle: "כדי להתחיל נבקש כמה פרטים ואז נשלח קוד אימות למייל.",
          askName: "מה שמך? (לא חובה)",
          askEmail: "מה המייל שנשלח אליו קוד אימות?",
          askPhone: "מה מספר הטלפון שלך?",
          otpPrompt: "שלחתי קוד אימות למייל — הזן אותו כאן:",
        },
        nudges:
          Array.isArray((f as any).nudges) && (f as any).nudges.length > 0
            ? (f as any).nudges
            : f.nudgeQuestionOrder && f.nudgeText
              ? [{ atQuestionOrder: f.nudgeQuestionOrder, text: f.nudgeText }]
              : [],
        nudgeQuestionOrder: f.nudgeQuestionOrder,
        nudgeText: f.nudgeText,
      },
      questions: qs.map((q) => ({
        id: q.id,
        order: q.order,
        text: q.text,
        required: q.required,
        allowOther: q.allowOther,
      })),
    };
  }

  const supabase = getSupabaseServerClient();
  let form: any = null;
  const primary = await supabase
    .from("ff_forms")
    .select(
      "id, slug, name, welcome_title, welcome_subtitle, completion_title, completion_subtitle, chat_copy, nudges, nudge_question_order, nudge_text",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (primary.error) {
    if (!isMissingColumnError(primary.error)) throw primary.error;
    const fallback = await supabase
      .from("ff_forms")
      .select("id, slug, name, welcome_title, welcome_subtitle, completion_title, completion_subtitle, nudge_question_order, nudge_text")
      .eq("slug", slug)
      .maybeSingle();
    if (fallback.error) throw fallback.error;
    form = fallback.data as any;
  } else {
    form = primary.data as any;
  }

  if (!form) return null;

  const { data: qs, error: qsErr } = await supabase
    .from("ff_questions")
    .select("id, order, text, required, allow_other")
    .eq("form_id", form.id)
    .order("order", { ascending: true });
  if (qsErr) throw qsErr;

  return {
    form: {
      id: form.id,
      slug: form.slug,
      name: form.name,
      welcomeTitle: form.welcome_title,
      welcomeSubtitle: form.welcome_subtitle,
      completionTitle: form.completion_title,
      completionSubtitle: form.completion_subtitle,
      chatCopy: (form.chat_copy ?? {
        introTitle: "שלום! 👋",
        introSubtitle: "כדי להתחיל נבקש כמה פרטים ואז נשלח קוד אימות למייל.",
        askName: "מה שמך? (לא חובה)",
        askEmail: "מה המייל שנשלח אליו קוד אימות?",
        askPhone: "מה מספר הטלפון שלך?",
        otpPrompt: "שלחתי קוד אימות למייל — הזן אותו כאן:",
      }) as any,
      nudges:
        Array.isArray(form.nudges) && form.nudges.length > 0
          ? form.nudges
          : form.nudge_question_order && form.nudge_text
            ? [{ atQuestionOrder: form.nudge_question_order, text: form.nudge_text }]
            : [],
      nudgeQuestionOrder: form.nudge_question_order,
      nudgeText: form.nudge_text,
    },
    questions: (qs ?? []).map((q) => ({
      id: q.id,
      order: q.order,
      text: q.text,
      required: q.required,
      allowOther: q.allow_other,
    })),
  };
}

export type FunnelStep = {
  key: string;
  label: string;
  count: number;
};

export type FunnelReport = {
  totalSessions: number;
  steps: FunnelStep[];
};

export type LifecycleFunnelReport = {
  totalSessions: number;
  steps: FunnelStep[];
};

export async function getLifecycleFunnelReport(args: {
  formId?: string | null;
}): Promise<LifecycleFunnelReport> {
  const env = getServerEnv();
  const formId = args.formId ?? null;

  if (env.USE_MOCK_DATA) {
    const sessions = mockStore
      .listSessions()
      .filter((s: any) => (formId ? s.formId === formId : true));
    const sessionIds = new Set(sessions.map((s: any) => String(s.id)));
    const allEvents: any[] = (globalThis as any).__ffMockState?.events ?? [];

    const verified = new Set<string>();
    const startedQuestions = new Set<string>();
    for (const e of allEvents) {
      const sid = String(e.sessionId);
      if (!sessionIds.has(sid)) continue;
      if (e.type === "otp_verified") verified.add(sid);
      if (e.type === "answer") startedQuestions.add(sid);
    }

    const completed = sessions.filter((s: any) => s.status === "completed").length;

    return {
      totalSessions: sessions.length,
      steps: [
        { key: "entered", label: "כניסות לבוט", count: sessions.length },
        { key: "verified", label: "עברו אימות", count: verified.size },
        { key: "started_questions", label: "התחילו את השאלות", count: startedQuestions.size },
        { key: "completed", label: "השלימו את כל השאלות", count: completed },
      ],
    };
  }

  const supabase = getSupabaseServerClient();
  const sessionsQ = supabase.from("ff_sessions").select("id, status, form_id");
  if (formId) sessionsQ.eq("form_id", formId);
  const { data: sessions, error: sErr } = await sessionsQ;
  if (sErr) throw sErr;
  const ids = (sessions ?? []).map((s) => s.id);
  if (ids.length === 0) return { totalSessions: 0, steps: [] };

  const { data: evs, error: eErr } = await supabase
    .from("ff_events")
    .select("session_id, type")
    .in("session_id", ids)
    .in("type", ["otp_verified", "answer"]);
  if (eErr) throw eErr;

  const verified = new Set<string>();
  const startedQuestions = new Set<string>();
  for (const e of evs ?? []) {
    const sid = String((e as any).session_id);
    const type = String((e as any).type);
    if (type === "otp_verified") verified.add(sid);
    if (type === "answer") startedQuestions.add(sid);
  }

  const completed = (sessions ?? []).filter((s) => (s as any).status === "completed").length;

  return {
    totalSessions: ids.length,
    steps: [
      { key: "entered", label: "כניסות לבוט", count: ids.length },
      { key: "verified", label: "עברו אימות", count: verified.size },
      { key: "started_questions", label: "התחילו את השאלות", count: startedQuestions.size },
      { key: "completed", label: "השלימו את כל השאלות", count: completed },
    ],
  };
}

export type ProblemQuestionRow = {
  questionOrder: number;
  reached: number;
  answered: number;
  dropped: number;
  droppedPct: number;
};

export type ProblemQuestionsReport = {
  totalVerified: number;
  rows: ProblemQuestionRow[];
};

export async function getProblemQuestionsReport(args: {
  formId?: string | null;
}): Promise<ProblemQuestionsReport> {
  const env = getServerEnv();
  const formId = args.formId ?? null;

  if (env.USE_MOCK_DATA) {
    const sessions = mockStore
      .listSessions()
      .filter((s: any) => (formId ? s.formId === formId : true));
    const sessionIds = new Set(sessions.map((s: any) => String(s.id)));
    const allEvents: any[] = (globalThis as any).__ffMockState?.events ?? [];

    const verified = new Set<string>();
    const maxAnswered = new Map<string, number>();

    for (const e of allEvents) {
      const sid = String(e.sessionId);
      if (!sessionIds.has(sid)) continue;
      if (e.type === "otp_verified") verified.add(sid);
      if (e.type === "answer") {
        const qo = Number(e.questionOrder);
        if (!Number.isFinite(qo)) continue;
        const prev = maxAnswered.get(sid) ?? 0;
        maxAnswered.set(sid, Math.max(prev, qo));
      }
    }

    const maxQ = Math.max(
      0,
      ...sessions
        .map((s: any) => Number(s.currentQuestionOrder ?? 0))
        .filter((n) => Number.isFinite(n)),
      ...[...maxAnswered.values()],
    );

    const verifiedIds = [...verified];
    const rows: ProblemQuestionRow[] = [];
    for (let i = 1; i <= maxQ; i++) {
      let reached = 0;
      let answered = 0;
      for (const sid of verifiedIds) {
        const m = maxAnswered.get(sid) ?? 0;
        if (m >= i - 1) reached++;
        if (m >= i) answered++;
      }
      const dropped = Math.max(0, reached - answered);
      const droppedPct = reached > 0 ? Math.round((dropped / reached) * 1000) / 10 : 0;
      rows.push({ questionOrder: i, reached, answered, dropped, droppedPct });
    }

    return { totalVerified: verified.size, rows };
  }

  const supabase = getSupabaseServerClient();
  const sessionsQ = supabase.from("ff_sessions").select("id, form_id");
  if (formId) sessionsQ.eq("form_id", formId);
  const { data: sessions, error: sErr } = await sessionsQ;
  if (sErr) throw sErr;
  const ids = (sessions ?? []).map((s) => s.id);
  if (ids.length === 0) return { totalVerified: 0, rows: [] };

  const { data: evs, error: eErr } = await supabase
    .from("ff_events")
    .select("session_id, type, question_order")
    .in("session_id", ids)
    .in("type", ["otp_verified", "answer"]);
  if (eErr) throw eErr;

  const verified = new Set<string>();
  const maxAnswered = new Map<string, number>();

  for (const e of evs ?? []) {
    const sid = String((e as any).session_id);
    const type = String((e as any).type);
    if (type === "otp_verified") verified.add(sid);
    if (type === "answer") {
      const qo = Number((e as any).question_order);
      if (!Number.isFinite(qo)) continue;
      const prev = maxAnswered.get(sid) ?? 0;
      maxAnswered.set(sid, Math.max(prev, qo));
    }
  }

  let maxQ = 0;
  if (formId) {
    const { data: qRows, error: qErr } = await supabase
      .from("ff_questions")
      .select("order")
      .eq("form_id", formId)
      .order("order", { ascending: false })
      .limit(1);
    if (qErr) throw qErr;
    maxQ = Number(qRows?.[0]?.order ?? 0);
  } else {
    maxQ = Math.max(0, ...[...maxAnswered.values()]);
  }

  const verifiedIds = [...verified];
  const rows: ProblemQuestionRow[] = [];
  for (let i = 1; i <= maxQ; i++) {
    let reached = 0;
    let answered = 0;
    for (const sid of verifiedIds) {
      const m = maxAnswered.get(String(sid)) ?? 0;
      if (m >= i - 1) reached++;
      if (m >= i) answered++;
    }
    const dropped = Math.max(0, reached - answered);
    const droppedPct = reached > 0 ? Math.round((dropped / reached) * 1000) / 10 : 0;
    rows.push({ questionOrder: i, reached, answered, dropped, droppedPct });
  }

  return { totalVerified: verified.size, rows };
}

export async function getFunnelReport(args: { formId?: string | null }): Promise<FunnelReport> {
  const env = getServerEnv();
  const formId = args.formId ?? null;

  if (env.USE_MOCK_DATA) {
    const sessions = mockStore
      .listSessions()
      .filter((s: any) => (formId ? s.formId === formId : true));
    const sessionIds = new Set(sessions.map((s: any) => s.id));
    const allEvents: any[] = (globalThis as any).__ffMockState?.events ?? [];

    const hasOtpSent = new Set<string>();
    const hasOtpVerified = new Set<string>();
    const maxAnswered = new Map<string, number>();
    for (const e of allEvents) {
      if (!sessionIds.has(e.sessionId)) continue;
      if (e.type === "otp_sent") hasOtpSent.add(String(e.sessionId));
      if (e.type === "otp_verified") hasOtpVerified.add(String(e.sessionId));
      if (e.type === "answer") {
        const qo = Number(e.questionOrder);
        if (!Number.isFinite(qo)) continue;
        const prev = maxAnswered.get(String(e.sessionId)) ?? 0;
        maxAnswered.set(String(e.sessionId), Math.max(prev, qo));
      }
    }

    const maxQ = Math.max(
      0,
      ...sessions.map((s: any) => Number(s.currentQuestionOrder ?? 0)).filter((n) => Number.isFinite(n)),
    );
    const maxQuestions = Math.max(maxQ, ...[...maxAnswered.values()]);

    const steps: FunnelStep[] = [];
    steps.push({ key: "otp_sent", label: "נשלח קוד", count: hasOtpSent.size });
    steps.push({ key: "otp_verified", label: "אומת קוד", count: hasOtpVerified.size });
    for (let i = 1; i <= maxQuestions; i++) {
      const c = sessions.filter((s: any) => (maxAnswered.get(String(s.id)) ?? 0) >= i).length;
      steps.push({ key: `answered_${i}`, label: `ענו על שאלה ${i}`, count: c });
    }
    const completed = sessions.filter((s: any) => s.status === "completed").length;
    steps.push({ key: "completed", label: "הושלם", count: completed });

    return { totalSessions: sessions.length, steps };
  }

  const supabase = getSupabaseServerClient();
  const sessionsQ = supabase.from("ff_sessions").select("id, status, form_id");
  if (formId) sessionsQ.eq("form_id", formId);
  const { data: sessions, error: sErr } = await sessionsQ;
  if (sErr) throw sErr;
  const ids = (sessions ?? []).map((s) => s.id);
  if (ids.length === 0) return { totalSessions: 0, steps: [] };

  const { data: evs, error: eErr } = await supabase
    .from("ff_events")
    .select("session_id, type, question_order")
    .in("session_id", ids);
  if (eErr) throw eErr;

  const hasOtpSent = new Set<string>();
  const hasOtpVerified = new Set<string>();
  const maxAnswered = new Map<string, number>();
  for (const e of evs ?? []) {
    const sid = String((e as any).session_id);
    const type = String((e as any).type);
    if (type === "otp_sent") hasOtpSent.add(sid);
    if (type === "otp_verified") hasOtpVerified.add(sid);
    if (type === "answer") {
      const qo = Number((e as any).question_order);
      if (!Number.isFinite(qo)) continue;
      const prev = maxAnswered.get(sid) ?? 0;
      maxAnswered.set(sid, Math.max(prev, qo));
    }
  }

  let maxQuestions = 0;
  if (formId) {
    const { data: qRows, error: qErr } = await supabase
      .from("ff_questions")
      .select("order")
      .eq("form_id", formId)
      .order("order", { ascending: false })
      .limit(1);
    if (qErr) throw qErr;
    maxQuestions = Number(qRows?.[0]?.order ?? 0);
  } else {
    // fallback: infer from max answered
    maxQuestions = Math.max(0, ...[...maxAnswered.values()]);
  }

  const steps: FunnelStep[] = [];
  steps.push({ key: "otp_sent", label: "נשלח קוד", count: hasOtpSent.size });
  steps.push({ key: "otp_verified", label: "אומת קוד", count: hasOtpVerified.size });
  for (let i = 1; i <= maxQuestions; i++) {
    let c = 0;
    for (const sid of ids) {
      if ((maxAnswered.get(String(sid)) ?? 0) >= i) c++;
    }
    steps.push({ key: `answered_${i}`, label: `ענו על שאלה ${i}`, count: c });
  }
  const completed = (sessions ?? []).filter((s) => (s as any).status === "completed").length;
  steps.push({ key: "completed", label: "הושלם", count: completed });

  return { totalSessions: ids.length, steps };
}

export async function upsertAnswer(args: {
  sessionId: string;
  formSlug: string;
  questionId: string;
  questionOrder: number;
  value: AnswerValue;
  otherText: string | null;
}) {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    mockStore.upsertAnswer({
      sessionId: args.sessionId,
      questionId: args.questionId,
      questionOrder: args.questionOrder,
      value: args.value,
      otherText: args.otherText,
    });
    mockStore.addEvent({
      sessionId: args.sessionId,
      type: "answer",
      questionOrder: args.questionOrder,
      meta: { value: args.value, otherText: args.otherText },
    });
    return;
  }

  const supabase = getSupabaseServerClient();
  await supabase
    .from("ff_answers")
    .upsert({
      session_id: args.sessionId,
      question_id: args.questionId,
      answer: args.value,
      other_text: args.otherText,
    });

  await supabase.from("ff_events").insert({
    session_id: args.sessionId,
    type: "answer",
    question_order: args.questionOrder,
    meta: { value: args.value, otherText: args.otherText },
  });
}

export async function completeSession(sessionId: string) {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    mockStore.completeSession(sessionId);
    mockStore.addEvent({ sessionId, type: "completed" });
    return;
  }

  const supabase = getSupabaseServerClient();
  await supabase
    .from("ff_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", sessionId);
  await supabase.from("ff_events").insert({ session_id: sessionId, type: "completed" });
}

export async function createOtpSession(args: {
  formId: string;
  name: string | null;
  email: string;
  phone: string | null;
  otpHash: string;
  otpExpiresAtIso: string;
}) {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    const s = mockStore.createSession({
      formId: args.formId,
      name: args.name,
      email: args.email,
      phone: args.phone,
      otpHash: args.otpHash,
      otpExpiresAt: args.otpExpiresAtIso,
    });
    mockStore.addEvent({ sessionId: s.id, type: "otp_sent", meta: { email: args.email } });
    return { id: s.id };
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ff_sessions")
    .insert({
      form_id: args.formId,
      name: args.name,
      email: args.email,
      phone: args.phone,
      status: "started",
      otp_hash: args.otpHash,
      otp_expires_at: args.otpExpiresAtIso,
      current_question_order: 0,
    })
    .select("id")
    .single();

  if (error) throw error;

  await supabase.from("ff_events").insert({
    session_id: data.id,
    type: "otp_sent",
    meta: { email: args.email },
  });

  return data;
}

export async function getOtpSession(sessionId: string) {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    const s = mockStore.getSession(sessionId);
    if (!s) return null;
    return {
      id: s.id,
      otp_hash: s.otpHash,
      otp_expires_at: s.otpExpiresAt,
      verified_at: s.verifiedAt,
    };
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ff_sessions")
    .select("id, otp_hash, otp_expires_at, verified_at")
    .eq("id", sessionId)
    .single();

  if (error) throw error;
  return data;
}

export async function markSessionVerified(sessionId: string) {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    const s = mockStore.verifySession(sessionId);
    if (!s) return;
    mockStore.addEvent({ sessionId: s.id, type: "otp_verified" });
    return;
  }

  const supabase = getSupabaseServerClient();
  await supabase
    .from("ff_sessions")
    .update({ status: "verified", verified_at: new Date().toISOString() })
    .eq("id", sessionId);

  await supabase.from("ff_events").insert({
    session_id: sessionId,
    type: "otp_verified",
  });
}

export async function addOtpFailedEvent(sessionId: string) {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    mockStore.addEvent({ sessionId, type: "otp_failed" });
    return;
  }

  const supabase = getSupabaseServerClient();
  await supabase.from("ff_events").insert({ session_id: sessionId, type: "otp_failed" });
}

export async function updateSessionPhone(args: { sessionId: string; phone: string }) {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    const s = mockStore.setSessionPhone(args.sessionId, args.phone);
    if (!s) return;
    mockStore.addEvent({ sessionId: s.id, type: "phone_updated", meta: { phone: args.phone } });
    return;
  }

  const supabase = getSupabaseServerClient();
  await supabase
    .from("ff_sessions")
    .update({ phone: args.phone })
    .eq("id", args.sessionId);

  await supabase.from("ff_events").insert({
    session_id: args.sessionId,
    type: "phone_updated",
    meta: { phone: args.phone },
  });
}

export type ReportsOverview = {
  funnel: {
    started: number;
    verified: number;
    completed: number;
  };
  answersByQuestionOrder: Array<{ questionOrder: number; answers: number }>;
};

export async function getReportsOverview(args: {
  formId?: string | null;
}): Promise<ReportsOverview> {
  const env = getServerEnv();
  const formId = args.formId ?? null;

  if (env.USE_MOCK_DATA) {
    const sessions = mockStore
      .listSessions()
      .filter((s: any) => (formId ? s.formId === formId : true));
    const funnel = {
      started: sessions.length,
      verified: sessions.filter((s: any) => s.status === "verified" || s.status === "completed").length,
      completed: sessions.filter((s: any) => s.status === "completed").length,
    };

    const sessionIds = new Set(sessions.map((s: any) => s.id));
    const allEvents: any[] = (globalThis as any).__ffMockState?.events ?? [];
    const byQ = new Map<number, Set<string>>();
    for (const e of allEvents) {
      if (!sessionIds.has(e.sessionId)) continue;
      if (e.type !== "answer") continue;
      const qo = Number(e.questionOrder);
      if (!Number.isFinite(qo)) continue;
      const set = byQ.get(qo) ?? new Set<string>();
      set.add(String(e.sessionId));
      byQ.set(qo, set);
    }
    const answersByQuestionOrder = [...byQ.entries()]
      .map(([questionOrder, set]) => ({ questionOrder, answers: set.size }))
      .sort((a, b) => a.questionOrder - b.questionOrder);

    return { funnel, answersByQuestionOrder };
  }

  const supabase = getSupabaseServerClient();
  const sessionsQ = supabase
    .from("ff_sessions")
    .select("id, form_id, status")
    .order("created_at", { ascending: false });
  if (formId) sessionsQ.eq("form_id", formId);
  const { data: sessions, error: sErr } = await sessionsQ;
  if (sErr) throw sErr;

  const funnel = {
    started: (sessions ?? []).length,
    verified: (sessions ?? []).filter((s) => s.status === "verified" || s.status === "completed").length,
    completed: (sessions ?? []).filter((s) => s.status === "completed").length,
  };

  const ids = (sessions ?? []).map((s) => s.id);
  if (ids.length === 0) return { funnel, answersByQuestionOrder: [] };

  const { data: evs, error: eErr } = await supabase
    .from("ff_events")
    .select("session_id, type, question_order")
    .in("session_id", ids)
    .eq("type", "answer");
  if (eErr) throw eErr;

  const byQ = new Map<number, Set<string>>();
  for (const e of evs ?? []) {
    const qo = Number((e as any).question_order);
    if (!Number.isFinite(qo)) continue;
    const sid = String((e as any).session_id);
    const set = byQ.get(qo) ?? new Set<string>();
    set.add(sid);
    byQ.set(qo, set);
  }

  const answersByQuestionOrder = [...byQ.entries()]
    .map(([questionOrder, set]) => ({ questionOrder, answers: set.size }))
    .sort((a, b) => a.questionOrder - b.questionOrder);

  return { funnel, answersByQuestionOrder };
}
