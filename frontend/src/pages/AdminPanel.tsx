import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BackArrowButton from "@/components/BackArrowButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminSettings, StripConfig, StripTypeId } from "@/booth/types";
import { applyAdminSettings, defaultAdminSettings, loadAdminSettings, saveAdminSettings } from "@/booth/admin/settings";
import IdleCopyEditorCard from "@/booth/admin/IdleCopyEditorCard";
import { clearAdminAuthed } from "@/booth/admin/adminAuth";
import { isTouchAuditEnabled, setTouchAuditEnabled } from "@/booth/admin/touchAudit";
import { clearOrderHistory, loadOrderHistory } from "@/booth/storage/orderHistory";

function formatCents(cents: number, currency: AdminSettings["currency"]) {
  // Admin-facing helper; kiosk display uses formatMoney.
  const amount = cents / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AdminSettings>(() => loadAdminSettings());
  const [touchAudit, setTouchAudit] = useState(() => isTouchAuditEnabled());
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof loadOrderHistory>>>([]);

  useEffect(() => {
    let mounted = true;
    void loadOrderHistory().then((res) => {
      if (!mounted) return;
      setOrders(res);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    saveAdminSettings(settings);
  }, [settings]);

  useEffect(() => {
    setTouchAuditEnabled(touchAudit);
  }, [touchAudit]);

  const stripsById = useMemo(() => {
    const map = new Map<StripTypeId, StripConfig>();
    for (const s of settings.strips) map.set(s.id, s);
    return map;
  }, [settings.strips]);

  return (
    <div className="min-h-screen nexora-surface px-6 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm tracking-[0.28em] uppercase text-muted-foreground">Nexora</div>
            <h1 className="text-3xl font-semibold">Operator Admin Panel</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure templates, formats, pricing, payments, and kiosk rules for this device.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <BackArrowButton ariaLabel="Go back" onBack={() => navigate(-1)} />
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                const ok = window.confirm("Are you sure you want to logout?");
                if (!ok) return;
                clearAdminAuthed();
                navigate("/", { replace: true });
              }}
            >
              Logout
            </Button>
            <Button className="rounded-xl" variant="kiosk" onClick={() => applyAdminSettings(settings)}>
              Apply to kiosk
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/">Back to Kiosk</Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                const next = defaultAdminSettings();
                saveAdminSettings(next);
                setSettings(next);
              }}
            >
              Reset to defaults
            </Button>
          </div>
        </header>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="w-full flex-wrap justify-start">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="formats">Strip types</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="payments">Payment</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="kiosk">Kiosk</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-4">
            <Card className="border bg-card/60 p-5 shadow-elevated">
              <div className="text-sm font-medium">Templates</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage frame overlays here: <span className="font-medium">/admin/templates</span>
              </p>
              <div className="mt-4">
                <Button asChild className="rounded-xl" variant="kiosk">
                  <Link to="/admin/templates">Open template library</Link>
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="formats" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {settings.strips.map((s) => (
                <Card key={s.id} className="border bg-card/60 p-5 shadow-elevated">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium">{s.id}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Shown on the format selection screen</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Enabled</Label>
                      <Switch
                        checked={s.enabled}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            strips: prev.strips.map((x) => (x.id === s.id ? { ...x, enabled: checked } : x)),
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-2">
                      <Label>Label</Label>
                      <Input
                        value={s.label}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            strips: prev.strips.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)),
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Description</Label>
                      <Input
                        value={s.description}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            strips: prev.strips.map((x) => (x.id === s.id ? { ...x, description: e.target.value } : x)),
                          }))
                        }
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {settings.strips.map((s) => (
                <Card key={s.id} className="border bg-card/60 p-5 shadow-elevated">
                  <div className="text-sm font-medium">{s.label}</div>
                  <p className="mt-1 text-xs text-muted-foreground">Unit price per print</p>

                  <div className="mt-4 grid gap-2">
                    <Label>Unit price (cents/paise)</Label>
                    <Input
                      inputMode="numeric"
                      value={String(s.unitPriceCents)}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setSettings((prev) => ({
                          ...prev,
                          strips: prev.strips.map((x) => (x.id === s.id ? { ...x, unitPriceCents: Number.isFinite(n) ? n : x.unitPriceCents } : x)),
                        }));
                      }}
                    />
                    <div className="text-xs text-muted-foreground">Preview: {formatCents(s.unitPriceCents, settings.currency)}</div>
                  </div>
                </Card>
              ))}

              <Card className="border bg-secondary/25 p-5">
                <div className="text-sm font-medium">Currency</div>
                <p className="mt-1 text-xs text-muted-foreground">Used for kiosk price display.</p>
                <div className="mt-4">
                  <Select
                    value={settings.currency}
                    onValueChange={(v) => setSettings((prev) => ({ ...prev, currency: v as AdminSettings["currency"] }))}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border bg-card/60 p-5 shadow-elevated">
                <div className="text-sm font-medium">Payment mode</div>
                <p className="mt-1 text-xs text-muted-foreground">Controls what options are offered on the summary screen.</p>
                <div className="mt-4">
                  <Select
                    value={settings.paymentMode}
                    onValueChange={(v) => setSettings((prev) => ({ ...prev, paymentMode: v as AdminSettings["paymentMode"] }))}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash only</SelectItem>
                      <SelectItem value="online">Online only</SelectItem>
                      <SelectItem value="both">Cash + Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              <Card className="border bg-secondary/25 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium">Razorpay (Test)</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      For development: keys are stored locally and can be replaced later without code changes.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Enabled</Label>
                    <Switch
                      checked={settings.payments.razorpay.enabled}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          payments: { ...prev.payments, razorpay: { ...prev.payments.razorpay, enabled: checked } },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="grid gap-2">
                    <Label>Key ID</Label>
                    <Input
                      value={settings.payments.razorpay.keyId ?? ""}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          payments: {
                            ...prev.payments,
                            razorpay: { ...prev.payments.razorpay, keyId: e.target.value || undefined },
                          },
                        }))
                      }
                      placeholder="rzp_test_..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Key Secret</Label>
                    <Input
                      type="password"
                      value={settings.payments.razorpay.keySecret ?? ""}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          payments: {
                            ...prev.payments,
                            razorpay: { ...prev.payments.razorpay, keySecret: e.target.value || undefined },
                          },
                        }))
                      }
                      placeholder="(test secret)"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <Card className="border bg-card/60 p-5 shadow-elevated">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium">Orders / History</div>
                  <p className="mt-1 text-xs text-muted-foreground">Stored locally on this booth/device.</p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    const ok = window.confirm("Clear local order history for this booth?");
                    if (!ok) return;
                    void clearOrderHistory().then(() => loadOrderHistory().then(setOrders));
                  }}
                >
                  Clear history
                </Button>
              </div>

              <div className="mt-4 overflow-auto rounded-xl border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/20 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Method</th>
                      <th className="px-3 py-2">Shots</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Total (cents/paise)</th>
                      <th className="px-3 py-2">Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length ? (
                      orders.slice(0, 100).map((o) => (
                        <tr key={o.id} className="border-t">
                          <td className="px-3 py-2 whitespace-nowrap">{new Date(o.createdAt).toLocaleString()}</td>
                          <td className="px-3 py-2 font-medium uppercase">{o.paymentMethod}</td>
                          <td className="px-3 py-2">{o.shots}</td>
                          <td className="px-3 py-2">{o.quantity}</td>
                          <td className="px-3 py-2">{o.priceCents}</td>
                          <td className="px-3 py-2 font-mono text-xs">{o.paymentRef}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-3 py-6 text-sm text-muted-foreground" colSpan={6}>
                          No orders recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="kiosk" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border bg-card/60 p-5 shadow-elevated">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium">Template selection</div>
                    <p className="mt-1 text-xs text-muted-foreground">If disabled, the kiosk will skip choosing a template.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Required</Label>
                    <Switch
                      checked={settings.kiosk.requireTemplateSelection}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          kiosk: { ...prev.kiosk, requireTemplateSelection: checked },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-xl border bg-secondary/20 p-4 text-xs text-muted-foreground">
                  Active formats: {Array.from(stripsById.values())
                    .filter((s) => s.enabled)
                    .map((s) => s.label)
                    .join(", ") || "None"}
                </div>
              </Card>

              <Card className="border bg-card/60 p-5 shadow-elevated">
                <div className="text-sm font-medium">Photo capture countdown (seconds)</div>
                <p className="mt-1 text-xs text-muted-foreground">Shown before each photo. Range: 3–15. Default: 10.</p>
                <div className="mt-4 grid gap-2">
                  <Label>Countdown</Label>
                  <Input
                    inputMode="numeric"
                    value={String(settings.kiosk.photoCaptureCountdownSeconds)}
                    onChange={(e) => {
                      const n = Math.round(Number(e.target.value));
                      const clamped = Number.isFinite(n) ? Math.min(15, Math.max(3, n)) : settings.kiosk.photoCaptureCountdownSeconds;
                      setSettings((prev) => ({
                        ...prev,
                        kiosk: { ...prev.kiosk, photoCaptureCountdownSeconds: clamped },
                      }));
                    }}
                  />
                  <div className="text-xs text-muted-foreground">
                    Tip: press <span className="font-medium">Apply to kiosk</span> to push changes to the running kiosk screen.
                  </div>
                </div>
              </Card>

              <Card className="border bg-secondary/25 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium">Touch-target audit mode</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Highlights tappable UI and flags anything under 44×44px (red) for tablet/kiosk verification.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Enabled</Label>
                    <Switch checked={touchAudit} onCheckedChange={setTouchAudit} />
                  </div>
                </div>
              </Card>

              <div className="md:col-span-2">
                <IdleCopyEditorCard />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
