import React, { useState } from 'react';
import { MoreVertical, User, Users, Calendar, ShieldCheck, ShieldAlert, Trash2, Ban, CheckCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { toast } from 'sonner';

interface Tenant {
    _id: string;
    username: string; // Email
    createdAt: string;
    subscription?: {
        status: string;
        plan: string;
    };
    stats: {
        userCount: number;
    };
}

interface TenantListTableProps {
    tenants: Tenant[];
    isLoading: boolean;
    onRefresh: () => void;
}

const TenantListTable: React.FC<TenantListTableProps> = ({ tenants, isLoading, onRefresh }) => {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const handleStatusToggle = async (tenant: Tenant) => {
        const newStatus = tenant.subscription?.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        if (!confirm(`Are you sure you want to ${newStatus === 'ACTIVE' ? 'activate' : 'suspend'} this tenant?`)) return;

        try {
            await adminService.updateTenantStatus(tenant._id, newStatus);
            toast.success(`Tenant ${newStatus.toLowerCase()}`);
            onRefresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to update status");
        }
        setOpenMenuId(null);
    };

    const handleDelete = async (tenantId: string) => {
        if (!confirm("WARNING: This will permanently delete the tenant and ALL their users. This action cannot be undone. Proceed?")) return;

        try {
            await adminService.deleteTenant(tenantId);
            toast.success("Tenant deleted");
            onRefresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete tenant");
        }
        setOpenMenuId(null);
    };

    if (isLoading) {
        return (
            <div className="p-12 text-center text-slate-500 animate-pulse">
                Loading tenants...
            </div>
        );
    }

    if (tenants.length === 0) {
        return (
            <div className="p-12 flex flex-col items-center justify-center text-center text-slate-500">
                <div className="w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                    <Users className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-white font-medium mb-1">No Tenants Found</h3>
                <p className="text-sm max-w-xs mx-auto">Click "Create Tenant" to onboard a new organization admin.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-visible pb-20"> {/* Extra padding for dropdowns */}
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950/50 text-xs uppercase font-medium text-slate-500">
                    <tr>
                        <th className="px-6 py-4">Tenant Manager</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Users</th>
                        <th className="px-6 py-4">Joined</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {tenants.map((tenant) => (
                        <tr key={tenant._id} className="hover:bg-slate-800/30 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">{tenant.username}</div>
                                        <div className="text-xs text-slate-500">ID: {tenant._id.slice(-6)}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${tenant.subscription?.status === 'ACTIVE'
                                        ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400'
                                        : 'bg-red-950/30 border-red-900 text-red-400'
                                    }`}>
                                    {tenant.subscription?.status === 'ACTIVE' ? (
                                        <ShieldCheck className="w-3 h-3" />
                                    ) : (
                                        <ShieldAlert className="w-3 h-3" />
                                    )}
                                    {tenant.subscription?.status || 'UNKNOWN'}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Users className="w-4 h-4 text-slate-500" />
                                    {tenant.stats?.userCount || 0} Users
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(tenant.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(openMenuId === tenant._id ? null : tenant._id);
                                    }}
                                    className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>

                                {/* Dropdown Menu */}
                                {openMenuId === tenant._id && (
                                    <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                        <div className="p-1">
                                            <button
                                                onClick={() => handleStatusToggle(tenant)}
                                                className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2 ${tenant.subscription?.status === 'ACTIVE'
                                                        ? 'text-amber-400 hover:bg-amber-950/30'
                                                        : 'text-emerald-400 hover:bg-emerald-950/30'
                                                    }`}
                                            >
                                                {tenant.subscription?.status === 'ACTIVE' ? (
                                                    <>
                                                        <Ban className="w-3 h-3" />
                                                        Suspend Tenant
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-3 h-3" />
                                                        Activate Tenant
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(tenant._id)}
                                                className="w-full text-left px-3 py-2 rounded-md text-xs font-medium text-red-400 hover:bg-red-950/30 flex items-center gap-2"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Delete Tenant
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Overlay to close menu */}
                                {openMenuId === tenant._id && (
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setOpenMenuId(null)}
                                    />
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TenantListTable;
