import Link from "next/link";
import { Button } from "@/components/Button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-paper flex flex-col">
      <header className="border-b border-border px-8 py-5 flex items-center justify-between">
        <span className="text-xl text-ink font-serif">Vitae</span>
        <nav className="flex gap-6 items-center">
          <Link href="/login" className="text-sm text-ink-soft hover:text-ink">
            sign in
          </Link>
          <Link href="/register">
            <Button>get started</Button>
          </Link>
        </nav>
      </header>

      <section className="flex-1 flex items-center">
        <div className="max-w-3xl mx-auto px-8 py-20">
          <p className="font-mono text-xs text-maroon uppercase tracking-wide mb-4">
            faculty appraisal registry
          </p>
          <h1 className="text-5xl text-ink leading-tight mb-6">
            Every publication, seminar, and lecture, scored the way your career advancement actually gets decided.
          </h1>
          <p className="text-lg text-ink-soft mb-10 max-w-xl">
            Vitae replaces the yearly appraisal paperwork with a system that computes your UGC API
            score as you log activity, pulls publications straight from Google Scholar, and hands
            your institution's IQAC office exactly the record it needs.
          </p>
          <div className="flex gap-4">
            <Link href="/register">
              <Button>register as faculty</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost">sign in</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="max-w-4xl mx-auto px-8 py-16 grid grid-cols-3 gap-10">
          <div className="registry-section">
            <h3 className="text-base text-ink mb-2">auto-scored</h3>
            <p className="text-sm text-ink-soft">
              Every publication and activity you log is scored against the UGC API point table
              automatically. No spreadsheet math, no waiting for HR to calculate eligibility.
            </p>
          </div>
          <div className="registry-section">
            <h3 className="text-base text-ink mb-2">scholar synced</h3>
            <p className="text-sm text-ink-soft">
              Link your Google Scholar profile once. Your publication record stays current without
              re-typing a single citation.
            </p>
          </div>
          <div className="registry-section">
            <h3 className="text-base text-ink mb-2">audit ready</h3>
            <p className="text-sm text-ink-soft">
              HOD and IQAC review chains built in, with a formatted PDF export ready for CAS
              committees and NAAC reporting.
            </p>
          </div>
        </div>
      </section>

      <footer className="px-8 py-6 text-center">
        <p className="font-mono text-xs text-ink-soft">Vitae, built for SIH 2026</p>
      </footer>
    </main>
  );
}