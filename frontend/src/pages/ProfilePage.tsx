import { useState, useEffect } from "react";
import { authService, User, getInitials } from "../services/authService";
import { RecipeManager } from "../lib/recipe-manager";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { User as UserIcon, Shield, Database, Save, Key } from "lucide-react";

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [recipeCount, setRecipeCount] = useState(0);

    // Form State
    const [displayName, setDisplayName] = useState("");
    const [password, setPassword] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const res = await authService.getMe();
            if (res.success && res.user) {
                setUser(res.user);
                setDisplayName(res.user.displayName);

                // Load Stats
                // In local mock, we assume 'author' field might be used loosely, 
                // but let's count all recipes for now or filter if we enforce authorId later.
                // For Phase 3, we simply show "Total Recipes" system-wide or user-specific if we implemented that.
                // Since RecipeManager is currently singular local storage, let's just show total count for now.
                const allRecipes = RecipeManager.listRecipes();
                setRecipeCount(allRecipes.length);
            }
        } catch (e) {
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const updates: any = {};
            if (displayName !== user.displayName) updates.displayName = displayName;
            if (password) {
                if (password.length < 4) {
                    toast.error("Password too short");
                    setSaving(false);
                    return;
                }
                updates.password = password;
            }

            if (Object.keys(updates).length === 0) {
                setSaving(false);
                return;
            }

            const res = await authService.updateProfile(user.id, updates);
            if (res.success) {
                toast.success("Profile updated");
                setUser(res.user!);
                setPassword(""); // Clear password field
            } else {
                toast.error(res.message);
            }
        } catch (e) {
            toast.error("Update failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Loading profile...</div>;
    if (!user) return <div className="p-8 text-red-400">User not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg border-4 border-slate-900">
                    {getInitials(user.displayName)}
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">{user.displayName}</h1>
                    <div className="flex items-center gap-2 text-slate-400 mt-1">
                        <span className="bg-slate-800 text-xs px-2 py-0.5 rounded text-blue-400 uppercase font-bold tracking-wider border border-slate-700">
                            {user.role}
                        </span>
                        <span className="text-sm">@{user.username}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Stats */}
                <div className="space-y-6">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-300">
                                <Database className="h-4 w-4 text-blue-500" />
                                Network Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-white">{recipeCount}</div>
                            <div className="text-sm text-slate-500">Recipes Created</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-300">
                                <Shield className="h-4 w-4 text-green-500" />
                                Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-slate-400 space-y-2">
                            <div className="flex justify-between">
                                <span>Account ID</span>
                                <span className="font-mono text-xs text-slate-600 truncate max-w-[100px]">{user.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Session</span>
                                <span className="text-green-400">Active</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Edit Form */}
                <div className="md:col-span-2">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-slate-200">Edit Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Display Name</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="pl-9 bg-slate-950 border-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800 space-y-4">
                                <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <Key className="h-4 w-4" /> Change Password
                                </h4>
                                <div className="space-y-2">
                                    <Input
                                        type="password"
                                        placeholder="New Password (leave blank to keep current)"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-slate-950 border-slate-700"
                                    />
                                    <p className="text-[10px] text-slate-500">Only enter if you wish to change it.</p>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-500 min-w-[120px]">
                                    {saving ? "Saving..." : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" /> Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
