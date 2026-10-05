import type { Metadata } from "next";
import { Editor } from "@/components/editor/Editor";
import { getTemplate, templates } from "@/templates/registry";

export const metadata: Metadata = {
  title: "Editor",
};

export default async function EditorPage({ searchParams }: PageProps<"/editor">) {
  const { template } = await searchParams;
  const fromUrl = typeof template === "string" && getTemplate(template) !== undefined;
  return <Editor initialTemplateId={fromUrl ? template : templates[0].id} templateFromUrl={fromUrl} />;
}
