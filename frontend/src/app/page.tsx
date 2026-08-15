import Link from "next/link";
import { Button } from "@/components/Button";

const features = [
  {
    num: "01",
    title: "scored",
    body: "Every publication and activity you log is scored against the UGC API point table the moment you add it. No spreadsheet math, no waiting for HR to tally eligibility by hand.",
  },
  {
    num: "02",
    title: "synced",
    body: "Link your Google Scholar profile once. Vitae pulls your publications, citation counts, and venue data directly, deduplicating against what you have already logged.",
  },
  {
    num: "03",
    title: "audited",
    body: "HOD and IQAC review chains built in, with a formatted PDF export ready for CAS committees and NAAC reporting. One data source, two downstream processes.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-base flex flex-col">
      {/* gold accent */}
      <div className="h-[2px] bg-gold" />

      {/* header */}
      <header className="px-6 md:px-8 py-5 flex items-center justify-between border-b border-rule-subtle">
        <span className="text-xl text-text font-display">Vitae</span>
        <nav className="flex gap-5 items-center">
          <Link
            href="/login"
            className="text-sm text-text-secondary hover:text-text transition-colors duration-200"
          >
            sign in
          </Link>
          <Link href="/register">
            <Button size="sm">get started</Button>
          </Link>
        </nav>
      </header>

      {/* hero */}
      <section className="flex-1 flex items-center">
        <div className="max-w-3xl mx-auto px-6 md:px-8 py-16 md:py-24 animate-in">
          <p className="font-mono text-[11px] text-gold tracking-wide mb-5">
            faculty appraisal registry
          </p>
          <h1 className="text-4xl md:text-[56px] text-text leading-[1.08] mb-7 font-display">
            Every publication, seminar, and lecture, scored the way your career
            advancement actually gets decided.
          </h1>
          <p className="text-base md:text-lg text-text-secondary mb-10 max-w-xl leading-relaxed">
            Vitae replaces the yearly appraisal paperwork with a system that
            computes your UGC API score as you log activity, pulls publications
            straight from Google Scholar, and hands your institution's IQAC
            office exactly the record it needs.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register">
              <Button>register as faculty</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">sign in</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* features -- strata bands, not cards */}
      <section className="border-t border-rule">
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-12">
            {features.map((f, i) => (
              <div
                key={f.num}
                className={`py-6 md:py-0 animate-in stagger-${i + 1} ${
                  i < features.length - 1
                    ? "border-b md:border-b-0 border-rule-subtle"
                    : ""
                }`}
              >
                <span className="font-mono text-[11px] text-gold">{f.num}</span>
                <h3 className="text-base text-text font-display mt-1 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* how it works -- brief workflow */}
      <section className="border-t border-rule bg-surface-1">
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-16 md:py-20 animate-in stagger-3">
          <p className="font-mono text-[11px] text-text-tertiary mb-4">how it works</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { step: "1", text: "Register with your employee code and department" },
              { step: "2", text: "Log publications and activities, or sync from Scholar" },
              { step: "3", text: "Submit your appraisal and download the scored PDF" },
              { step: "4", text: "HOD and IQAC review, approve, and the record is complete" },
            ].map((item) => (
              <div key={item.step}>
                <span className="text-2xl font-display text-gold">{item.step}</span>
                <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="px-6 md:px-8 py-6 border-t border-rule-subtle text-center">
        <p className="font-mono text-[11px] text-text-ghost">
          Vitae, built for Smart India Hackathon 2026
        </p>
      </footer>
    </main>
  );
}