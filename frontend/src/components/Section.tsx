export function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="registry-section mb-10">
      <h2 className="text-xl text-ink mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-ink-soft mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </section>
  );
}