import { notFound } from "next/navigation";
import DocsShell from "@/components/docs/DocsShell";
import DocsFilesPanel from "@/components/docs/DocsFilesPanel";
import { DOC_SECTIONS, getDocSection } from "@/lib/docs/sections";

export function generateStaticParams() {
  return DOC_SECTIONS.map((section) => ({ section: section.key }));
}

export default async function DocsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const current = getDocSection(section);
  if (!current) {
    notFound();
  }

  return (
    <DocsShell
      title={current.title}
      subtitle={current.description}
      activeKey={current.key}
    >
      <DocsFilesPanel prefix={current.prefix} />
    </DocsShell>
  );
}
