
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
  const baseStyles = "inline-flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 tracking-wide font-medium";
  
  const variants = {
    primary: "px-8 py-4 rounded-[2rem] bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow hover:shadow-lg hover:shadow-brand-500/40",
    secondary: "px-6 py-3 rounded-[2rem] bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 border border-surface-100 dark:border-surface-700 shadow-sm",
    danger: "px-6 py-3 rounded-[2rem] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30",
    ghost: "px-4 py-2 rounded-xl text-surface-500 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-brand-50/50 dark:hover:bg-brand-900/20",
    fab: "w-14 h-14 rounded-full bg-brand-600 text-white shadow-xl shadow-brand-500/30 hover:scale-110 hover:shadow-2xl hover:shadow-brand-500/50 z-50",
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
        <Icon className={`${variant === 'fab' ? 'w-6 h-6' : 'w-5 h-5'} ${children ? 'mr-2' : ''}`} />
      ) : null}
      {children}
    </button>
  );
};

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-surface-900 rounded-[2rem] shadow-soft hover:shadow-md border border-surface-50 dark:border-surface-800/50 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </div>
);

// --- Input ---
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input 
    className={`w-full px-6 py-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border-transparent focus:bg-white dark:focus:bg-surface-800 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/30 outline-none transition-all placeholder:text-surface-400 font-medium text-surface-800 dark:text-surface-100 ${className}`}
    {...props}
  />
);

// --- TextArea ---
export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
  <textarea 
    className={`w-full px-6 py-4 rounded-3xl bg-transparent border-none focus:ring-0 outline-none transition-all resize-none placeholder:text-surface-300 dark:placeholder:text-surface-600 font-medium ${className}`}
    {...props}
  />
);

// --- Modal ---
export const Modal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ isOpen, onClose, title, children, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-900/20 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-surface-900 rounded-[2.5rem] max-w-md w-full shadow-2xl p-8 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 border border-white/20">
        <h3 className="text-2xl font-display font-bold mb-4 text-surface-900 dark:text-white">{title}</h3>
        <div className="text-surface-600 dark:text-surface-300 mb-8 leading-relaxed">
          {children}
        </div>
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          {actions}
        </div>
      </div>
    </div>
  );
};
