import { useEffect } from "react";
import { isTouchAuditEnabled, onTouchAuditChanged } from "@/booth/admin/touchAudit";

function apply(enabled: boolean) {
  const root = document.documentElement;
  root.classList.toggle("touch-audit", enabled);
}

function markTargets() {
  const MIN = 44;
  const targets = document.querySelectorAll<HTMLElement>(
    "button, a[href], input, select, textarea, [role='button'], [role='menuitem'], [data-radix-collection-item]",
  );

  targets.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const tooSmall = rect.width > 0 && rect.height > 0 && (rect.width < MIN || rect.height < MIN);
    if (tooSmall) el.dataset.touchTooSmall = "true";
    else delete el.dataset.touchTooSmall;
  });
}

export default function TouchAuditInit() {
  useEffect(() => {
    const update = () => {
      const enabled = isTouchAuditEnabled();
      apply(enabled);
      if (enabled) markTargets();
    };

    update();

    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (isTouchAuditEnabled()) markTargets();
      });
    };

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    window.addEventListener("resize", schedule);

    const unsub = onTouchAuditChanged(update);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      unsub();
      apply(false);
    };
  }, []);

  return null;
}
