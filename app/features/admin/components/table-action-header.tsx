import type { ReactNode } from "react";
import Heading from "@/components/ui/heading";

type TableActionHeaderProps = Readonly<{
  title: string;
  actionSlot?: ReactNode;
}>;

function TableActionHeader({ title, actionSlot }: TableActionHeaderProps) {
  return (
    <header className="mb-4 flex flex-wrap items-center justify-between gap-4">
      <Heading as="h2" size="h2">
        {title}
      </Heading>
      <div className="flex flex-wrap items-center gap-2">{actionSlot}</div>
    </header>
  );
}

export default TableActionHeader;
