import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  bordered?: boolean;
  compact?: boolean;
  hoverable?: boolean;
}

export default function Card({
  children,
  title,
  subtitle,
  className = '',
  bordered = true,
  compact = false,
  hoverable = false,
}: CardProps) {
  return (
    <div
      className={`
        card bg-base-100
        ${bordered ? 'border border-base-300' : ''}
        ${compact ? 'card-compact' : 'card-normal'}
        ${hoverable ? 'hover:shadow-md transition-shadow' : ''}
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className="card-body">
          {title && <h2 className="card-title">{title}</h2>}
          {subtitle && <p className="text-sm text-neutral-content">{subtitle}</p>}
          {children}
        </div>
      )}
      
      {!title && !subtitle && (
        <div className="card-body">
          {children}
        </div>
      )}
    </div>
  );
} 