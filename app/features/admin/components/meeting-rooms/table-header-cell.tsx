import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type TableHeaderCellProps = Readonly<{
  icon: LucideIcon;
  children: ReactNode;
}>;

export function TableHeaderCell({
  icon: Icon,
  children,
}: TableHeaderCellProps) {
  return (
    <div className="flex items-center gap-2">
      <span>{children}</span>
      <Icon className="size-3" />
    </div>
  );
}
