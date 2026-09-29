import { Link } from 'react-router-dom';

export default function SectionHeading({ eyebrow, title, linkTo, linkLabel, className = '' }) {
  return (
    <div className={`mb-6 flex items-end justify-between gap-4 ${className}`}>
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 mb-1.5">{eyebrow}</p>}
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight">{title}</h2>
      </div>
      {linkTo && (
        <Link to={linkTo} className="shrink-0 text-sm font-semibold text-teal-700 hover:text-teal-800">
          {linkLabel || 'View all'} →
        </Link>
      )}
    </div>
  );
}
