import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', onClick, padding = 'md' }: CardProps) {
  const padClass = padding === 'sm' ? 'p-3' : padding === 'lg' ? 'p-6' : 'p-4';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`bg-surface border border-line rounded-card ${padClass} ${className} ${
        onClick ? 'cursor-pointer hover:border-primary/30 transition-colors' : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {children}
    </motion.div>
  );
}

interface BadgeProps {
  children: ReactNode;
  color?: 'primary' | 'sage' | 'amber' | 'red' | 'plum' | 'neutral';
  className?: string;
}

export function Badge({ children, color = 'neutral', className = '' }: BadgeProps) {
  const colors = {
    primary: 'bg-primary-soft text-primary',
    sage: 'bg-sage-soft text-sage',
    amber: 'bg-amber-soft text-amber',
    red: 'bg-red-soft text-red',
    plum: 'bg-plum-soft text-plum',
    neutral: 'bg-surface-2 text-ink-2',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[color]} ${className}`}
    >
      {children}
    </span>
  );
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  ariaLabel?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  type = 'button',
  ariaLabel,
}: ButtonProps) {
  const variants = {
    primary: 'bg-primary text-white hover:opacity-90',
    secondary: 'bg-surface-2 text-ink border border-line hover:bg-surface-2/70',
    ghost: 'text-primary hover:bg-primary-soft',
    danger: 'bg-red text-white hover:opacity-90',
  };
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`rounded-xl font-medium transition-all ${variants[variant]} ${sizes[size]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}

interface SectionHeaderProps {
  children: ReactNode;
  className?: string;
}

export function SectionHeader({ children, className = '' }: SectionHeaderProps) {
  return <h2 className={`font-serif text-xl text-ink mb-3 ${className}`}>{children}</h2>;
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  return (
    <div className="flex items-start justify-between px-4 pt-6 pb-4">
      <div>
        <h1 className="font-serif text-2xl text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-ink-2 mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}