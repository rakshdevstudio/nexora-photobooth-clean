import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type {
  AdminSettings,
  BoothStepId,
  LayoutType,
  OrderDraft,
  PaymentMethod,
  TemplateAsset,
} from "@/booth/types";
import { LocalJsonStorage } from "@/booth/storage/localJsonStorage";
import { WebCameraEngine } from "@/booth/engines/camera/webCameraEngine";
import { StubPaymentEngine } from "@/booth/engines/payment/stubPaymentEngine";
import { BrowserPrintEngine } from "@/booth/engines/print/browserPrintEngine";
import { nanoid } from "@/booth/utils/nanoid";
import { defaultAdminSettings } from "@/booth/admin/settings";
import { getEnabledBuiltinTemplates, onBuiltinTemplatesChanged } from "@/booth/admin/builtinTemplatesState";
import { appendOrderReceipt } from "@/booth/storage/orderHistory";

const STRIPS_FALLBACK = [{ id: "strip" as const, label: "Layout", description: "Shot-count driven layout." }];

type BoothFlowState = {
  step: BoothStepId;
  order: OrderDraft;
  templates: TemplateAsset[];
  paymentMode: AdminSettings["paymentMode"];
  captureCountdownSeconds: number;
};

type BoothFlowActions = {
  go(step: BoothStepId): void;
  next(): void;
  back(): void;

  startNewOrder(): void;

  setShotCount(count: number): void;
  setLayoutType(type: LayoutType): void;
  setQuantity(qty: number): void;
  setVoucher(code: string): void;

  setPaymentMethod(method: PaymentMethod): void;
  acceptCash(): void;

  beginPayment(): Promise<void>;
  confirmPayment(): Promise<void>;

  setTemplate(id: string): void;
  lockPhotos(): void;

  attachPhotoAt(index: number, blob: Blob): void;
  requestRetake(index: number): void;
  markRetakeUsed(index: number): void;

  updateTemplates(templates: TemplateAsset[]): Promise<void>;

  printNow(html: string): Promise<void>;
  resetToStart(): Promise<void>;
};

type BoothFlowContextValue = BoothFlowState & BoothFlowActions;

const BoothFlowContext = createContext<BoothFlowContextValue | null>(null);

function computePriceCents(settings: AdminSettings, qty: number | undefined) {
  if (!qty) return 0;
  const cfg = settings.strips[0];
  const unit = cfg?.unitPriceCents ?? 0;
  return Math.round(unit * qty);
}

const STEP_ORDER: BoothStepId[] = [
  "start",
  "shots",
  "layout_select",
  "quantity",
  "summary",
  "payment_method",
  "payment_loading",
  "payment_gateway",
  "payment_confirmation",
  "template_select",
  "camera_select",
  "capture",
  "photo_review",
  "final_review",
  "final_preview",
  "print",
  "thank_you",
];

function makeEmptyPhotos(count: number) {
  return Array.from({ length: Math.max(0, count) }).map(() => undefined);
}

function normalizeDraft(draft: OrderDraft): OrderDraft {
  const shotCount = draft.shotCount ?? draft.requiredShots ?? 0;
  const requiredShots = shotCount;

  const normalizedTemplatesafePhotos = Array.isArray(draft.photos) ? draft.photos : [];
  const photos = makeEmptyPhotos(requiredShots);
  for (let i = 0; i < Math.min(requiredShots, normalizedTemplatesafePhotos.length); i++) {
    const p = normalizedTemplatesafePhotos[i];
    // blob: URLs are not durable across page reloads; if a draft is persisted and re-hydrated,
    // these will 404 (ERR_FILE_NOT_FOUND). Drop them so the UI can request recapture.
    if (p?.url?.startsWith("blob:")) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("[draft] dropping non-durable blob URL during hydration", { index: i });
      }
      continue;
    }
    if (p) photos[i] = p;
  }

  return {
    ...draft,
    shotCount: shotCount || undefined,
    requiredShots,
    // If a template is already selected (e.g. from persisted draft), enforce template mode.
    layoutType: draft.layoutType ?? (draft.selectedTemplateId ? "template" : undefined),
    photos,
  };
}

