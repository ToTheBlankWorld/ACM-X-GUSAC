import { money, discountPercent } from '../lib/format.js';

export default function Price({ price, compareAt = null, size = 'md', className = '' }) {
  const off = discountPercent(price, compareAt);
  const sizes = {
    sm: ['text-[15px]', 'text-xs'],
    md: ['text-lg', 'text-sm'],
    lg: ['text-2xl', 'text-base'],
  }[size];
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className={`font-semibold text-stone-900 ${sizes[0]}`}>{money(price)}</span>
      {off && (
        <>
          <s className={`text-stone-400 font-normal ${sizes[1]}`}>{money(compareAt)}</s>
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800">
            −{off}%
          </span>
        </>
      )}
    </span>
  );
}
