type Props = {
  status: string;
};

const styles: Record<string, string> = {
  draft: "bg-surface-3 text-text-tertiary",
  submitted: "bg-sky/15 text-sky",
  hod_approved: "bg-sage/15 text-sage",
  iqac_approved: "bg-gold/15 text-gold",
  rejected: "bg-coral/15 text-coral",
  eligible: "bg-gold/15 text-gold",
  not_eligible: "bg-surface-3 text-text-tertiary",
  pending: "bg-surface-3 text-text-tertiary",
};

const labels: Record<string, string> = {
  draft: "draft",
  submitted: "submitted",
  hod_approved: "hod approved",
  iqac_approved: "iqac approved",
  rejected: "rejected",
  eligible: "eligible",
  not_eligible: "not eligible",
  pending: "pending",
};

export function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-block px-2.5 py-1 text-[11px] font-mono rounded-[3px] whitespace-nowrap ${
        styles[status] || styles.draft
      }`}
    >
      {labels[status] || status.replace(/_/g, " ")}
    </span>
  );
}
