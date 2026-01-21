import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import KioskChrome from "@/booth/components/KioskChrome";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";
import { formatMoney } from "@/booth/utils/money";

const OPTIONS = [2, 4, 6];

export default function StepQuantity() {
  const { order, setQuantity, next, back } = useBoothFlow();

  const price = order.priceCents ?? 0;
  const currency = order.currency ?? "INR";

  return (
    <KioskChrome title="Select quantity" subtitle="Choose how many prints you want. Price updates instantly." showBack onBack={back}>
      <div className="grid gap-4 md:grid-cols-3">
        {OPTIONS.map((q) => {
          const selected = order.quantity === q;
          return (
            <Card
              key={q}
              className={
                "cursor-pointer border bg-card/40 p-6 transition hover:bg-card/55" + (selected ? " ring-2 ring-ring" : "")
              }
              onClick={() => setQuantity(q)}
              role="button"
              tabIndex={0}
            >
              <div className="text-4xl font-semibold">{q}</div>
              <div className="mt-1 text-sm text-muted-foreground">prints</div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-3 rounded-2xl border bg-secondary/25 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs tracking-[0.22em] uppercase text-muted-foreground">Current total</div>
          <div className="mt-1 text-2xl font-semibold">{formatMoney(price, currency)}</div>
        </div>
        <Button variant="kiosk" size="kiosk" onClick={next} disabled={!order.quantity}>
          Review Order
        </Button>
      </div>
    </KioskChrome>
  );
}
