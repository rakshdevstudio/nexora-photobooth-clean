export type StripTypeId = "strip";

export type LayoutType = "strip" | "template";

export type BoothStepId =
  | "start"
  | "shots"
  | "layout_select"
  | "quantity"
  | "summary"
  | "payment_method"
  | "payment_loading"
  | "payment_gateway"
  | "payment_confirmation"
  | "template_select"
  | "camera_select"
  | "capture"
  | "photo_review"
  | "final_review"
  | "final_preview"
  | "print"
  | "thank_you";

export type PaymentStatus = "idle" | "opening" | "confirming" | "success" | "failed";
export type PaymentMethod = "cash" | "online";

export type CameraSourceId = "webcam" | "camera_4k";

export type TemplateAsset = {
  id: string;
  name: string;
  /** In real EXE builds this should be a filesystem path, not a blob URL */
  previewUrl: string;
  /** How many shots this template supports (1–8). */
  shots: number;
  /** Legacy compatibility: older saved templates may omit this. */
  layout?: StripTypeId;
  /** Pixel size of the template asset (used to drive output canvas size). */
  width: number;
  height: number;
  /** Built-in templates are bundled and cannot be deleted (disable only). */
  builtin?: boolean;
};

export type OrderDraft = {
  shotCount?: number;
  /** Kept for compatibility with existing UI; equals shotCount when set. */
  requiredShots: number;

  /** User must explicitly choose whether this order uses plain strip or a template-driven layout. */
  layoutType?: LayoutType;

  quantity?: number;
  priceCents?: number;
  currency?: "INR" | "USD" | "EUR";
  voucherCode?: string;

  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentRef?: string;

  cameraSource?: CameraSourceId;

  photos: Array<{ id: string; url: string } | undefined>;
  retakesUsedByIndex: Record<number, boolean>;
  activeReviewIndex?: number;

  selectedTemplateId?: string;

  locked: {
    order: boolean;
    photos: boolean;
  };
};

export type StripDefinition = {
  id: StripTypeId;
  label: string;
  description: string;
};

export type StripConfig = StripDefinition & {
  enabled: boolean;
  /** Unit price per print (cents/paise). */
  unitPriceCents: number;
};

export type PaymentMode = "cash" | "online" | "both";

export type AdminSettings = {
  version: 1;
  currency: "INR" | "USD" | "EUR";
  paymentMode: PaymentMode;
  strips: StripConfig[];
  kiosk: {
    requireTemplateSelection: boolean;
    /** Countdown shown before each capture. Per-device setting. */
    photoCaptureCountdownSeconds: number;
  };
  payments: {
    razorpay: {
      enabled: boolean;
      keyId?: string;
      keySecret?: string;
    };
  };
};
