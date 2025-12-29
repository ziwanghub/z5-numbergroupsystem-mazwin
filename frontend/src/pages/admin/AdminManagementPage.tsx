
import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Server, Database } from 'lucide-react';
import CreateTenantModal from '../../components/admin/CreateTenantModal';
import TenantListTable from '../../components/admin/TenantListTable';
import { adminService } from '../../services/adminService';
import { toast } from 'sonner';

const AdminManagementPage: React.FC = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [tenants, setTenants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTenants = async () => {
        try {
            setIsLoading(true);
            const data = await adminService.getTenants();
            setTenants(data);
        } catch (error) {
            console.error("Failed to fetch tenants", error);
            // Silent error or toast?
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    // Derived Stats
    const totalTenants = tenants.length;
    const totalUsers = tenants.reduce((acc, curr) => acc + (curr.stats?.userCount || 0), 0);
    const activeTenants = tenants.filter(t => t.subscription?.status === 'ACTIVE').length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Tenant Managers</h1>
                    <p className="text-slate-400">Manage organization admins and their access permissions.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-10 px-4 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-amber-500/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create Tenant</span>
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Total Tenants', value: totalTenants, icon: Users, color: 'text-amber-500' },
                    { label: 'Active Sessions', value: totalUsers, icon: Server, color: 'text-emerald-400' }, // Using Total Sub-Users as proxy for now
                    { label: 'Platform Load', value: 'Healthy', icon: Database, color: 'text-blue-400' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl flex items-center gap-4 hover:border-slate-700 transition-colors">
                        <div className={`p-3 rounded-lg bg-slate-950 border border-slate-800 ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content: List */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-800 flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search tenants..."
                            className="w-full h-10 bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* Table */}
                <TenantListTable
                    tenants={tenants}
                    isLoading={isLoading}
                    onRefresh={fetchTenants}
                />
            </div>

            {/* Modals */}
            <CreateTenantModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    toast.success("Tenant Created");
                    fetchTenants(); // Refresh list on success
                }}
            />
        </div>
    );
};

export default AdminManagementPage;
