import React, { useState, useEffect } from "react";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Lock, ScanLine, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StepPaymentGateway() {
  const { order, confirmPayment, back } = useBoothFlow();
  const [timeLeft, setTimeLeft] = useState(5);
  const [canConfirm, setCanConfirm] = useState(false);
  const [customQr, setCustomQr] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("upi_qr_image");
    if (stored) setCustomQr(stored);
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanConfirm(true);
    }
  }, [timeLeft]);

  const price = order.priceCents
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: order.currency ?? 'INR' }).format(order.priceCents / 100)
    : "₹0";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background nexora-surface text-foreground animate-in fade-in duration-500">

      {/* Back Button (Top Left) */}
      <button
        onClick={back}
        className="absolute top-8 left-8 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-6 py-3 text-sm font-medium backdrop-blur-md transition-all hover:bg-white/10 hover:pl-4"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Cancel Payment</span>
      </button>

      {/* Main Glass Card */}
      <div className="relative w-full max-w-md scale-100 transform overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 p-0 shadow-2xl backdrop-blur-3xl transition-all duration-500">

        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-accent/20 blur-[100px]" />

        <div className="relative flex flex-col items-center p-10 text-center">

          {/* Header */}
          <div className="mb-2 rounded-full border border-white/5 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary/80 shadow-glow">
            Secure Payment
          </div>

          <h1 className="mt-4 font-display text-7xl font-bold tracking-tighter text-white drop-shadow-2xl">
            {price}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Total amount to pay</p>

          {/* QR Section */}
          <div className="mt-8 flex aspect-square w-64 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white p-6 shadow-2xl">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-black">
              <div className="relative flex h-full w-full items-center justify-center bg-white">
                <div
                  className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-90 mix-blend-multiplycontrast"
                  style={{
                    backgroundImage: customQr
                      ? `url(${customQr})`
                      : `url('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=mock@upi&pn=Nexora&am=100')`
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Instruction */}
          <div className="mt-6 space-y-1">
            <p className="flex items-center justify-center gap-2 text-lg font-medium text-white">
              <ScanLine className="h-5 w-5 text-primary" />
              <span>Scan UPI QR to Pay</span>
            </p>
            <p className="text-sm text-muted-foreground">or pay cash at the counter</p>
          </div>

          {/* Confirm Actions */}
          <div className="mt-10 w-full">
            <Button
              onClick={confirmPayment}
              disabled={!canConfirm}
              className={cn(
                "group relative h-16 w-full overflow-hidden rounded-2xl text-lg font-bold transition-all duration-500",
                canConfirm
                  ? "bg-primary text-primary-foreground hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.5)]"
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              )}
            >
              {canConfirm ? (
                <span className="flex items-center justify-center gap-2">
                  Confirm Payment <Check className="h-5 w-5" />
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Confirm available in {timeLeft} seconds <Lock className="h-4 w-4 animate-pulse" />
                </span>
              )}
            </Button>

            {!canConfirm && (
              <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground/60">
                Please wait for validation
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
