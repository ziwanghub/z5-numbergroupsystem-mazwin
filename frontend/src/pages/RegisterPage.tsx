import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Terminal, ArrowRight, Eye, EyeOff } from "lucide-react";
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

    // UI State
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Reset form on mount to ensure clean slate
    useEffect(() => {
        setFormData({
            displayName: "",
            username: "",
            password: "",
            confirmPassword: ""
        });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const [emailStatus, setEmailStatus] = useState<'checking' | 'available' | 'taken' | null>(null);

    const handleEmailBlur = async () => {
        if (!formData.username) return;
        // Simple regex check for valid email before hitting server
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.username)) {
            // Can add local email invalid state here if wanted
            return;
        }

        setEmailStatus('checking');
        const res = await authService.checkEmail(formData.username);
        if (!res.available) {
            setEmailStatus('taken');
            toast.error("This email is already registered. Please login or use another.");
        } else {
            setEmailStatus('available');
        }
    };

    // Validation Logic
    const passwordsMatch = formData.password === formData.confirmPassword;
    const isPasswordValid = formData.password.length >= 4;
    const isConfirmDirty = formData.confirmPassword.length > 0;

    const isFormValid =
        formData.displayName.trim().length > 0 &&
        formData.username.trim().length > 0 &&
        isPasswordValid &&
        passwordsMatch &&
        emailStatus !== 'taken' &&
        emailStatus !== 'checking'; // Wait for check to finish? Or allow if null? 
    // Safer: 
    // emailStatus === 'available' || (emailStatus === null && formData.username...)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (emailStatus === 'taken') {
            toast.error("Cannot register with a taken email.");
            setLoading(false);
            return;
        }

        // Final Validation (just in case button disabled trick was bypassed)
        if (!formData.displayName || !formData.username || !formData.password) {
            toast.error("Please fill in all fields");
            setLoading(false);
            return;
        }

        if (!passwordsMatch) {
            toast.error("Passwords do not match");
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
                    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-300 uppercase">Display Name</label>
                            <Input
                                name="displayName"
                                placeholder="e.g. Master Chef"
                                value={formData.displayName}
                                onChange={handleChange}
                                autoComplete="off"
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
                                onBlur={handleEmailBlur}
                                autoComplete="off"
                                className={`bg-slate-950 border-slate-800 focus:border-blue-500 transition-colors ${emailStatus === 'taken' ? 'border-red-500 text-red-400' :
                                    emailStatus === 'available' ? 'border-green-500/50' : ''
                                    }`}
                            />
                            {emailStatus === 'checking' && <p className="text-xs text-blue-400 mt-1">Checking...</p>}
                            {emailStatus === 'taken' && <p className="text-xs text-red-400 mt-1">Email already registered.</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-300 uppercase">Password</label>
                                <div className="relative">
                                    <Input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                        className="bg-slate-950 border-slate-800 focus:border-blue-500 transition-colors pr-8"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-300 uppercase">Confirm</label>
                                <div className="relative">
                                    <Input
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm..."
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                        className={`bg-slate-950 border-slate-800 focus:border-blue-500 transition-colors pr-8 ${isConfirmDirty && !passwordsMatch ? 'border-red-500' : ''
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                </div>
                                {isConfirmDirty && !passwordsMatch && (
                                    <p className="text-[10px] text-red-500">Mismatched</p>
                                )}
                            </div>
                        </div>

                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            size="lg"
                            disabled={loading || !isFormValid}
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
