import type { PaymentStatus } from "@/booth/types";

export type PaymentResult = {
  status: Exclude<PaymentStatus, "idle" | "opening" | "confirming">;
  ref?: string;
  message?: string;
};

export interface PaymentEngine {
  openPayment(amountCents: number, currency: string): Promise<{ ref: string }>;
  confirmPayment(ref: string): Promise<PaymentResult>;
}
