import { useState } from "react";
import { Terminal, AlertCircle, Loader2 } from "lucide-react";
import { authService } from "../services/authService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

interface LoginPageProps {
    onLogin: (user: any) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await authService.login(username, password);
            if (response.success) {
                onLogin(response.user);
            }
        } catch (err: any) {
            setError(err.message || "Invalid credentials");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-slate-200">
            <div className="w-full max-w-md space-y-8 px-4">
                {/* LOGO AREA */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">
                            <Terminal className="w-10 h-10 text-blue-400" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-white">z5 Number Group System</h1>
                        <p className="text-slate-400 mt-2 text-sm">Professional Data Workstation</p>
                    </div>
                </div>

                {/* FORM AREA */}
                <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-md flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Username</label>
                            <Input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-slate-900/50 border-slate-700 text-white focus-visible:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-slate-900/50 border-slate-700 text-white focus-visible:ring-blue-500"
                                placeholder="••••"
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full bg-slate-700 hover:bg-slate-600 text-white border border-slate-600">
                        {isLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : "Login"}
                    </Button>
                </form>

                <div className="text-center mt-8">
                    <p className="text-slate-600 text-xs">v1.0.0 • Enterprise Edition</p>
                </div>
            </div>
        </div>
    );
}
