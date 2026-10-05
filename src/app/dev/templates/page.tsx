import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateLab } from "@/components/templates/TemplateLab";

export const metadata: Metadata = {
  title: "Template Lab",
  robots: { index: false, follow: false },
};

// Checked per request so `TEMPLATE_LAB=1 next start` can open it on a production build.
export const dynamic = "force-dynamic";

/** Template authoring tool. Hidden in production unless TEMPLATE_LAB=1. */
export default function TemplateLabPage() {
  if (process.env.NODE_ENV === "production" && process.env.TEMPLATE_LAB !== "1") notFound();
  return <TemplateLab />;
}
