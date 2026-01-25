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
import PrintQueueIndicator from "@/booth/components/PrintQueueIndicator";

export default function BoothRouter() {
  const { step } = useBoothFlow();

  let content;
  switch (step) {
    case "start": content = <StepStart />; break;
    case "shots": content = <StepShots />; break;
    case "layout_select": content = <StepLayoutTypeSelect />; break;
    case "quantity": content = <StepQuantity />; break;
    case "summary": content = <StepSummary />; break;
    case "payment_method": content = <StepPaymentMethod />; break;
    case "payment_loading": content = <StepPaymentLoading />; break;
    case "payment_gateway": content = <StepPaymentGateway />; break;
    case "payment_confirmation": content = <StepPaymentConfirmation />; break;
    case "template_select": content = <StepTemplateSelect />; break;
    case "camera_select": content = <StepCameraSelect />; break;
    case "capture": content = <StepCapture />; break;
    case "photo_review": content = <StepPhotoReview />; break;
    case "final_review": content = <StepFinalReview />; break;
    case "final_preview": content = <StepFinalPreview />; break;
    case "print": content = <StepPrint />; break;
    case "thank_you": content = <StepThankYou />; break;
    default: content = <StepStart />; break;
  }

  return (
    <>
      {content}
      <PrintQueueIndicator />
    </>
  );
}
