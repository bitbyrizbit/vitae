import { ReactNode } from "react";

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  mono?: boolean;
  shrink?: boolean;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  keyExtractor: (row: T) => string | number;
};

export function DataTable<T>({
  columns,
  data,
  emptyMessage = "nothing here yet",
  keyExtractor,
}: Props<T>) {
  return (
    <div className="overflow-x-auto rounded-[3px] border border-rule-subtle">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.shrink ? "w-0" : ""}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={keyExtractor(row)}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`${col.mono ? "font-mono text-[13px]" : ""} ${
                    col.shrink ? "w-0 whitespace-nowrap" : ""
                  }`}
                >
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center text-text-tertiary py-12"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
