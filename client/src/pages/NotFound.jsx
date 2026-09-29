import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-shell px-4 py-24 text-center">
      <p className="font-display text-6xl font-semibold text-teal-700">404</p>
      <h1 className="mt-4 text-xl font-semibold text-stone-900">This page took a day off</h1>
      <p className="mt-2 text-sm text-stone-500 max-w-sm mx-auto">
        The link may be old or mistyped. The catalog, however, is right where you left it.
      </p>
      <div className="mt-7 flex justify-center gap-2">
        <Link to="/" className="h-10 leading-10 px-5 rounded-lg bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800">Go home</Link>
        <Link to="/shop" className="h-10 leading-[38px] px-5 rounded-lg bg-white border border-stone-300 text-stone-800 text-sm font-semibold hover:bg-stone-50">Browse products</Link>
      </div>
    </div>
  );
}
