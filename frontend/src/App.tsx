import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardLayout from "./layouts/DashboardLayout";
import WorkstationPage from "./pages/WorkstationPage";
import ProfilePage from "./pages/ProfilePage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import RoleRoute from "./components/RoleRoute"; // [NEW]
import { CalculationProvider } from "./context/CalculationContext";
import { Toaster } from "sonner";

const FormulaLibraryPage = lazy(() => import("./pages/FormulaLibraryPage"));
const RecipeBuilderPage = lazy(() => import("./pages/RecipeBuilderPage"));

// Super Admin Feature (Lazy Loading)
const SuperAdminLayout = React.lazy(() => import('./layouts/SuperAdminLayout'));
const AdminManagementPage = React.lazy(() => import('./pages/admin/AdminManagementPage'));
const TicketInboxPage = lazy(() => import("./pages/admin/TicketInboxPage")); // [NEW]

// Inner App Component to consume AuthContext
const AppRoutes = () => {
  const { user, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-32 bg-slate-700 mb-4 rounded"></div>
          <div className="text-sm text-slate-500">Loading Kernel...</div>
        </div>
      </div>
    );
  }

  const isDev = import.meta.env.DEV;
  // Admin Check helper, though specific routes use RoleRoute
  const canAccessFormulaLibrary = isDev || (user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role));

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage onLogin={login} />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <RegisterPage />}
      />

      {/* ========================================================= */}
      {/* 👑 SUPER ADMIN ZONE (Protected & Lazy Loaded) */}
      {/* ========================================================= */}
      <Route
        path="/admin"
        element={
          <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500">Loading Command Center...</div>}>
            <RoleRoute allowedRoles={['SUPER_ADMIN']}>
              <SuperAdminLayout />
            </RoleRoute>
          </Suspense>
        }
      >
        <Route index element={<Navigate to="/admin/tenants" replace />} /> {/* Default to tenants for now */}
        <Route path="tenants" element={<AdminManagementPage />} />
        <Route path="tickets" element={<TicketInboxPage />} /> {/* [NEW] */}
        <Route path="system" element={<div className="text-white p-8">System Health (Coming Soon)</div>} />
        <Route path="settings" element={<div className="text-white p-8">Global Config (Coming Soon)</div>} />
      </Route>

      {/* ========================================================= */}
      {/* 👤 USER WORKSTATION (Standard App) */}
      {/* ========================================================= */}
      <Route
        path="/"
        element={
          <RoleRoute allowedRoles={['USER', 'ADMIN', 'SUPER_ADMIN', 'AUDITOR']}>
            <CalculationProvider>
              {/* Note: DashboardLayout now uses useAuth internally */}
              <DashboardLayout />
            </CalculationProvider>
          </RoleRoute>
        }
      >
        <Route index element={<WorkstationPage />} />
        <Route
          path="formula-library"
          element={
            canAccessFormulaLibrary ? (
              <Suspense fallback={<div>Loading...</div>}>
                <FormulaLibraryPage />
              </Suspense>
            ) : <Navigate to="/" replace />
          }
        />
        <Route path="recipes" element={
          canAccessFormulaLibrary ? <Suspense fallback={<div>Loading...</div>}><RecipeBuilderPage /></Suspense> : <Navigate to="/" replace />
        } />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" theme="dark" />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
