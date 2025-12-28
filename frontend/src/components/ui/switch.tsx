import * as React from "react"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, onCheckedChange, onChange, ...props }, ref) => {
        return (
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    className="peer sr-only"
                    ref={ref}
                    onChange={(e) => {
                        onChange?.(e);
                        onCheckedChange?.(e.target.checked);
                    }}
                    {...props}
                />
                <div className="h-5 w-9 rounded-full bg-slate-700 peer-checked:bg-blue-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/50 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
        )
    }
)
Switch.displayName = "Switch"

export { Switch }
