function Star({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <path d="M10 1.6l2.5 5.1 5.6.8-4 4 .9 5.6L10 14.5l-5 2.6.9-5.6-4-4 5.6-.8z" />
    </svg>
  );
}

/**
 * Star rating with fractional fill (e.g. 4.6 → 4.6/5 filled).
 * Pass `value` for the numeric readout, `size` in px.
 */
export default function Rating({ value = 0, size = 14, showValue = false, count = null, className = '' }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const star = (filled, i) => (
    <Star key={i} className={`${filled ? 'text-amber-400' : 'text-stone-300'} shrink-0`} />
  );
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="relative inline-flex" style={{ width: size * 5 + 8, height: size }} aria-hidden>
        <span className="absolute inset-0 flex justify-between">{[0, 1, 2, 3, 4].map((i) => star(false, i))}</span>
        <span className="stars-fill flex justify-between" style={{ width: `${pct}%` }}>
          {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="text-amber-400 shrink-0" />)}
        </span>
      </span>
      <span role="img" aria-label={`Rated ${value} out of 5`} className="sr-only">{value} out of 5 stars</span>
      {showValue && <span className="text-xs font-medium text-stone-500">{value.toFixed(1)}</span>}
      {count != null && <span className="text-xs text-stone-400">({count.toLocaleString()})</span>}
    </span>
  );
}
