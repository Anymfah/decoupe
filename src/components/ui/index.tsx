import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Plus, Minus, X, HelpCircle } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Tooltip = ({ 
  content, 
  children, 
  className,
  wrapperClassName
}: { 
  content: string; 
  children: React.ReactNode; 
  className?: string;
  wrapperClassName?: string;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updateCoords();
      const handleScroll = () => updateCoords();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [isVisible]);

  return (
    <div 
      ref={triggerRef}
      className={cn("relative inline-flex items-center group", wrapperClassName)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && createPortal(
        <div 
          className={cn(
            "fixed z-[1000] px-3 py-2 bg-black/90 dark:bg-white/95 text-white dark:text-black text-[11px] font-medium rounded-lg shadow-xl w-max max-w-[200px] text-center animate-fade-in pointer-events-none",
            className
          )}
          style={{
            top: `${coords.top - 8}px`,
            left: `${coords.left}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {content}
          <div 
            className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black/90 dark:border-t-white/95" 
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  className 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title?: string; 
  children: React.ReactNode;
  className?: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
        onClick={onClose} 
      />
      <div className={cn(
        "relative w-full max-w-2xl bg-app-premium dark:bg-[#070A10] border border-white/10 rounded-apple-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]",
        className
      )}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted hover:text-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const GlassCard = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={cn(
      "bg-glass border-glass rounded-apple-xl shadow-glass-sm glossy-overlay transition-all duration-300",
      className
    )} 
    {...props}
  >
    {children}
  </div>
);

export const SectionTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h2 className={cn("text-lg font-semibold text-text tracking-tight mb-4", className)}>
    {children}
  </h2>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md', 
  ...props 
}: ButtonProps) => {
  const variants = {
    primary: "bg-accent text-white shadow-[0_2px_8px_rgba(30,167,255,0.25)] hover:shadow-[0_4px_12px_rgba(30,167,255,0.35)] hover:bg-[#2BAEFF] active:scale-[0.97]",
    secondary: "bg-panel text-text border border-white/5 hover:bg-panel-strong active:scale-[0.97] shadow-sm",
    danger: "bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 active:scale-[0.97]",
    ghost: "text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.95]",
  };

  const sizes = {
    sm: "px-3 py-2 md:py-1.5 text-xs font-semibold rounded-apple-md min-h-[36px] md:min-h-0",
    md: "px-4 py-2.5 md:py-2 text-sm font-semibold rounded-apple-md min-h-[44px] md:min-h-0",
    lg: "px-6 py-3.5 md:py-3 text-base font-semibold rounded-apple-lg min-h-[48px] md:min-h-0",
  };

  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none select-none touch-manipulation",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input = ({ label, tooltip, error, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; tooltip?: string; error?: string }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && (
      <div className="flex items-center gap-1.5 px-1">
        <label className="text-[11px] font-bold text-muted2 uppercase tracking-widest">{label}</label>
        {tooltip && (
          <Tooltip content={tooltip}>
            <HelpCircle className="w-3 h-3 text-muted2/40 hover:text-accent transition-colors cursor-help" />
          </Tooltip>
        )}
      </div>
    )}
    <div className="relative group">
      <input 
        className={cn(
          "bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.05] rounded-apple-md px-3 py-2 text-sm text-text transition-all duration-200 w-full",
          "placeholder:text-muted2/40 outline-none",
          "focus:ring-2 focus:ring-accent/20 focus:border-accent/30 focus:bg-white/[0.06]",
          error && "border-danger/30 focus:ring-danger/10",
          className
        )}
        {...props}
      />
    </div>
    {error && <span className="text-[10px] font-medium text-danger px-1">{error}</span>}
  </div>
);

export const IconButton = ({ icon: Icon, className, size = 'md', ...props }: ButtonProps & { icon: any }) => (
  <Button variant="ghost" className={cn("p-2 h-auto rounded-full", className)} {...props}>
    <Icon className={cn(size === 'sm' ? "w-3.5 h-3.5" : "w-4.5 h-4.5")} />
  </Button>
);

export const KpiPill = ({ label, value, icon: Icon, color = 'accent', className }: { label: string; value: string | number; icon?: any; color?: string; className?: string }) => (
  <div className={cn("flex flex-col gap-0.5 p-3 bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] rounded-apple-lg transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]", className)}>
    <div className="flex items-center gap-1.5 text-muted2">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span className="text-[10px] font-bold uppercase tracking-[0.1em]">{label}</span>
    </div>
    <div className={cn("text-lg font-bold tracking-tight", color === 'accent' ? "text-accent" : color === 'danger' ? "text-danger" : color === 'success' ? "text-success" : "text-text")}>
      {value}
    </div>
  </div>
);

export const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) => (
  <label className="flex items-center gap-2 cursor-pointer group select-none touch-manipulation">
    <div 
      onClick={(e) => {
        e.preventDefault();
        onChange(!checked);
      }}
      className={cn(
        "relative w-9 h-5 rounded-full transition-all duration-300 ease-apple-out border",
        checked ? "bg-accent border-accent" : "bg-black/[0.05] dark:bg-white/[0.1] border-transparent"
      )}
    >
      <div className={cn(
        "absolute top-[2px] left-[2px] w-[16px] h-[16px] rounded-full bg-white transition-all duration-300 ease-apple-out shadow-md",
        checked ? "translate-x-4" : "translate-x-0"
      )} />
    </div>
    {label && <span className="text-[10px] font-medium text-muted group-hover:text-text transition-colors">{label}</span>}
  </label>
);

export const Stepper = ({ value, onChange, min = 0, max = 9999 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) => {
  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(Math.max(min, value - 1));
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(Math.min(max, value + 1));
  };

  return (
    <div className="flex items-center bg-black/5 dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] rounded-apple-md p-0.5 w-full md:w-32 shrink-0">
      <button 
        type="button"
        onClick={handleDecrement}
        className="w-10 h-10 md:w-9 md:h-8 flex shrink-0 items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-apple-sm transition-colors text-muted hover:text-text active:scale-90 touch-manipulation"
      >
        <Minus className="w-4 h-4 md:w-3.5 md:h-3.5" />
      </button>
      <input 
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10);
          if (!isNaN(val)) onChange(val);
        }}
        className="flex-1 min-w-0 bg-transparent text-center text-base md:text-sm font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button 
        type="button"
        onClick={handleIncrement}
        className="w-10 h-10 md:w-9 md:h-8 flex shrink-0 items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-apple-sm transition-colors text-muted hover:text-text active:scale-90 touch-manipulation"
      >
        <Plus className="w-4 h-4 md:w-3.5 md:h-3.5" />
      </button>
    </div>
  );
};
