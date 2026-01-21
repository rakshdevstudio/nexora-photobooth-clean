import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import KioskChrome from "@/booth/components/KioskChrome";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";
import { formatMoney } from "@/booth/utils/money";

export default function StepSummary() {
  const { order, go, back, setVoucher } = useBoothFlow();
  const [voucher, setVoucherLocal] = useState(order.voucherCode ?? "");
  const currency = order.currency ?? "INR";

  return (
    <KioskChrome title="Order summary" subtitle="Confirm your selections before payment locks the order." showBack onBack={back}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-card/40 p-6">
          <div className="text-xs tracking-[0.22em] uppercase text-muted-foreground">Selections</div>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Shots</dt>
              <dd className="font-medium">{order.requiredShots || "—"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Quantity</dt>
              <dd className="font-medium">{order.quantity ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Final price</dt>
              <dd className="font-semibold">{formatMoney(order.priceCents ?? 0, currency)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border bg-secondary/25 p-6">
          <div className="text-xs tracking-[0.22em] uppercase text-muted-foreground">Voucher (optional)</div>
          <div className="mt-3 flex gap-3">
            <Input
              value={voucher}
              onChange={(e) => setVoucherLocal(e.target.value)}
              placeholder="Enter code"
              className="h-12"
            />
            <Button
              variant="soft"
              className="h-12 px-6"
              onClick={() => setVoucher(voucher)}
              type="button"
            >
              Apply
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Voucher validation will run in the payment/licensing layer later.
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end">
        <Button variant="kiosk" size="kiosk" onClick={() => go("payment_method")} disabled={!order.requiredShots || !order.quantity}>
          PAY NOW
        </Button>
      </div>
    </KioskChrome>
  );
}
