import React from 'react';

const Label = React.forwardRef(({ className, ...props }, ref) => {
    const style = {
        fontSize: '14px', // text-sm
        fontWeight: '500', // font-medium
        lineHeight: '1',
        color: '#0f172a', // text-slate-900 (peer-disabled etc ignored for simplicity)
        marginBottom: '6px',
        display: 'block',
        ...props.style
    };

    return (
        <label
            ref={ref}
            style={style}
            {...props}
        />
    );
});

Label.displayName = "Label";

export { Label };
