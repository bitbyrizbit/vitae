type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function Section({ title, subtitle, action, children }: Props) {
  return (
    <section className="mb-12 animate-in">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-start gap-3">
          <div className="w-[3px] h-5 bg-gold rounded-full mt-1 shrink-0" />
          <div>
            <h2 className="text-lg text-text font-display">{title}</h2>
            {subtitle && (
              <p className="text-[13px] text-text-secondary mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0 ml-4">{action}</div>}
      </div>
      {children}
    </section>
  );
}