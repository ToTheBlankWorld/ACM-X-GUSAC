export default function QuantityStepper({ value, onChange, min = 1, max = 99, small = false }) {
  const btn = `flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent ${small ? 'w-7 h-7' : 'w-9 h-9'}`;
  return (
    <div className={`inline-flex items-center rounded-lg border border-stone-300 bg-white ${small ? 'h-8' : 'h-10'}`}>
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Decrease quantity">
        −
      </button>
      <span className={`text-center font-semibold tabular-nums ${small ? 'w-8 text-[13px]' : 'w-10 text-sm'}`} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}
