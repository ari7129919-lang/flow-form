import FormChatClient from "./client";
import { getFormBootstrap } from "@/lib/data";

export default async function FormChatPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const bootstrap = await getFormBootstrap(formId);
  return <FormChatClient formSlug={formId} initialBootstrap={bootstrap} />;
}
