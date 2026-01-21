import type { AdminSettings, OrderDraft, TemplateAsset } from "@/booth/types";

/**
 * Storage in kiosk EXEs should be filesystem-based (NOT a DB).
 * This interface exists so we can plug in Electron/Tauri adapters later.
 */
export interface BoothStorage {
  saveDraft(draft: OrderDraft): Promise<void>;
  loadDraft(): Promise<OrderDraft | null>;
  clearDraft(): Promise<void>;

  saveTemplates(templates: TemplateAsset[]): Promise<void>;
  loadTemplates(): Promise<TemplateAsset[]>;

  saveAdminSettings(settings: AdminSettings): Promise<void>;
  loadAdminSettings(): Promise<AdminSettings | null>;
}
