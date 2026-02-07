import DocsShell from "@/components/docs/DocsShell";
import DocsSectionGrid from "@/components/docs/DocsSectionGrid";
import DocsFilesPanel from "@/components/docs/DocsFilesPanel";

export default function DocsIndexPage() {
  return (
    <DocsShell
      title="Document Library"
      subtitle="Session materials, templates, and facilitator resources."
    >
      <DocsSectionGrid heading="Browse by section" />
      <DocsFilesPanel prefix="" />
    </DocsShell>
  );
}
