import React from 'react';
import { cn } from './Card';

export const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-11 w-full rounded-xl border border-nature-200 dark:border-nature-800/60 bg-white dark:bg-nature-950/50 backdrop-blur-sm px-4 py-2 text-sm text-nature-900 dark:text-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-nature-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-earth-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 focus:bg-white dark:bg-nature-950 shadow-inner",
                className
            )}
            ref={ref}
            {...props}
        />
    );
});

Input.displayName = "Input";
