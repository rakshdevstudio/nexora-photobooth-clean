import { Route, Routes, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminTemplates from "./pages/AdminTemplates";
import AdminPanel from "./pages/AdminPanel";
import { isAdminAuthed } from "@/booth/admin/adminAuth";
import TouchAuditInit from "@/components/TouchAuditInit";
import { LicenseProvider } from "./license/LicenseContext";

// New Admin Imports
import { AdminAuthProvider } from "./admin/context/AdminAuthContext";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminLayout from "./admin/components/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminAdmins from "./admin/pages/AdminAdmins";
import AdminLicenses from "./admin/pages/AdminLicenses";
import AdminAuditLogs from "./admin/pages/AdminAuditLogs";
import AdminMaintenance from "./admin/pages/AdminMaintenance";
import PrintLayout from "./pages/PrintLayout";
import { PrintQueueProvider } from "./booth/printQueue/PrintQueueContext";

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
    <LicenseProvider>
      <AdminAuthProvider>
        <PrintQueueProvider>
          <Routes>
            <Route path="/" element={<Index />} />

            {/* Existing Local Admin Routes (Operator) */}
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

            {/* New Super Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/admins" element={<AdminAdmins />} />
              <Route path="/admin/licenses" element={<AdminLicenses />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
              <Route path="/admin/maintenance" element={<AdminMaintenance />} />
            </Route>

            <Route path="*" element={<NotFound />} />
            <Route path="/print-layout" element={<PrintLayout />} />
          </Routes>
        </PrintQueueProvider>
      </AdminAuthProvider>
    </LicenseProvider>
  </>
);

export default App;
