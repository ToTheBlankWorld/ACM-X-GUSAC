import { forwardRef } from 'react';

const styles = {
  variant: {
    primary: 'bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-900 disabled:bg-teal-700/50',
    secondary: 'bg-white text-stone-800 border border-stone-300 hover:border-stone-400 hover:bg-stone-50',
    ghost: 'text-stone-600 hover:text-stone-900 hover:bg-stone-100',
    dark: 'bg-stone-900 text-white hover:bg-stone-800',
    danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  },
  size: {
    sm: 'h-8 px-3 text-[13px]',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-[15px]',
  },
};

export function Spinner({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`${className} shrink-0 animate-spin motion-reduce:animate-none`}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', type = 'button', loading = false, spinner = true, disabled = false, children, ...props },
  ref
) {
  const variantClass = loading
    ? styles.variant[variant].replace(/\b(?:disabled|hover|active|focus):[^\s]+/g, '').replace(/\s+/g, ' ').trim()
    : styles.variant[variant];

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors ${
        loading ? 'cursor-wait' : 'disabled:cursor-not-allowed disabled:opacity-60'
      } ${variantClass} ${styles.size[size]} ${className}`}
      {...props}
    >
      {loading && spinner && <Spinner />}
      {children}
    </button>
  );
});

export default Button;
