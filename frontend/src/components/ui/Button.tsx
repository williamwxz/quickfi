import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'btn font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-50';
  
  const variantClasses = {
    primary: 'btn-primary text-white hover:bg-primary-focus focus:ring-primary',
    secondary: 'btn-secondary text-white hover:bg-secondary-focus focus:ring-secondary',
    accent: 'btn-accent text-white hover:bg-accent-focus focus:ring-accent',
    outline: 'btn-outline border-2 hover:text-white',
    ghost: 'btn-ghost hover:bg-base-200',
  };
  
  const sizeClasses = {
    sm: 'btn-sm text-xs',
    md: 'text-sm py-2 px-4',
    lg: 'btn-lg text-base',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${isLoading ? 'loading' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {children}
    </button>
  );
} 