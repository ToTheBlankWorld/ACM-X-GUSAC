import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ProductVisual from '../components/ProductVisual.jsx';
import CategoryCard from '../components/CategoryCard.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import Rating from '../components/Rating.jsx';
import Button from '../components/Button.jsx';
import Skeleton from '../components/Skeleton.jsx';

const CATEGORY_ICONS = {
  Peripherals: '⌨️',
  Audio: '🎧',
  Cameras: '📷',
  Power: '🔋',
  Accessories: '🔌',
  Displays: '🖥️',
};

const BENEFITS = [
  { icon: 'M3 7h11v8H3zM14 10h3l3 3v2h-6zM6.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z', title: 'Free shipping', text: 'On all orders over $50, every day' },
  { icon: 'M12 3l7 3v5c0 4.4-3 8.4-7 9.5C8 19.4 5 15.4 5 11V6z', title: '2-year warranty', text: 'Coverage on every device we sell' },
  { icon: 'M4 9a8 8 0 1 1 2.3 5.7M4 9V4m0 5h5', title: '30-day returns', text: 'Changed your mind? Send it back' },
  { icon: 'M12 3a9 9 0 1 0 9 9M12 7v5l3 3', title: 'Fast support', text: 'Real humans, one business day' },
];

const TESTIMONIALS = [
  { name: 'Sarah Chen', role: 'Product designer', quote: 'Ordered on a Tuesday, building with it on Thursday. The kind of store you keep bookmarked.', stars: 5 },
  { name: 'Mike Torres', role: 'Software engineer', quote: 'Prices are fair, the catalog is tight — no endless junk to scroll past. My desk is 100% NovaCart now.', stars: 5 },
  { name: 'Elena Rodriguez', role: 'Stream producer', quote: 'Support replaced a cable within two days, no forms, no fuss. That is why I keep coming back.', stars: 4 },
];

