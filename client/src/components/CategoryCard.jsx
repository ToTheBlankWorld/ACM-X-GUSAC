import { Link } from 'react-router-dom';

export default function CategoryCard({ name, icon, count, tint }) {
  return (
    <Link
      to={`/shop?category=${encodeURIComponent(name)}`}
      className="group flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all"
    >
      <span className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tint} flex items-center justify-center text-2xl shrink-0`} aria-hidden>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-stone-900 group-hover:text-teal-800 transition-colors">{name}</span>
        <span className="block text-xs text-stone-500">{count} product{count === 1 ? '' : 's'}</span>
      </span>
      <span className="ml-auto text-stone-300 group-hover:text-teal-700 transition-colors" aria-hidden>→</span>
    </Link>
  );
}
