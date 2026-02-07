import InviteShell from "@/components/InviteShell";
import Link from "next/link";

export default function QuickInvite() {
  return (
    <InviteShell
      eyebrow="Quick invite"
      title="Understanding Universal Laws & Principles"
      subtitle="A year-long online meet-up around The Kybalion. Light reading, real conversation, once or twice a month."
      imageSrc="/kybalion/images/1.png"
      imageAlt="Holding The Kybalion book"
    >
      <p>Hi friends,</p>
      <p>
        I am starting an online meet-up around learning and applying universal law and principles from the book
        &quot;The Kybalion&quot;, and I would love for you to join me.
      </p>
      <p>
        If you have ever been into ideas like changing your mindset, emotional intelligence, law of attraction, cause
        and effect, or even noticing how the same lessons keep showing up in different situations, this will feel
        familiar.
      </p>
      <p>
        We will meet once or twice a month for light reading and real conversation. No pressure to be deep or perfect.
        Just practical takeaways you can use.
      </p>
      <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-900">
        If you are interested, reply to the text message with &quot;I&apos;m in&quot;.
      </div>
      <p className="text-sm font-semibold text-slate-500">Full details to come.</p>
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
