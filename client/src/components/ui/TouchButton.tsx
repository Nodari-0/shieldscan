'use client';

import { forwardRef, ReactNode, ButtonHTMLAttributes } from 'react';

interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const variants = {
  primary: 'bg-yellow-500 text-black hover:bg-yellow-400 border border-yellow-500',
  secondary: 'bg-dark-secondary text-white hover:bg-dark-accent border border-dark-accent',
  outline: 'bg-transparent text-white border border-dark-accent hover:border-yellow-500/50',
  ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-4 py-2.5 text-base min-h-[44px]',
  lg: 'px-6 py-3 text-lg min-h-[52px]',
};

/**
 * Touch-friendly button component with proper touch targets (44px minimum)
 */
const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    fullWidth = false,
    loading = false,
    icon,
    iconPosition = 'right',
    className = '',
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = `
      inline-flex items-center justify-center gap-2
      font-semibold rounded-xl
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:ring-offset-2 focus:ring-offset-black
      disabled:opacity-50 disabled:cursor-not-allowed
      touch-manipulation
      hover:scale-[1.02] active:scale-[0.98]
      cursor-pointer
    `;

    return (
      <button
        ref={ref}
        className={`
          ${baseClasses}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
              fill="none"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {icon && iconPosition === 'left' && !loading && icon}
        {children}
        {icon && iconPosition === 'right' && !loading && icon}
      </button>
    );
  }
);

TouchButton.displayName = 'TouchButton';

export default TouchButton;