export default function Home() {
  const [products, setProducts] = useState(null);
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  useEffect(() => {
    api.get('/store/products').then((d) => setProducts(d.products)).catch(() => setProducts([]));
  }, []);

  const categories = useMemo(() => {
    if (!products) return [];
    const map = new Map();
    for (const p of products) {
      if (!map.has(p.category)) map.set(p.category, { name: p.category, icon: CATEGORY_ICONS[p.category] || '🛍️', count: 0, tint: p.tint });
      map.get(p.category).count += 1;
    }
    return [...map.values()];
  }, [products]);

  const featured = useMemo(
    () => (products ? [...products].sort((a, b) => b.rating - a.rating).slice(0, 4) : []),
    [products]
  );
  const popular = useMemo(
    () => (products ? [...products].sort((a, b) => b.reviews_count - a.reviews_count).slice(0, 8) : []),
    [products]
  );
  const heroPicks = useMemo(() => (products ? [products[0], products[3], products[5]].filter(Boolean) : []), [products]);

  const subscribe = (e) => {
    e.preventDefault();
    if (!email.includes('@')) {
      toast('Please enter a valid email address.', 'error');
      return;
    }
    setEmail('');
    toast("You're on the list — welcome to NovaCart.");
  };

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/80 via-white to-white border-b border-stone-100">
        <div className="mx-auto max-w-shell px-4 py-14 sm:py-20 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 mb-4">New season · Desk &amp; audio</p>
            <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-semibold tracking-tight text-stone-900 leading-[1.05]">
              Everything you need,<br />in one place.
            </h1>
            <p className="mt-5 max-w-md text-stone-600 leading-relaxed">
              Keyboards, audio and everyday tech — a tight catalog picked by people who actually use
              the gear. Fair prices, fast delivery, no junk.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="inline-flex items-center h-12 px-6 rounded-lg bg-teal-700 text-white text-[15px] font-semibold hover:bg-teal-800 transition-colors shadow-card">
                Shop now
              </Link>
              <Link to="/shop?deals=1" className="inline-flex items-center h-12 px-6 rounded-lg bg-white border border-stone-300 text-stone-800 text-[15px] font-semibold hover:border-stone-400 hover:bg-stone-50 transition-colors">
                Browse deals
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <Rating value={4.8} size={15} />
              <p className="text-sm text-stone-500"><strong className="text-stone-700">4.8</strong> from 2,100+ verified reviews</p>
            </div>
          </motion.div>

          <div className="relative hidden lg:block h-[420px]" aria-hidden>
            {heroPicks[0] && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
                className="absolute right-40 top-2 w-64">
                <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-lift" style={{ '--tilt': '-3deg' }}>
                  <ProductVisual icon={heroPicks[0].icon} tint={heroPicks[0].tint} className="aspect-[5/4] animate-float" glyphClass="text-7xl" />
                </div>
              </motion.div>
            )}
            {heroPicks[1] && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
                className="absolute right-4 top-36 w-56">
                <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-lift" style={{ '--tilt': '2deg' }}>
                  <ProductVisual icon={heroPicks[1].icon} tint={heroPicks[1].tint} className="aspect-[5/4] animate-float" glyphClass="text-6xl" />
                </div>
              </motion.div>
            )}
            {heroPicks[2] && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5 }}
                className="absolute right-56 top-56 w-52">
                <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-lift" style={{ '--tilt': '-1deg' }}>
                  <ProductVisual icon={heroPicks[2].icon} tint={heroPicks[2].tint} className="aspect-[5/4] animate-float" glyphClass="text-6xl" />
                </div>
              </motion.div>
            )}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
              className="absolute right-2 top-0 rounded-full bg-white border border-stone-200 shadow-card px-4 py-2 text-xs font-semibold text-stone-700">
              🔥 Up to <span className="text-teal-700">25% off</span> this week
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------- Categories ---------- */}
      <section className="mx-auto max-w-shell px-4 py-14">
        <SectionHeading eyebrow="Browse" title="Shop by category" linkTo="/shop" linkLabel="View all products" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((c) => <CategoryCard key={c.name} {...c} />)}
        </div>
      </section>

      {/* ---------- Featured ---------- */}
      <section className="mx-auto max-w-shell px-4 pb-14">
        <SectionHeading eyebrow="Hand-picked" title="Featured this week" linkTo="/shop?sort=rating" linkLabel="Top rated" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {!products
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72" />)
            : featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* ---------- Benefits ---------- */}
      <section className="border-y border-stone-100 bg-white">
        <div className="mx-auto max-w-shell px-4 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex gap-3.5">
              <span className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0" aria-hidden>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d={b.icon} />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-stone-900">{b.title}</p>
                <p className="text-[13px] text-stone-500 leading-snug mt-0.5">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Popular ---------- */}
      <section className="mx-auto max-w-shell px-4 py-14">
        <SectionHeading eyebrow="Loved by customers" title="Popular right now" linkTo="/shop" linkLabel="View all products" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {!products
            ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72" />)
            : popular.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* ---------- Testimonials ---------- */}
      <section className="bg-stone-100/70 border-y border-stone-100">
        <div className="mx-auto max-w-shell px-4 py-14">
          <SectionHeading eyebrow="Reviews" title="What customers say" />
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-xl bg-white border border-stone-200 p-6 shadow-card">
                <Rating value={t.stars} size={14} />
                <blockquote className="mt-3 text-[15px] text-stone-700 leading-relaxed">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold text-stone-900">{t.name}</span>
                  <span className="text-stone-400"> · {t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Newsletter ---------- */}
      <section className="mx-auto max-w-shell px-4 py-14">
        <div className="rounded-2xl bg-teal-800 text-white px-6 py-10 sm:px-12 sm:py-12 flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="flex-1">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Get the good stuff first</h2>
            <p className="mt-2 text-teal-100 text-[15px] max-w-md leading-relaxed">
              New arrivals, restocks and subscriber-only deals. One email a week, no noise.
            </p>
          </div>
          <form onSubmit={subscribe} className="flex w-full max-w-md gap-2">
            <label className="flex-1">
              <span className="sr-only">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-12 rounded-lg px-4 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </label>
            <Button type="submit" variant="dark" size="lg" className="bg-stone-900 hover:bg-stone-800">Subscribe</Button>
          </form>
        </div>
      </section>
    </div>
  );
}
