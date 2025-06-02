import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-primary-700 hover:bg-primary-800 text-white focus-visible:ring-primary-500': variant === 'primary',
            'bg-primary-100 hover:bg-primary-200 text-primary-700 focus-visible:ring-primary-300': variant === 'secondary',
            'bg-accent-600 hover:bg-accent-700 text-white focus-visible:ring-accent-500': variant === 'accent',
            'bg-success-600 hover:bg-success-700 text-white focus-visible:ring-success-500': variant === 'success',
            'bg-error-600 hover:bg-error-700 text-white focus-visible:ring-error-500': variant === 'error',
            'bg-transparent hover:bg-primary-100 text-primary-700 focus-visible:ring-primary-300': variant === 'ghost',
            'text-xs px-2 py-1 h-7': size === 'sm',
            'text-sm px-4 py-2 h-9': size === 'md',
            'text-base px-6 py-3 h-11': size === 'lg',
          },
          className
        )}
        ref={ref}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;