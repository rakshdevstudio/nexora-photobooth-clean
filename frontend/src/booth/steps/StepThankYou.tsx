import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";
import { useComposedOutput } from "@/booth/hooks/useComposedOutput";
import { QrCode, Sparkles, Play, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function StepThankYou() {
  const { resetToStart, order, templates, uploadFinalPhoto } = useBoothFlow();
  const [uploadTimedOut, setUploadTimedOut] = useState(false);

  // Re-generate visual preview
  const template = order.layoutType === "template" ? templates.find((t) => t.id === order.selectedTemplateId) : undefined;
  const photoUrls = order.photos.map((p) => p.url).filter(Boolean);
  const { dataUrl } = useComposedOutput({
    mode: order.layoutType === "template" ? "template" : "strip",
    shots: order.requiredShots,
    photoUrls,
    template,
  });

  // Background idle timer (2 minutes)
  useEffect(() => {
    const timer = setTimeout(() => {
      void resetToStart();
    }, 120000); // 2 minutes
    return () => clearTimeout(timer);
  }, [resetToStart]);

  // Trigger upload for QR code
  useEffect(() => {
    if (dataUrl && !order.downloadUrl && uploadFinalPhoto) {
      // Small delay to ensure we don't spam if it's flickering
      const t = setTimeout(() => {
        void uploadFinalPhoto(dataUrl);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [dataUrl, order.downloadUrl, uploadFinalPhoto]);

  useEffect(() => {
    if (dataUrl && !order.downloadUrl) {
      const t = setTimeout(() => setUploadTimedOut(true), 15000);
      return () => clearTimeout(t);
    }
  }, [dataUrl, order.downloadUrl]);

  // CSS for animations
  const animationStyles = `
@keyframes subtle-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
@keyframes confetti-fade-in {
  0% { opacity: 0; transform: scale(0.95) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-float { animation: subtle-float 6s ease-in-out infinite; }
.animate-enter { animation: confetti-fade-in 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
`;

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-black text-white">
      <style>{animationStyles}</style>

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(76,29,149,0.15),_rgba(0,0,0,0)_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0)_20%,rgba(0,0,0,0)_80%,rgba(0,0,0,0.9)_100%)]" />

      {/* Main Content Grid */}
      <div className="z-10 grid h-full w-full grid-cols-1 overflow-hidden p-6 md:grid-cols-2 md:p-0">

        {/* Left: Generated Photo Preview */}
        <div className="relative flex h-full w-full animate-enter items-center justify-center p-4 md:p-12">
          <div className="animate-float relative flex h-full max-h-[80vh] w-full max-w-[90%] items-center justify-center rounded-xl md:max-w-lg">
            <div className="relative h-full w-auto max-w-full overflow-hidden rounded-xl bg-white p-2 shadow-2xl shadow-purple-900/20 rotate-1">
              {dataUrl ? (
                <img src={dataUrl} alt="Final Print" className="h-full w-auto object-contain" />
              ) : (
                <div className="flex h-full aspect-[2/3] items-center justify-center bg-gray-100 text-gray-400">
                  <Sparkles className="animate-pulse opacity-50" />
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent mix-blend-overlay" />
            </div>
          </div>
        </div>

        {/* Right: Actions & QR */}
        <div className="flex h-full w-full animate-enter flex-col items-center justify-center p-4 delay-100 md:p-16">
          <div className="flex w-full max-w-md flex-col items-center gap-6 text-center md:gap-8">

            <div className="space-y-2">
              <h1 className="text-3xl font-light tracking-tight text-white/90 md:text-5xl">
                Thank You
              </h1>
              <p className="text-sm text-white/60 md:text-lg">
                Your memories are being printed.
              </p>
            </div>

            {/* QR Card */}
            <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-transform hover:scale-[1.02] active:scale-[0.98]">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-xl bg-white p-2">
                  {order.downloadUrl ? (
                    <QRCodeSVG
                      value={order.downloadUrl}
                      size={200}
                      className="h-32 w-32 md:h-48 md:w-48"
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="H"
                      includeMargin={false}
                    />
                  ) : !uploadTimedOut ? (
                    <div className="flex aspect-square w-32 flex-col items-center justify-center gap-2 bg-gray-900 text-center text-white md:w-36">
                      <Loader2 className="h-8 w-8 animate-spin opacity-50" />
                      <span className="text-[10px] leading-tight text-white/50">Generating<br />QR Code...</span>
                    </div>
                  ) : (
                    // Fallback if no URL
                    <div className="flex aspect-square w-32 flex-col items-center justify-center gap-2 bg-gray-900 text-center text-white md:w-36">
                      <QrCode className="h-8 w-8 opacity-50" />
                      <span className="text-[10px] leading-tight text-white/50">Details with<br />Operator</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-white">
                    {order.downloadUrl ? "Scan to Download Your Photos" : "Ask Operator for Downloads"}
                  </p>
                  {order.downloadUrl && (
                    <p className="text-xs text-white/40">Get your digital copy instantly</p>
                  )}
                </div>
                <div className="pt-2 text-xs font-medium tracking-wide text-purple-200/60">
                  Tag us @nexorabooth
                </div>
              </div>

              {/* Decorative Glow */}
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl opacity-50" />
            </div>

            {/* Primary Action */}
            <div className="w-full space-y-3 pt-4">
              <Button
                className="h-16 w-full rounded-2xl bg-white text-lg font-medium text-black shadow-xl shadow-white/10 hover:bg-white/90"
                onClick={() => void resetToStart()}
              >
                <Play className="mr-3 h-5 w-5 fill-current" />
                Start New Session
              </Button>
              <p className="text-sm text-white/30">
                Tap when the next guest is ready
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-4 left-0 right-0 z-20 flex flex-col items-center justify-center gap-1 text-center text-[10px] uppercase tracking-widest text-white/20 md:bottom-6 md:flex-row md:gap-4">
        <span>Powered by Nexora Booth</span>
        <span className="hidden opacity-50 md:inline-block">•</span>
        <span>Event: Wedding of Rahul & Ananya</span>
      </div>
    </div>
  );
}
