import React from 'react';
import { cn } from './Card';

export const Button = React.forwardRef(({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    return (
        <button
            ref={ref}
            className={cn(
                "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-earth-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
                {
                    "bg-gradient-to-r from-nature-600 to-nature-700 text-white hover:from-nature-700 hover:to-nature-800 shadow-md hover:shadow-lg": variant === 'default',
                    "bg-gradient-to-r from-earth-500 to-earth-600 text-white hover:from-earth-600 hover:to-earth-700 shadow-md hover:shadow-lg": variant === 'primary',
                    "bg-white/80 backdrop-blur-sm border border-nature-200 text-nature-900 hover:bg-white hover:shadow-md": variant === 'outline',
                    "hover:bg-nature-100/50 hover:text-nature-900": variant === 'ghost',
                    "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg": variant === 'destructive',
                    "h-10 px-5 py-2": size === 'default',
                    "h-9 rounded-lg px-4": size === 'sm',
                    "h-12 rounded-xl px-8 text-base": size === 'lg',
                    "h-10 w-10": size === 'icon',
                },
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
});

Button.displayName = "Button";
