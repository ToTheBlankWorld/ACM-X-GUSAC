import { Link } from 'react-router-dom';

export default function Breadcrumbs({ trail = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[13px]">
      <ol className="flex flex-wrap items-center gap-1.5 text-stone-400">
        <li><Link to="/" className="hover:text-stone-700">Home</Link></li>
        {trail.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span aria-hidden>/</span>
            {item.to && i < trail.length - 1 ? (
              <Link to={item.to} className="hover:text-stone-700">{item.label}</Link>
            ) : (
              <span className="text-stone-600 font-medium" aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
