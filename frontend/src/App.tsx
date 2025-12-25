import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import WorkstationPage from "./pages/WorkstationPage";
import ProfilePage from "./pages/ProfilePage";
import { authService, User } from "./services/authService";

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
  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage onLogin={setUser} />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout user={user} onLogout={() => setUser(null)} />
            </ProtectedRoute>
          }
        >
          <Route index element={<WorkstationPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}