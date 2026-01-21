import { nanoid } from "@/booth/utils/nanoid";
import type { PaymentEngine, PaymentResult } from "@/booth/engines/payment/types";

/**
 * Phase-1 offline-friendly stub:
 * - “Open payment” generates a ref.
 * - “Confirm” is simulated; in Electron/Tauri replace with gateway SDK + webhook reconciliation.
 */
export class StubPaymentEngine implements PaymentEngine {
  async openPayment(_amountCents: number, _currency: string): Promise<{ ref: string }> {
    return { ref: `PAY-${nanoid()}` };
  }

  async confirmPayment(ref: string): Promise<PaymentResult> {
    // Simulate latency
    await new Promise((r) => setTimeout(r, 900));

    const ok = true;
    return ok
      ? { status: "success", ref }
      : { status: "failed", ref, message: "Payment failed. Please try again." };
  }
}
