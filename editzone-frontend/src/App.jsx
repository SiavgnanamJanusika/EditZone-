import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleBasedRoute from "./routes/RoleBasedRoute";

import LandingPage from "./pages/landing/LandingPage";
import AboutPage from "./pages/landing/AboutPage";
import WhyUsPage from "./pages/landing/WhyUsPage";
import CreditsPage from "./pages/landing/CreditsPage";

import ChooseRolePage from "./pages/auth/ChooseRolePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import CompleteProfilePage from "./pages/auth/CompleteProfilePage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

import EditorsPage from "./pages/user/EditorsPage";
import EditorProfilePage from "./pages/user/EditorProfilePage";
import OrderHistoryPage from "./pages/user/OrderHistoryPage";

import EditorDashboard from "./pages/editor/EditorDashboard";
import EditorProfileEdit from "./pages/editor/EditorProfileEdit";

import ChatPage from "./pages/shared/ChatPage";

import PaymentPage from "./pages/payment/PaymentPage";
import PaymentSuccessPage from "./pages/payment/PaymentSuccessPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import EditorManagement from "./pages/admin/EditorManagement";
import PaymentManagement from "./pages/admin/PaymentManagement";
import ProjectMonitoring from "./pages/admin/ProjectMonitoring";

function RequireLoggedIn({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-brand-dark text-brand-cyan">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/why-us" element={<WhyUsPage />} />
            <Route path="/credits" element={<CreditsPage />} />
            <Route path="/choose-role" element={<ChooseRolePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Post-login, pre-registration-complete */}
            <Route
              path="/complete-profile"
              element={
                <RequireLoggedIn>
                  <CompleteProfilePage />
                </RequireLoggedIn>
              }
            />

            {/* User */}
            <Route path="/editors" element={<ProtectedRoute><RoleBasedRoute roles={["user"]}><EditorsPage /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/editors/:editorId" element={<ProtectedRoute><RoleBasedRoute roles={["user"]}><EditorProfilePage /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/order-history" element={<ProtectedRoute><RoleBasedRoute roles={["user"]}><OrderHistoryPage /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/chat/:requestId" element={<ProtectedRoute><RoleBasedRoute roles={["user"]}><ChatPage role="user" /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/payment/:requestId" element={<ProtectedRoute><RoleBasedRoute roles={["user"]}><PaymentPage /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/payment-success" element={<ProtectedRoute><RoleBasedRoute roles={["user"]}><PaymentSuccessPage /></RoleBasedRoute></ProtectedRoute>} />

            {/* Editor */}
            <Route path="/editor/dashboard" element={<ProtectedRoute><RoleBasedRoute roles={["editor"]}><EditorDashboard /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/editor/profile" element={<ProtectedRoute><RoleBasedRoute roles={["editor"]}><EditorProfileEdit /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/editor/chat/:requestId" element={<ProtectedRoute><RoleBasedRoute roles={["editor"]}><ChatPage role="editor" /></RoleBasedRoute></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute><RoleBasedRoute roles={["admin"]}><AdminDashboard /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><RoleBasedRoute roles={["admin"]}><UserManagement /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/admin/editors" element={<ProtectedRoute><RoleBasedRoute roles={["admin"]}><EditorManagement /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute><RoleBasedRoute roles={["admin"]}><PaymentManagement /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/admin/projects" element={<ProtectedRoute><RoleBasedRoute roles={["admin"]}><ProjectMonitoring /></RoleBasedRoute></ProtectedRoute>} />

            <Route path="*" element={<LandingPage />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
