import { Button } from "@/components/ui/button";
import KioskChrome from "@/booth/components/KioskChrome";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";

export default function StepPaymentMethod() {
  const { paymentMode, acceptCash, beginPayment, back } = useBoothFlow();

  const showCash = paymentMode === "cash" || paymentMode === "both";
  const showOnline = paymentMode === "online" || paymentMode === "both";

  return (
    <KioskChrome title="Select payment method" subtitle="Choose cash or pay online to continue." showBack onBack={back}>
      <div className="mx-auto grid w-full max-w-3xl gap-4">
        {showCash ? (
          <Button variant="kiosk" size="kiosk" onClick={acceptCash} className="w-full">
            CASH
          </Button>
        ) : null}

        {showOnline ? (
          <Button variant="outline" size="kiosk" onClick={beginPayment} className="w-full">
            ONLINE
          </Button>
        ) : null}

        {!showCash && !showOnline ? (
          <div className="rounded-2xl border bg-secondary/20 p-5 text-sm text-muted-foreground">
            No payment methods are enabled by the operator.
          </div>
        ) : null}
      </div>
    </KioskChrome>
  );
}
