import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";
import StepStart from "@/booth/steps/StepStart";
import StepShots from "@/booth/steps/StepShots";
import StepLayoutTypeSelect from "@/booth/steps/StepLayoutTypeSelect";
import StepQuantity from "@/booth/steps/StepQuantity";
import StepSummary from "@/booth/steps/StepSummary";
import StepPaymentLoading from "@/booth/steps/StepPaymentLoading";
import StepPaymentMethod from "@/booth/steps/StepPaymentMethod";
import StepPaymentGateway from "@/booth/steps/StepPaymentGateway";
import StepPaymentConfirmation from "@/booth/steps/StepPaymentConfirmation";
import StepTemplateSelect from "@/booth/steps/StepTemplateSelect";
import StepCameraSelect from "@/booth/steps/StepCameraSelect";
import StepCapture from "@/booth/steps/StepCapture";
import StepPhotoReview from "@/booth/steps/StepPhotoReview";
import StepFinalReview from "@/booth/steps/StepFinalReview";
import StepFinalPreview from "@/booth/steps/StepFinalPreview";
import StepPrint from "@/booth/steps/StepPrint";
import StepThankYou from "@/booth/steps/StepThankYou";

export default function BoothRouter() {
  const { step } = useBoothFlow();

  switch (step) {
    case "start":
      return <StepStart />;
    case "shots":
      return <StepShots />;
    case "layout_select":
      return <StepLayoutTypeSelect />;
    case "quantity":
      return <StepQuantity />;
    case "summary":
      return <StepSummary />;
    case "payment_method":
      return <StepPaymentMethod />;
    case "payment_loading":
      return <StepPaymentLoading />;
    case "payment_gateway":
      return <StepPaymentGateway />;
    case "payment_confirmation":
      return <StepPaymentConfirmation />;
    case "template_select":
      return <StepTemplateSelect />;
    case "camera_select":
      return <StepCameraSelect />;
    case "capture":
      return <StepCapture />;
    case "photo_review":
      return <StepPhotoReview />;
    case "final_review":
      return <StepFinalReview />;
    case "final_preview":
      return <StepFinalPreview />;
    case "print":
      return <StepPrint />;
    case "thank_you":
      return <StepThankYou />;
    default:
      return <StepStart />;
  }
}
