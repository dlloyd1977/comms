import InviteShell from "@/components/InviteShell";

export default function BookclubInvitePage() {
  return (
    <InviteShell
      eyebrow="Book club"
      title="Book Club Invitation"
      subtitle="Invitation and details for the book club gathering."
      imageSrc="/bookclub/images/preview.png"
      imageAlt="Book club preview"
    >
      <p>Write your short opening paragraph here.</p>
      <h2 className="text-xl font-semibold text-slate-900">Details</h2>
      <p>Add the main invite details here.</p>
      <h2 className="text-xl font-semibold text-slate-900">Call to action</h2>
      <p>Tell people how to respond (text you, email you, RSVP link, etc.).</p>
      <div className="text-sm font-semibold text-slate-900">
        Your Name<br />
        (000) 000-0000<br />
        you@example.com
      </div>
    </InviteShell>
  );
}
