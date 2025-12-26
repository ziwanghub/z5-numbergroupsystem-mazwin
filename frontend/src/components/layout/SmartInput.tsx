import { useEffect, useState, useRef, useCallback } from 'react';
import { Input } from "../ui/input";
import { Terminal, Loader2, Zap } from "lucide-react";
import { useCalculationContext } from "../../context/CalculationContext";
import { toast } from "sonner";
import { Button } from "../ui/button";

export function SmartInput() {
    const { input, setInput, config, predict, isCalculating } = useCalculationContext();
    const [localValue, setLocalValue] = useState(input);
    const inputRef = useRef<HTMLInputElement>(null);
    const [showPasteAssist, setShowPasteAssist] = useState(false);
    const [focusedByMouse, setFocusedByMouse] = useState(false);
    const [isGlobalPasteEnabled, setIsGlobalPasteEnabled] = useState(() => {
        const saved = localStorage.getItem('z5_global_paste_mode');
        return saved !== null ? saved === 'true' : true;
    });

    // Toggle Handler (Global Paste Only)
    const toggleGlobalPaste = useCallback(() => {
        setIsGlobalPasteEnabled(prev => {
            const newMode = !prev;
            localStorage.setItem('z5_global_paste_mode', String(newMode));

            toast.info(newMode ? "⚡️ Lightning Input: ON" : "⚪️ Lightning Input: OFF", {
                description: newMode ? "Global Paste Active (Ctrl+V anywhere)" : "Standard Mode (Local Paste Only)",
                duration: 2000,
            });
            return newMode;
        });

        requestAnimationFrame(() => {
            if (inputRef.current) inputRef.current.focus();
        });
    }, []);

    // 1. Auto-Focus on Mount & Shortcut Listener
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }

        const handleShortcut = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'F1') {
                e.preventDefault();
                toggleGlobalPaste();
            }
        };

        window.addEventListener('keydown', handleShortcut);
        return () => window.removeEventListener('keydown', handleShortcut);
    }, [toggleGlobalPaste]);

    // 2. Auto-Calc Logic (ALWAYS Active)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localValue !== input) {
                setInput(localValue);
                predict(localValue);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [localValue, input, setInput, predict]);

    // Handle Enter Key
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setInput(localValue);
            predict(localValue);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const sanitized = raw.replace(/[^0-9]/g, '');

        if (sanitized.length > config.maxLength) {
            toast.warning("Input Limit Reached", {
                description: `Maximum input length is ${config.maxLength} digits.`,
                duration: 2000,
            });
            return;
        }
        if (showPasteAssist) {
            setShowPasteAssist(false);
        }
        setLocalValue(sanitized);
    };

    // Shared Paste Logic
    const processPaste = useCallback((rawText: string, isGlobal = false) => {
        // Sanitize: Keep only numbers
        const cleanText = rawText.replace(/[^0-9]/g, '').slice(0, config.maxLength);

        if (cleanText.length === 0) {
            if (!isGlobal) toast.error("Invalid Paste", { description: "No numbers found." });
            return;
        }

        setLocalValue(cleanText);

        // Immediate Feedback
        toast.success(isGlobal ? "Global Paste Detected" : "Cleaned & Pasted", {
            description: `Extracted: ${cleanText}`,
            duration: 2000
        });

        // Force Focus back to input
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [config.maxLength]);

    // 3. Local Paste Handler
    const handleLocalPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const rawText = e.clipboardData.getData('text');
        processPaste(rawText, false);
    };

    // 4. Global Paste Listener (Controlled by Toggle)
    useEffect(() => {
        if (!isGlobalPasteEnabled) return; // Don't listen if disabled

        const handleGlobalPaste = (e: ClipboardEvent) => {
            // Safety: Don't hijack if user is typing in another input
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
                // If focused on OUR input, ignore global handler (local handler takes over)
                if (document.activeElement === inputRef.current) return;
                return;
            }

            e.preventDefault();
            const rawText = e.clipboardData?.getData('text') || '';
            if (rawText) {
                processPaste(rawText, true);
            }
        };

        document.addEventListener('paste', handleGlobalPaste);
        return () => document.removeEventListener('paste', handleGlobalPaste);
    }, [processPaste, isGlobalPasteEnabled]);

    const handlePasteAssistClick = async () => {
        try {
            const rawText = await navigator.clipboard.readText();
            processPaste(rawText, false);
            setShowPasteAssist(false);
        } catch (error) {
            toast.warning("Clipboard Access Blocked", {
                description: "Unable to read clipboard.",
                duration: 2000
            });
        }
    };

    return (
        <div className="relative w-full max-w-md flex items-center gap-2">
            <div className="relative flex-1">
                <div className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-500 pointer-events-none">
                    {isCalculating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    ) : (
                        <Terminal className="w-4 h-4" />
                    )}
                </div>
                <Input
                    ref={inputRef}
                    value={localValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handleLocalPaste}
                    onMouseDown={() => setFocusedByMouse(true)}
                    onFocus={() => {
                        if (focusedByMouse && localValue.length === 0) {
                            setShowPasteAssist(true);
                        }
                    }}
                    onBlur={() => {
                        setShowPasteAssist(false);
                        setFocusedByMouse(false);
                    }}
                    className="h-10 pl-9 pr-10 bg-slate-900/50 border-slate-700 text-slate-200 placeholder:text-slate-600 focus-visible:ring-blue-500 focus-visible:border-blue-500 rounded-lg text-sm font-mono tracking-widest shadow-inner transition-all hover:bg-slate-900"
                    placeholder="Type or Paste (Ctrl+V)..."
                />
                {showPasteAssist && (
                    <button
                        type="button"
                        onClick={handlePasteAssistClick}
                        className="absolute right-2 -bottom-5 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        Paste from clipboard
                    </button>
                )}
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={toggleGlobalPaste}
                className={`h-10 w-10 shrink-0 border border-slate-700 transition-all ${isGlobalPasteEnabled
                        ? "text-green-400 bg-slate-900/50 hover:bg-slate-800 hover:text-green-300 shadow-[0_0_10px_-3px_rgba(74,222,128,0.3)]"
                        : "text-slate-500 bg-slate-900/30 hover:bg-slate-800 hover:text-slate-400"
                    }`}
                title={isGlobalPasteEnabled ? "Global Paste: ON" : "Global Paste: OFF"}
            >
                <Zap className={`w-4 h-4 ${isGlobalPasteEnabled ? "fill-green-400/20" : ""}`} />
            </Button>
        </div>
    );
}
