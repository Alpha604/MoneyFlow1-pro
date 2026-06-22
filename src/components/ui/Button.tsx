import { motion } from 'motion/react';
import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none focus:ring-offset-[#020617]';
    
    const variants = {
      primary: 'bg-indigo-500 text-white hover:bg-indigo-400 focus:ring-indigo-500',
      secondary: 'bg-white/10 text-white hover:bg-white/20 focus:ring-white/20',
      outline: 'border border-white/10 text-slate-300 hover:bg-white/5 focus:ring-white/10',
      ghost: 'text-slate-300 hover:bg-white/5 hover:text-white focus:ring-white/10',
      danger: 'bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-500',
    };

    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-4 py-2',
      lg: 'h-14 px-8 text-lg',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
