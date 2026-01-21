import type { BoothStorage } from "@/booth/storage/types";
import type { AdminSettings, OrderDraft, TemplateAsset } from "@/booth/types";
import { idbDelKv, idbGetKv, idbSetKv } from "@/booth/storage/indexedDb";

const DRAFT_KEY = "nexora.booth.draft.v1";
const TEMPLATES_KEY = "nexora.booth.templates.v1";
const ADMIN_SETTINGS_KEY = "nexora.booth.admin_settings.v1";

function sanitizeTemplates(templates: TemplateAsset[]): TemplateAsset[] {
  // Never persist blob: URLs. They are not durable across reloads.
  return (templates ?? []).filter((t) => !(typeof t?.previewUrl === "string" && t.previewUrl.startsWith("blob:")));
}

export class LocalJsonStorage implements BoothStorage {
  async saveDraft(draft: OrderDraft): Promise<void> {
    // Transactional data → IndexedDB (survives refresh/restart/power loss).
    await idbSetKv(DRAFT_KEY, draft);
  }

  async loadDraft(): Promise<OrderDraft | null> {
    return await idbGetKv<OrderDraft>(DRAFT_KEY);
  }

  async clearDraft(): Promise<void> {
    await idbDelKv(DRAFT_KEY);
  }

  async saveTemplates(templates: TemplateAsset[]): Promise<void> {
    // Templates should be durable across reloads. Use IndexedDB.
    await idbSetKv(TEMPLATES_KEY, sanitizeTemplates(templates));
  }

  async loadTemplates(): Promise<TemplateAsset[]> {
    // Migration path: older builds stored templates in localStorage.
    const fromIdb = await idbGetKv<TemplateAsset[]>(TEMPLATES_KEY);
    if (Array.isArray(fromIdb)) {
      const cleaned = sanitizeTemplates(fromIdb);
      // If we removed stale blob templates, persist the cleaned list.
      if (cleaned.length !== fromIdb.length) await idbSetKv(TEMPLATES_KEY, cleaned);
      return cleaned;
    }

    const raw = localStorage.getItem(TEMPLATES_KEY);
    const parsed = raw ? (JSON.parse(raw) as TemplateAsset[]) : [];
    const cleaned = sanitizeTemplates(parsed);
    if (cleaned.length) {
      await idbSetKv(TEMPLATES_KEY, cleaned);
    }
    return cleaned;
  }

  async saveAdminSettings(settings: AdminSettings): Promise<void> {
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
  }

  async loadAdminSettings(): Promise<AdminSettings | null> {
    const raw = localStorage.getItem(ADMIN_SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as AdminSettings) : null;
  }
}
