import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={cn(
          "flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 ring-offset-[#020617] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors backdrop-blur-xl",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
