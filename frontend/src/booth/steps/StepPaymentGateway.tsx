import { Button } from "@/components/ui/button";
import KioskChrome from "@/booth/components/KioskChrome";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";

export default function StepPaymentGateway() {
  const { order, confirmPayment, back } = useBoothFlow();

  return (
    <KioskChrome title="Payment gateway" subtitle="UPI / gateway-ready UI. Replace stub engine in EXE build." showBack onBack={back}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-card/40 p-6">
          <div className="text-xs tracking-[0.22em] uppercase text-muted-foreground">Payment reference</div>
          <div className="mt-2 text-2xl font-semibold">{order.paymentRef ?? "—"}</div>
          <p className="mt-3 text-sm text-muted-foreground">
            States supported: open → confirming → success/failure.
          </p>

          <div className="mt-6 flex gap-3">
            <Button variant="kiosk" size="kiosk" onClick={confirmPayment}>
              Confirm Payment
            </Button>
          </div>

          {order.paymentStatus === "failed" ? (
            <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
              Payment failed. Try again or choose a different method.
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border bg-secondary/25 p-6">
          <div className="text-xs tracking-[0.22em] uppercase text-muted-foreground">Gateway panel</div>
          <div className="mt-4 rounded-xl border bg-card/30 p-4 text-sm text-muted-foreground">
            In the packaged product this area hosts your gateway SDK/UPI intent view.
          </div>
        </div>
      </div>
    </KioskChrome>
  );
}
