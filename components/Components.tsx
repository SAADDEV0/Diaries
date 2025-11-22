import React from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'fab';
  icon?: LucideIcon;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon: Icon, 
  isLoading,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 font-semibold tracking-wide";
  
  const variants = {
    primary: "px-6 py-4 rounded-2xl bg-surface-900 dark:bg-white text-white dark:text-surface-900 shadow-lg hover:shadow-xl hover:-translate-y-0.5",
    secondary: "px-6 py-3 rounded-2xl bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 border border-surface-200 dark:border-surface-700 shadow-sm hover:bg-surface-50 dark:hover:bg-surface-700",
    danger: "px-6 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30",
    ghost: "px-4 py-2 rounded-xl text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800/50",
    fab: "w-16 h-16 rounded-full bg-brand-600 text-white shadow-xl shadow-brand-500/30 hover:scale-110 hover:shadow-2xl hover:shadow-brand-500/40",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : Icon ? (
        <Icon className={`${variant === 'fab' ? 'w-7 h-7' : 'w-5 h-5'} ${children ? 'mr-2' : ''}`} />
      ) : null}
      {children}
    </button>
  );
};

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-surface-800/60 backdrop-blur-md rounded-[2rem] shadow-soft border border-surface-100 dark:border-surface-700/50 transition-all duration-300 ${onClick ? 'cursor-pointer active:scale-[0.98] hover:shadow-lg hover:border-surface-200 dark:hover:border-surface-600' : ''} ${className}`}
  >
    {children}
  </div>
);

// --- Input ---
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input 
    className={`w-full px-5 py-4 rounded-2xl bg-surface-100 dark:bg-surface-800/50 border border-transparent focus:bg-white dark:focus:bg-surface-800 focus:border-surface-200 dark:focus:border-surface-600 outline-none transition-all placeholder:text-surface-400 font-medium text-surface-900 dark:text-surface-100 ${className}`}
    {...props}
  />
);

// --- TextArea ---
export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
  <textarea 
    className={`w-full px-5 py-4 rounded-3xl bg-surface-100 dark:bg-surface-800/50 border border-transparent focus:bg-white dark:focus:bg-surface-800 focus:border-surface-200 dark:focus:border-surface-600 outline-none transition-all resize-none placeholder:text-surface-400 font-medium ${className}`}
    {...props}
  />
);
