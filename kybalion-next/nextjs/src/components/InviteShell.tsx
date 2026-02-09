import Link from "next/link";
import Image from "next/image";
import AuthAwareButtons from "@/components/AuthAwareButtons";
import UserGreeting from "@/components/UserGreeting";

type InviteShellProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  imageSrc?: string;
  imageAlt?: string;
  children: React.ReactNode;
};

export default function InviteShell({
  eyebrow,
  title,
  subtitle,
  imageSrc,
  imageAlt,
  children,
}: InviteShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 text-slate-900">
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.12),_transparent_60%)]" />
      <div className="absolute right-10 top-16 h-40 w-40 rounded-full bg-sky-100 blur-3xl opacity-60" />

      <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Invite</p>
            <p className="text-lg font-semibold text-slate-900">{title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <UserGreeting className="text-sm font-semibold text-slate-700" />
            <Link
              href="/"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            >
              New home
            </Link>
            <Link
              href="/old"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            >
              Legacy pages
            </Link>
            <AuthAwareButtons variant="nav" />
          </div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-5xl px-6 pb-16 pt-10">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.32em] text-slate-500">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-3 text-base text-slate-600">{subtitle}</p> : null}

          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt || title}
              width={1200}
              height={700}
              className="mt-6 w-full rounded-2xl border border-slate-200 shadow"
              sizes="(max-width: 768px) 100vw, 900px"
              unoptimized
            />
          ) : null}

          <div className="mt-6 space-y-4 text-base text-slate-700">{children}</div>
        </div>
      </main>
    </div>
  );
}
