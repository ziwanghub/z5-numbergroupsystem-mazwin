import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Terminal, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        displayName: "",
        username: "", // Email
        password: "",
        confirmPassword: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (!formData.displayName || !formData.username || !formData.password) {
            toast.error("Please fill in all fields");
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            setLoading(false);
            return;
        }

        if (formData.password.length < 4) {
            toast.error("Password must be at least 4 characters");
            setLoading(false);
            return;
        }

        try {
            const res = await authService.register(formData.username, formData.password, formData.displayName);
            if (res.success) {
                toast.success(`Welcome to Kernel, ${res.user?.displayName}!`);
                navigate("/"); // Redirect to Dashboard
                window.location.reload(); // Reload to pick up session state in App.tsx
            } else {
                toast.error(res.message || "Registration failed");
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                {/* Logo */}
                <div className="flex flex-col items-center text-center">
                    <div className="h-12 w-12 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20 mb-4">
                        <Terminal className="h-6 w-6 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Initialize Credentials</h2>
                    <p className="text-slate-400 mt-2 text-sm">Create your identity in the z5 Kernel network.</p>
                </div>

                {/* Form Card */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-300 uppercase">Display Name</label>
                            <Input
                                name="displayName"
                                placeholder="e.g. Master Chef"
                                value={formData.displayName}
                                onChange={handleChange}
                                className="bg-slate-950 border-slate-800 focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-300 uppercase">Email Identity</label>
                            <Input
                                name="username"
                                type="email"
                                placeholder="chef@example.com"
                                value={formData.username}
                                onChange={handleChange}
                                className="bg-slate-950 border-slate-800 focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-300 uppercase">Password</label>
                                <Input
                                    name="password"
                                    type="password"
                                    placeholder="••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="bg-slate-950 border-slate-800 focus:border-blue-500 transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-300 uppercase">Confirm</label>
                                <Input
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="bg-slate-950 border-slate-800 focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white mt-6"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? "Registering..." : "Create Account"}
                            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>
                    </form>
                </div>

                {/* Footer Link */}
                <div className="text-center text-sm">
                    <span className="text-slate-500">Already have an identity? </span>
                    <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                        Access Console
                    </Link>
                </div>
            </div>
        </div>
    );
}
