import { Outlet, useNavigate } from "react-router-dom";
import { Terminal, Users, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { authService, User } from "../services/authService";
import { Button } from "../components/ui/button";
import { SmartInput } from "../components/layout/SmartInput";

interface DashboardLayoutProps {
    user: User | null;
    onLogout: () => void;
}

export default function DashboardLayout({ user, onLogout }: DashboardLayoutProps) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await authService.logout();
        onLogout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col">
            {/* HEADER */}
            <header className="h-16 border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-50 gap-4">
                <div className="flex items-center gap-2 shrink-0">
                    <Terminal className="w-6 h-6 text-blue-500" />
                    <span className="font-bold text-lg tracking-tight text-white hidden md:block">z5 Kernel</span>
                </div>

                {/* SMART INPUT (Center Stage) */}
                <div className="flex-1 max-w-lg flex justify-center">
                    <SmartInput />
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-white">{user?.username}</p>
                        <p className="text-xs text-slate-500 uppercase">{user?.role}</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">
                        {user?.username?.[0]?.toUpperCase()}
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* SIDEBAR */}
                <aside className="w-64 bg-[#020617] border-r border-slate-800 hidden md:flex flex-col">
                    <div className="p-4 space-y-1">
                        <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Platform</h3>
                        <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => navigate("/")}>
                            <LayoutDashboard className="w-4 h-4 mr-3" />
                            Workstation
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => navigate("/profile")}>
                            <Users className="w-4 h-4 mr-3" />
                            Profile
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
                            <Settings className="w-4 h-4 mr-3" />
                            Settings
                        </Button>
                    </div>

                    <div className="mt-auto p-4 border-t border-slate-800">
                        <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={handleLogout}>
                            <LogOut className="w-4 h-4 mr-3" />
                            Sign Out
                        </Button>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 overflow-y-auto bg-[#0f172a] p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
