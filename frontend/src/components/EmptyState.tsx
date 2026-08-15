import { Button } from "./Button";

type Props = {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function EmptyState({ message, action }: Props) {
  return (
    <div className="py-20 flex flex-col items-center justify-center border border-dashed border-rule-strong rounded-[4px] bg-surface-1/50">
      <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mb-4">
        <span className="text-text-ghost text-xl">/</span>
      </div>
      <p className="text-text-tertiary text-[15px] mb-5 font-medium">{message}</p>
      {action && (
        <Button variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
