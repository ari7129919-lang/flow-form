import FormChatClient from "./client";

export default async function FormChatPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  return <FormChatClient formSlug={formId} />;
}
