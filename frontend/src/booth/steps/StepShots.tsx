import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import KioskChrome from "@/booth/components/KioskChrome";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";

const OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function StepShots() {
  const { order, setShotCount, next, back } = useBoothFlow();

  return (
    <KioskChrome
      title="Select number of shots"
      subtitle="How many photos should the camera capture this session?"
      showBack
      onBack={back}
    >
      <div className="grid gap-4 md:grid-cols-4">
        {OPTIONS.map((n) => {
          const selected = order.shotCount === n;
          return (
            <Card
              key={n}
              className={
                "cursor-pointer border bg-card/40 p-6 transition hover:bg-card/55" +
                (selected ? " ring-2 ring-ring" : "")
              }
              onClick={() => setShotCount(n)}
              role="button"
              tabIndex={0}
            >
              <div className="text-4xl font-semibold">{n}</div>
              <div className="mt-1 text-sm text-muted-foreground">shots</div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-end">
        <Button variant="kiosk" size="kiosk" onClick={next} disabled={!order.shotCount}>
          Continue
        </Button>
      </div>
    </KioskChrome>
  );
}
