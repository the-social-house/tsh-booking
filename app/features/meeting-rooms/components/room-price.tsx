import messages from "@/lib/messages.json";

type RoomPriceProps = Readonly<{
  label: string;
  price: string;
  original?: boolean;
}>;

export function RoomPrice({ label, price, original }: RoomPriceProps) {
  return (
    <div className="grid">
      <span className="text-xs">{label}</span>
      <div className="text-sm">
        {original ? (
          <del className="text-muted-foreground/50">
            {price} {messages.common.units.hourlyRate}
          </del>
        ) : (
          <span className="font-medium text-base">
            {price} {messages.common.units.hourlyRate}
          </span>
        )}
      </div>
    </div>
  );
}
