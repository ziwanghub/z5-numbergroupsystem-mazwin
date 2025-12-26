import React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> { }

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, style, ...props }, ref) => {
    const defaultStyle: React.CSSProperties = {
        fontSize: '14px',
        fontWeight: '500',
        lineHeight: '1',
        color: '#0f172a',
        marginBottom: '6px',
        display: 'block',
        ...style
    };

    return (
        <label
            ref={ref}
            style={defaultStyle}
            {...props}
        />
    );
});

Label.displayName = "Label";

export { Label };
