import { Route, Routes, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminTemplates from "./pages/AdminTemplates";
import AdminPanel from "./pages/AdminPanel";
import { isAdminAuthed } from "@/booth/admin/adminAuth";
import TouchAuditInit from "@/components/TouchAuditInit";

type RequireAdminProps = {
  children: React.ReactNode;
};

function RequireAdmin({ children }: RequireAdminProps) {
  if (!isAdminAuthed()) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <>
    <TouchAuditInit />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminPanel />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/templates"
        element={
          <RequireAdmin>
            <AdminTemplates />
          </RequireAdmin>
        }
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

export default App;

