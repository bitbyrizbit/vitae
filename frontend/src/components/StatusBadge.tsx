type Props = {
  status: string;
};

const styles: Record<string, string> = {
  draft: "bg-surface-2 text-text-secondary border border-rule-strong",
  submitted: "bg-sky-bg text-sky border border-sky/20",
  hod_approved: "bg-sage-bg text-sage border border-sage/20",
  iqac_approved: "bg-brown-light/30 text-brown border border-brown/20",
  rejected: "bg-coral-bg text-coral border border-coral/20",
  eligible: "bg-brown-light/30 text-brown border border-brown/20",
  not_eligible: "bg-surface-2 text-text-secondary border border-rule-strong",
  pending: "bg-surface-2 text-text-secondary border border-rule-strong",
};

const labels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  hod_approved: "HOD approved",
  iqac_approved: "IQAC approved",
  rejected: "Rejected",
  eligible: "Eligible",
  not_eligible: "Not eligible",
  pending: "Pending",
};

export function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-[12px] font-medium rounded-[3px] whitespace-nowrap ${
        styles[status] || styles.draft
      }`}
    >
      {labels[status] || (status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " "))}
    </span>
  );
}