function normalizeTemplates(templates: TemplateAsset[]) {
  // NOTE:
  // We allow blob: URLs here so templates uploaded in the current session keep working.
  // They are NOT durable across a full page reload / app restart.
  return templates.map((t) => ({
    ...t,
    layout: (t as TemplateAsset).layout ?? "strip",
    shots: (t as TemplateAsset).shots ?? 4,
    builtin: (t as TemplateAsset).builtin ?? false,
    width: (t as TemplateAsset).width ?? 1200,
    height: (t as TemplateAsset).height ?? 3600,
  }));
}

export function BoothFlowProvider({ children }: { children: React.ReactNode }) {
  const storage = useMemo(() => new LocalJsonStorage(), []);
  const cameraEngine = useMemo(() => new WebCameraEngine(), []);
  const paymentEngine = useMemo(() => new StubPaymentEngine(), []);
  const printEngine = useMemo(() => new BrowserPrintEngine(), []);

  const [step, setStep] = useState<BoothStepId>("start");
  const [customTemplates, setCustomTemplates] = useState<TemplateAsset[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(() => defaultAdminSettings());

  const [order, setOrder] = useState<OrderDraft>(() => ({
    paymentStatus: "idle",
    requiredShots: 0,
    photos: [],
    retakesUsedByIndex: {},
    locked: { order: false, photos: false },
    currency: "INR",
  }));

  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    (async () => {
      const [draft, tpls, admin] = await Promise.all([
        storage.loadDraft(),
        storage.loadTemplates(),
        storage.loadAdminSettings(),
      ]);

      const nextSettings = admin ?? defaultAdminSettings();
      setSettings(nextSettings);

      if (draft) setOrder(normalizeDraft({ ...draft, currency: nextSettings.currency }));
      if (tpls?.length) setCustomTemplates(normalizeTemplates(tpls));
    })();
  }, [storage]);

  // Keep built-in enable/disable changes reflected in kiosk without touching custom uploads.
  useEffect(() => {
    return onBuiltinTemplatesChanged(() => {
      // Trigger a re-render; enabled built-ins are derived.
      setCustomTemplates((t) => [...t]);
    });
  }, []);

  // When templates are edited in the admin panel, reload custom templates immediately.
  useEffect(() => {
    const reloadTemplates = async () => {
      const tpls = await storage.loadTemplates();
      setCustomTemplates(tpls?.length ? normalizeTemplates(tpls) : []);
    };
    const onCustom = () => void reloadTemplates();
    window.addEventListener("nexora.templates.updated", onCustom as EventListener);
    return () => window.removeEventListener("nexora.templates.updated", onCustom as EventListener);
  }, [storage]);
  const templates = useMemo(() => {
    const custom = customTemplates.map((t) => ({ ...t, builtin: false }));
    // If admin templates exist, do NOT mix in built-ins (prevents "fallback" confusion).
    if (custom.length > 0) return custom;
    return getEnabledBuiltinTemplates();
  }, [customTemplates]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    // eslint-disable-next-line no-console
    console.info("[templates] resolved", {
      customCount: customTemplates.length,
      resolvedCount: templates.length,
      sample: templates.slice(0, 3).map((t) => ({ id: t.id, shots: t.shots, builtin: !!t.builtin, urlKind: t.previewUrl?.split(":")[0] })),
    });
  }, [customTemplates.length, templates]);


  useEffect(() => {
    const reload = async () => {
      const admin = await storage.loadAdminSettings();
      const nextSettings = admin ?? defaultAdminSettings();
      setSettings(nextSettings);

      setOrder((o) => {
        const next: OrderDraft = { ...o, currency: nextSettings.currency };
         if (next.quantity) {
           next.priceCents = computePriceCents(nextSettings, next.quantity);
         }
        return next;
      });
    };

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === "nexora.booth.admin_settings.v1" || e.key === "nexora.booth.admin_settings.bump.v1") {
        void reload();
      }
    };

    const onCustom = () => void reload();

    window.addEventListener("storage", onStorage);
    window.addEventListener("nexora.admin_settings.updated", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("nexora.admin_settings.updated", onCustom as EventListener);
    };
  }, [storage]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    void storage.saveDraft(order);
  }, [order, storage]);

  const strips = useMemo(() => {
    const fromSettings = settings.strips
      .filter((s) => s.enabled)
      .map((s) => ({ id: s.id, label: s.label, description: s.description }));
    return fromSettings.length ? fromSettings : STRIPS_FALLBACK;
  }, [settings.strips]);

  const paymentMode = settings.paymentMode;
  const captureCountdownSeconds = settings.kiosk.photoCaptureCountdownSeconds ?? 10;

  const recordPaidOrder = (method: PaymentMethod, paymentRef: string) => {
    void appendOrderReceipt({
      id: nanoid(),
      createdAt: new Date().toISOString(),
      shots: order.requiredShots ?? 0,
      quantity: order.quantity ?? 0,
      priceCents: order.priceCents ?? 0,
      currency: order.currency ?? settings.currency,
      paymentMethod: method,
      paymentRef,
    });
  };

  const go = (s: BoothStepId) => setStep(s);

  const getNextStep = (current: BoothStepId): BoothStepId => {
    // Branching step: strip layout skips template selection entirely.
    if (current === "payment_confirmation") {
      if (!order.layoutType) return "layout_select";
      return order.layoutType === "strip" ? "camera_select" : "template_select";
    }
    if (current === "template_select") {
      return "camera_select";
    }
    const idx = STEP_ORDER.indexOf(current);
    return STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
  };

  const getPrevStep = (current: BoothStepId): BoothStepId => {
    if (current === "camera_select") {
      return order.layoutType === "strip" ? "payment_confirmation" : "template_select";
    }
    if (current === "template_select") {
      return "payment_confirmation";
    }
    const idx = STEP_ORDER.indexOf(current);
    return STEP_ORDER[Math.max(idx - 1, 0)];
  };

  const next = () => {
    setStep(getNextStep(step));
  };

  const back = () => {
    setStep(getPrevStep(step));
  };

  const startNewOrder = () => {
    setOrder({
      paymentStatus: "idle",
      requiredShots: 0,
      photos: [],
      retakesUsedByIndex: {},
      locked: { order: false, photos: false },
      currency: "INR",
    });
    setStep("shots");
  };

  const setShotCount = (count: number) => {
    setOrder((o) => ({
      ...o,
      shotCount: count,
      requiredShots: count,
      layoutType: undefined,
      selectedTemplateId: undefined,
      photos: makeEmptyPhotos(count),
      retakesUsedByIndex: {},
      locked: { ...o.locked, photos: false },
    }));
  };

  const setLayoutType = (type: LayoutType) => {
    setOrder((o) => ({
      ...o,
      layoutType: type,
      // Strip flow must never accidentally carry a template.
      selectedTemplateId: type === "strip" ? undefined : o.selectedTemplateId,
    }));
  };

  const setQuantity = (qty: number) => {
    setOrder((o) => ({
      ...o,
      quantity: qty,
      currency: settings.currency,
      priceCents: computePriceCents(settings, qty),
    }));
  };

  const setVoucher = (code: string) => {
    setOrder((o) => ({ ...o, voucherCode: code.trim() || undefined }));
  };

  const setPaymentMethod = (method: PaymentMethod) => {
    setOrder((o) => ({ ...o, paymentMethod: method }));
  };

  const acceptCash = () => {
    const ref = order.paymentRef ?? `CASH-${nanoid()}`;
    recordPaidOrder("cash", ref);
    setOrder((o) => ({
      ...o,
      paymentMethod: "cash",
      paymentStatus: "success",
      paymentRef: ref,
      locked: { ...o.locked, order: true },
    }));
    if (!order.layoutType) {
      setStep("layout_select");
      return;
    }
    setStep(order.layoutType === "strip" ? "camera_select" : "template_select");
  };

  const beginPayment = async () => {
    setOrder((o) => ({ ...o, paymentMethod: "online", paymentStatus: "opening" }));
    setStep("payment_loading");

    const { ref } = await paymentEngine.openPayment(order.priceCents ?? 0, order.currency ?? "INR");

    setOrder((o) => ({ ...o, paymentRef: ref, paymentStatus: "confirming" }));
    setStep("payment_gateway");
  };

  const confirmPayment = async () => {
    if (!order.paymentRef) return;
    setOrder((o) => ({ ...o, paymentStatus: "confirming" }));
    const res = await paymentEngine.confirmPayment(order.paymentRef);

    if (res.status === "success") {
      recordPaidOrder("online", order.paymentRef);
      setOrder((o) => ({ ...o, paymentStatus: "success", locked: { ...o.locked, order: true } }));
      setStep("payment_confirmation");
    } else {
      setOrder((o) => ({ ...o, paymentStatus: "failed" }));
    }
  };

  const attachPhotoAt = (index: number, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const id = nanoid();
    setOrder((o) => {
      const photos = [...o.photos];
      photos[index] = { id, url };
      return { ...o, photos };
    });
  };

  const requestRetake = (index: number) => {
    setOrder((o) => ({ ...o, activeReviewIndex: index }));
    setStep("capture");
  };

  const markRetakeUsed = (index: number) => {
    setOrder((o) => ({ ...o, retakesUsedByIndex: { ...o.retakesUsedByIndex, [index]: true }, activeReviewIndex: undefined }));
  };

  const lockPhotos = () => {
    setOrder((o) => ({ ...o, locked: { ...o.locked, photos: true } }));
  };

  const setTemplate = (id: string) => {
    // Selecting a template must AUTHORITATIVELY enable template mode.
    setOrder((o) => ({ ...o, layoutType: "template", selectedTemplateId: id }));
  };

  const updateTemplates = async (nextTemplates: TemplateAsset[]) => {
    const normalized = normalizeTemplates(nextTemplates);
    // Only persist custom templates. Built-ins are always bundled.
    const customsOnly = normalized.filter((t) => !t.builtin);
    setCustomTemplates(customsOnly);
    await storage.saveTemplates(customsOnly);
  };

  const printNow = async (html: string) => {
    await printEngine.print(html);
  };

  const resetToStart = async () => {
    await cameraEngine.stop().catch(() => undefined);
    setStep("start");
    await storage.clearDraft();
    setOrder({
      paymentStatus: "idle",
      requiredShots: 0,
      photos: [],
      retakesUsedByIndex: {},
      locked: { order: false, photos: false },
      currency: "INR",
    });
  };

  const value: BoothFlowContextValue = {
    step,
    order,
    templates,
    paymentMode,
    captureCountdownSeconds,

    go,
    next,
    back,

    startNewOrder,

    setShotCount,
    setLayoutType,
    setQuantity,
    setVoucher,

    setPaymentMethod,
    acceptCash,

    beginPayment,
    confirmPayment,

    setTemplate,
    lockPhotos,

    attachPhotoAt,
    requestRetake,
    markRetakeUsed,

    updateTemplates,

    printNow,
    resetToStart,
  };

  return <BoothFlowContext.Provider value={value}>{children}</BoothFlowContext.Provider>;
}

export function useBoothFlow() {
  const ctx = useContext(BoothFlowContext);
  if (!ctx) throw new Error("useBoothFlow must be used within BoothFlowProvider");
  return ctx;
}
