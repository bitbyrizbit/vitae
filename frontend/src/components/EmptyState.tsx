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
    <div className="py-16 flex flex-col items-center justify-center border border-dashed border-rule rounded-[3px]">
      <p className="text-text-tertiary text-sm mb-4">{message}</p>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
