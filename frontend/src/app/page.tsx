import Link from "next/link";
import { Button } from "@/components/Button";

const features = [
  {
    title: "Instant UGC scoring",
    body: "Every publication and activity you log is scored against the UGC API point table in real-time. No spreadsheets, no waiting for HR calculations.",
  },
  {
    title: "Google Scholar sync",
    body: "Link your Google Scholar profile once. Vitae pulls your publications, citation counts, and venue data automatically, deduplicating everything.",
  },
  {
    title: "Audit-ready reporting",
    body: "HOD and IQAC review chains are built right in. Generates perfectly formatted PDF exports ready for CAS committees and NAAC reporting.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-base flex flex-col">
      {/* header */}
      <header className="px-6 md:px-12 py-8 flex items-center justify-between">
        <span className="text-2xl text-blue font-display tracking-tight">Vitae</span>
        <nav className="flex gap-6 items-center">
          <Link
            href="/login"
            className="text-sm font-medium text-text-secondary hover:text-brown transition-colors"
          >
            Sign in
          </Link>
          <Link href="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      {/* Asymmetric Hero + Features */}
      <section className="flex-1 max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        
        {/* Left Col: Hero */}
        <div className="lg:col-span-7 flex flex-col justify-center animate-in">
          <div className="w-12 h-1 bg-brown mb-8" />
          <h1 className="text-5xl md:text-7xl text-blue font-display leading-[1.05] tracking-tight mb-8">
            The appraisal system that actually does the math.
          </h1>
          <p className="text-lg md:text-xl text-text-secondary mb-12 max-w-2xl leading-relaxed font-body">
            Vitae replaces yearly appraisal paperwork with a unified dossier. It computes your UGC API score as you log activities, pulls publications from Google Scholar, and hands your IQAC office exactly the record it needs.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/register">
              <Button>Register as faculty</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Sign in to dossier</Button>
            </Link>
          </div>
        </div>

        {/* Right Col: Features (Structured list) */}
        <div className="lg:col-span-5 flex flex-col justify-center gap-10 animate-in stagger-2">
          {features.map((f, i) => (
            <div key={i} className="pl-6 border-l border-rule-strong">
              <h3 className="text-xl text-blue font-display mb-2">
                {f.title}
              </h3>
              <p className="text-[15px] text-text-secondary leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>

      </section>

      {/* footer */}
      <footer className="px-6 md:px-12 py-8 border-t border-rule mt-auto flex justify-between items-center">
        <p className="text-sm text-text-tertiary">
          Vitae — Built for Smart India Hackathon 2026
        </p>
        <div className="w-4 h-4 bg-brown rounded-full opacity-20" />
      </footer>
    </main>
  );
}