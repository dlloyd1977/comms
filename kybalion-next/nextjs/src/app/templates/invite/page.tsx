import InviteShell from "@/components/InviteShell";

export default function InviteTemplatePage() {
  return (
    <InviteShell
      eyebrow="Invite template"
      title="Starter invite layout"
      subtitle="Use this template to launch new comms invites."
    >
      <p>
        Copy the template folder, update the headline, description, and preview image, then publish under a new
        slug.
      </p>
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Steps</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Duplicate the invite template folder.</li>
          <li>Update copy, image, and canonical URL.</li>
          <li>Publish and share the new link.</li>
        </ol>
      </div>
      <p className="text-sm text-slate-500">
        Legacy template files remain under /old/_templates/invite for reference.
      </p>
    </InviteShell>
  );
}
