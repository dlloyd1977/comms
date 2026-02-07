import InviteShell from "@/components/InviteShell";
import Link from "next/link";

export default function KickoffInvite() {
  return (
    <InviteShell
      eyebrow="Kick-off meeting"
      title="Universal Laws & Principles, The Kybalion"
      subtitle="A year-long book meet-up focused on understanding how mindset, emotions, and patterns shape everyday life."
      imageSrc="/kybalion/images/2.png"
      imageAlt="Holding The Kybalion book"
    >
      <p>
        We meet once or twice a month to explore practical ideas that help you think more clearly, stay grounded, and
        respond to life with more intention.
      </p>
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Kick-off meeting</p>
        <p>Saturday, February 7, 2026</p>
        <p>Online via Zoom</p>
      </div>
      <p className="font-semibold text-slate-900">What to bring</p>
      <ul className="list-disc space-y-2 pl-6 text-slate-700">
        <li>A copy of The Kybalion (ebook is fine)</li>
        <li>Something to take notes with</li>
        <li>An open mind</li>
      </ul>
      <p className="font-semibold text-slate-900">RSVP</p>
      <p>
        Reply to the invite text or email to confirm attendance. A calendar invite and Zoom link will follow.
      </p>
      <div className="pt-2">
        <Link
          href="/kybalion"
          className="inline-flex items-center text-sm font-semibold text-slate-900 hover:text-slate-700"
        >
          Back to Kybalion hub
        </Link>
      </div>
    </InviteShell>
  );
}
