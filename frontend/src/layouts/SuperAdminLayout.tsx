
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    ShieldAlert,
    Users,
    Activity,
    Settings,
    LogOut,
    LayoutDashboard,
    Laptop,
    MessageSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SuperAdminLayout: React.FC = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { path: '/admin/tenants', label: 'Tenant Managers', icon: Users },
        { path: '/admin/tickets', label: 'Support Inbox', icon: MessageSquare }, // [NEW]
        { path: '/admin/system', label: 'System Health', icon: Activity },
        { path: '/admin/settings', label: 'Global Config', icon: Settings },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30">
            {/* 1. SIDEBAR */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-20">
                {/* Header */}
                <div className="p-6 border-b border-slate-800/50">
                    <div className="flex items-center gap-3 text-amber-500">
                        <ShieldAlert className="w-8 h-8" />
                        <div>
                            <h1 className="font-bold text-lg tracking-tight text-white leading-none">Z-MOS</h1>
                            <span className="text-xs font-mono opacity-80 uppercase tracking-wider">God Mode</span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-amber-500/10 text-amber-500 shadow-sm border border-amber-500/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-amber-500' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                <span className="font-medium text-sm">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Back to Workstation Link */}
                <div className="px-4 pb-4">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 group border border-slate-800"
                    >
                        <Laptop className="w-5 h-5 text-slate-500 group-hover:text-white" />
                        <span className="font-medium text-sm">Back to Workstation</span>
                    </button>
                </div>

                {/* User Profile / Logout */}
                <div className="p-4 border-t border-slate-800/50">
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold border border-amber-500/30">
                            {user?.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                            <p className="text-xs text-slate-500 truncate">Super Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full h-9 flex items-center justify-center gap-2 rounded-md border border-slate-700 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors text-xs font-medium text-slate-400"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* 2. MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* ⚠️ GOD MODE BANNER ⚠️ */}
                <div className="bg-amber-500 text-slate-950 px-4 py-1 text-xs font-bold uppercase tracking-widest text-center shadow-lg z-10 select-none">
                    ⚠️ God Mode Active: Changes affect live production data ⚠️
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)',
                            backgroundSize: '24px 24px'
                        }}
                    />

                    <div className="max-w-7xl mx-auto relative z-10">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SuperAdminLayout;
