import { Button } from "@/components/ui/button";
import KioskChrome from "@/booth/components/KioskChrome";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";

export default function StepPaymentConfirmation() {
  const { next, order, back } = useBoothFlow();

  return (
    <KioskChrome title="Payment confirmed" subtitle="Order locked. Proceed to capture." showBack onBack={back}>
      <div className="space-y-4">
        <div className="rounded-2xl border bg-card/40 p-6">
          <div className="text-xs tracking-[0.22em] uppercase text-muted-foreground">Transaction</div>
          <div className="mt-2 text-xl font-semibold">{order.paymentRef}</div>
          <p className="mt-3 text-sm text-muted-foreground">
            The order is now locked. Printing will only be available after successful payment.
          </p>
        </div>

        <div className="flex justify-end">
          <Button variant="kiosk" size="kiosk" onClick={() => next()}>
            Proceed to Camera
          </Button>
        </div>
      </div>
    </KioskChrome>
  );
}
