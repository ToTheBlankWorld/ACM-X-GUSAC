import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import Skeleton from '../components/Skeleton.jsx';

const CATEGORIES = ['Peripherals', 'Audio', 'Cameras', 'Power', 'Accessories', 'Displays'];
const SORTS = [
  ['featured', 'Most popular'],
  ['new', 'Newest'],
  ['rating', 'Top rated'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState(null);
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const deals = params.get('deals') === '1';
  const sort = params.get('sort') || 'featured';

  useEffect(() => {
    setProducts(null);
    const usp = new URLSearchParams();
    if (q) usp.set('q', q);
    if (category) usp.set('category', category);
    if (deals) usp.set('deals', '1');
    if (sort !== 'featured') usp.set('sort', sort);
    api.get(`/store/products?${usp.toString()}`).then((d) => setProducts(d.products)).catch(() => setProducts([]));
  }, [q, category, deals, sort]);

  const heading = useMemo(() => {
    if (q) return `Results for “${q}”`;
    if (deals) return 'Deals of the week';
    if (category) return category;
    if (sort === 'new') return 'New arrivals';
    return 'All products';
  }, [q, category, deals, sort]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const activeCategory = (c) => (category === c ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400');

  return (
    <div className="mx-auto max-w-shell px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 mb-1.5">Catalog</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900">{heading}</h1>
        </div>
        <p className="text-sm text-stone-500" aria-live="polite">
          {products ? `${products.length} product${products.length === 1 ? '' : 's'}` : 'Loading…'}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <button onClick={() => setParam('category', null) || setParam('deals', null) || setParam('q', null) || setParam('sort', null)}
          className={`h-9 px-3.5 rounded-full border text-[13px] font-medium transition-colors ${
            !category && !deals && !q && sort === 'featured' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
          }`}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => { setParam('category', c); setParam('deals', null); setParam('q', null); }}
            className={`h-9 px-3.5 rounded-full border text-[13px] font-medium transition-colors ${activeCategory(c)}`}>
            {c}
          </button>
        ))}
        <span className="grow" />
        <label className="flex items-center gap-2 text-[13px] text-stone-500">
          Sort
          <select value={sort} onChange={(e) => setParam('sort', e.target.value === 'featured' ? null : e.target.value)}
            className="h-9 rounded-lg border border-stone-300 bg-white px-2.5 text-[13px] text-stone-800 focus:outline-none focus:border-teal-600">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>

      {q && (
        <button onClick={() => setParam('q', null)} className="mb-6 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800">
          Clear search “{q}” ✕
        </button>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {!products
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72" />)
          : products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>

      {products && products.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-4xl mb-3" aria-hidden>🔍</p>
          <p className="font-semibold text-stone-900">Nothing matched that search</p>
          <p className="mt-1 text-sm text-stone-500">Try a different term, or browse the full catalog.</p>
        </div>
      )}
    </div>
  );
}
