import type { Metadata } from "next";
import KickoffInvite from "@/app/kybalion/_components/KickoffInvite";

export const metadata: Metadata = {
  title: "Kybalion Session 2 Invite — Saturday, March 7, 2026 @ 3:00 PM",
  description:
    "Session 2 invite for Universal Laws & Principles, The Kybalion — Saturday, March 7, 2026 at 3:00 PM.",
  openGraph: {
    title: "Session 2 — Saturday, March 7, 2026 @ 3:00 PM",
    description:
      "Thank you for joining Session 1. Session 2 covers Chapter 2: The Seven Hermetic Principles. Includes study guide links and preparation steps.",
    images: [
      {
        url: "/kybalion/images/2.png",
        alt: "Holding The Kybalion book",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Session 2 — Saturday, March 7, 2026 @ 3:00 PM",
    description:
      "Thank you for joining Session 1. Session 2 covers Chapter 2: The Seven Hermetic Principles. Includes study guide links and preparation steps.",
    images: ["/kybalion/images/2.png"],
  },
};

export default function KybalionInviteTwoPage() {
  return <KickoffInvite />;
}
