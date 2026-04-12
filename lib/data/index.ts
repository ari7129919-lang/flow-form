import { getServerEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { mockStore } from "@/lib/data/mockStore";
import type { AnswerValue } from "@/lib/data/answers";

export type FormRow = { id: string; slug: string; name: string };

export type AdminForm = {
  id: string;
  slug: string;
  name: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  completionTitle: string;
  completionSubtitle: string;
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

export async function listForms(): Promise<AdminForm[]> {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    return mockStore.listForms();
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ff_forms")
    .select(
      "id, slug, name, welcome_title, welcome_subtitle, completion_title, completion_subtitle, nudge_question_order, nudge_text",
    )
    .order("slug", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((f) => ({
    id: f.id,
    slug: f.slug,
    name: f.name,
    welcomeTitle: f.welcome_title,
    welcomeSubtitle: f.welcome_subtitle,
    completionTitle: f.completion_title,
    completionSubtitle: f.completion_subtitle,
    nudgeQuestionOrder: f.nudge_question_order,
    nudgeText: f.nudge_text,
  }));
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
  const { data: f, error: fErr } = await supabase
    .from("ff_forms")
    .select(
      "id, slug, name, welcome_title, welcome_subtitle, completion_title, completion_subtitle, nudge_question_order, nudge_text",
    )
    .eq("id", formId)
    .maybeSingle();
  if (fErr) throw fErr;
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
  const { data, error } = await supabase
    .from("ff_forms")
    .insert({ slug: args.slug, name: args.name })
    .select(
      "id, slug, name, welcome_title, welcome_subtitle, completion_title, completion_subtitle, nudge_question_order, nudge_text",
    )
    .single();
  if (error) throw error;
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    welcomeTitle: data.welcome_title,
    welcomeSubtitle: data.welcome_subtitle,
    completionTitle: data.completion_title,
    completionSubtitle: data.completion_subtitle,
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
  if (patch.nudgeQuestionOrder !== undefined) payload.nudge_question_order = patch.nudgeQuestionOrder;
  if (patch.nudgeText !== undefined) payload.nudge_text = patch.nudgeText;

  const { data, error } = await supabase
    .from("ff_forms")
    .update(payload)
    .eq("id", formId)
    .select(
      "id, slug, name, welcome_title, welcome_subtitle, completion_title, completion_subtitle, nudge_question_order, nudge_text",
    )
    .single();
  if (error) throw error;
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    welcomeTitle: data.welcome_title,
    welcomeSubtitle: data.welcome_subtitle,
    completionTitle: data.completion_title,
    completionSubtitle: data.completion_subtitle,
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
  const { data: form, error: formErr } = await supabase
    .from("ff_forms")
    .select(
      "id, slug, name, welcome_title, welcome_subtitle, completion_title, completion_subtitle, nudge_question_order, nudge_text",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (formErr) throw formErr;
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
