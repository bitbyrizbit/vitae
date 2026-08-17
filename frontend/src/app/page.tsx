import Link from "next/link";
import { Button } from "@/components/Button";

const features = [
  {
    title: "Automated Resume Extraction",
    body: "Upload your CV. Vitae instantly extracts, categorizes, and assesses your academic publications and activities—zero manual data entry required.",
  },
  {
    title: "Google Scholar & Scopus Sync",
    body: "Automated integration for easy migration of data. Vitae pulls citations, venues, and documents, instantly scoring them against UGC API rules.",
  },
  {
    title: "Dynamic UGC Score Evaluation",
    body: "Deterministic, rule-based scoring engine (zero hallucinations). Faculty receive real-time CAS eligibility tracking and audit-ready PDF exports.",
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
            Stop counting points.<br />Start proving impact.
          </h1>
          <p className="text-lg md:text-xl text-text-secondary mb-12 max-w-2xl leading-relaxed font-body">
            1.5 million faculty waste weeks manually cross-referencing UGC circulars to calculate API scores, while IQAC offices drown in unverified spreadsheets. Vitae is a deterministic appraisal engine that computes UGC PBAS scores in real-time, syncs research automatically, and generates IQAC-ready dossiers.
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