import React, { useState, useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardLayout from "./layouts/DashboardLayout";
import WorkstationPage from "./pages/WorkstationPage";
import ProfilePage from "./pages/ProfilePage";
import { authService, User } from "./services/authService";
import { CalculationProvider } from "./context/CalculationContext";
import { Toaster } from "sonner";

const FormulaLibraryPage = lazy(() => import("./pages/FormulaLibraryPage"));
const RecipeBuilderPage = lazy(() => import("./pages/RecipeBuilderPage"));

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    // 1. Force Dark Mode Class
    document.documentElement.classList.add("dark");

    // 2. Check Session
    const checkSession = async () => {
      try {
        const response = await authService.getMe();
        if (response.success && response.user) {
          setUser(response.user);
        }
      } catch (error) {
        // Session invalid or expired, user remains null
        console.log("No active session");
      } finally {
        setIsLoading(false);
        setIsAuthChecked(true);
      }
    };
    checkSession();
  }, []);

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

  // Protected Route Wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };
  const isDev = import.meta.env.DEV;
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const canAccessFormulaLibrary = isDev || isAdmin;

  return (
    <BrowserRouter>
      <Toaster position="top-right" theme="dark" />
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage onLogin={setUser} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" replace /> : <RegisterPage />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              {/* Context Provider wraps the layout so Header and Pages share state */}
              <CalculationProvider>
                <DashboardLayout user={user} onLogout={() => setUser(null)} />
              </CalculationProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<WorkstationPage />} />
          <Route
            path="formula-library"
            element={
              canAccessFormulaLibrary ? (
                <Suspense
                  fallback={
                    <div className="text-slate-500 text-sm">Loading Formula Library...</div>
                  }
                >
                  <FormulaLibraryPage />
                </Suspense>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="recipes" element={
            canAccessFormulaLibrary ? <Suspense fallback={<div>Loading...</div>}><RecipeBuilderPage /></Suspense> : <Navigate to="/" replace />
          } />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
