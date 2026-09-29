import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api.js';
import { useStore } from '../context/StoreContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { money, shortDate, discountPercent } from '../lib/format.js';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import ProductVisual from '../components/ProductVisual.jsx';
import Rating from '../components/Rating.jsx';
import Price from '../components/Price.jsx';
import QuantityStepper from '../components/QuantityStepper.jsx';
import Button from '../components/Button.jsx';
import ReviewCard from '../components/ReviewCard.jsx';
import ReviewForm from '../components/ReviewForm.jsx';
import Skeleton from '../components/Skeleton.jsx';

const COLORWAYS = [
  { name: 'Midnight', dot: '#1c1917' },
  { name: 'Cloud', dot: '#e7e5e4' },
  { name: 'Teal', dot: '#0f766e' },
];

const TINT_VARIANTS = [
  null,
  'from-stone-100 to-stone-200',
  'from-teal-50 to-teal-100',
  'from-amber-50 to-orange-100',
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, setCartOpen } = useStore();
  const { toast } = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [qty, setQty] = useState(1);
  const [colorway, setColorway] = useState('Midnight');
  const [activeImage, setActiveImage] = useState(0);
  const [error, setError] = useState('');

  const loadReviews = useCallback(async () => {
    try {
      const data = await api.get(`/store/products/${id}/reviews`);
      setReviews(data.reviews);
    } catch {
      setReviews([]);
    }
  }, [id]);

  useEffect(() => {
    setProduct(null);
    setReviews(null);
    setQty(1);
    setActiveImage(0);
    setError('');
    api.get(`/store/products/${id}`)
      .then((d) => setProduct(d.product))
      .catch((e) => setError(e.message));
    loadReviews();
  }, [id, loadReviews]);

  if (error) {
    return (
      <div className="mx-auto max-w-shell px-4 py-20 text-center">
        <p className="text-4xl mb-3" aria-hidden>🧭</p>
        <h1 className="text-xl font-semibold text-stone-900">We couldn't find that page</h1>
        <p className="mt-2 text-sm text-stone-500">{error}</p>
        <Link to="/shop" className="inline-block mt-6 h-10 leading-10 px-5 rounded-lg bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800">
          Back to the catalog
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-shell px-4 py-10 grid lg:grid-cols-2 gap-10">
        <Skeleton className="aspect-square" />
        <div className="grid gap-4 content-start">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24" />
          <Skeleton className="h-12 w-64" />
        </div>
      </div>
    );
  }

  const off = discountPercent(product.price, product.compare_at);
  const tint = activeImage === 0 ? product.tint : TINT_VARIANTS[activeImage] || product.tint;

  const buyNow = () => {
    addToCart(product, qty);
    navigate('/cart');
  };

  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      <Breadcrumbs trail={[{ label: 'Shop', to: '/shop' }, { label: product.category, to: `/shop?category=${encodeURIComponent(product.category)}` }, { label: product.name }]} />

      <div className="mt-6 grid lg:grid-cols-2 gap-10 xl:gap-14">
        {/* ------- Gallery ------- */}
        <div>
          <motion.div key={activeImage} initial={{ opacity: 0.4, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}
            className="rounded-2xl overflow-hidden border border-stone-200 bg-white shadow-card">
            <ProductVisual icon={product.icon} tint={tint} className="aspect-square" glyphClass="text-[9rem]" />
          </motion.div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {TINT_VARIANTS.map((v, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                aria-label={`View image ${i + 1}`}
                aria-pressed={activeImage === i}
                className={`rounded-xl overflow-hidden border-2 transition-colors ${activeImage === i ? 'border-teal-600' : 'border-stone-200 hover:border-stone-300'}`}
              >
                <ProductVisual icon={product.icon} tint={v || product.tint} className="aspect-square" glyphClass="text-4xl" />
              </button>
            ))}
          </div>
        </div>

        {/* ------- Info ------- */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">{product.category}</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-stone-900 leading-tight">{product.name}</h1>
          <p className="mt-2 font-display text-lg italic text-stone-500">{product.tagline}</p>

          <a href="#reviews" className="mt-3 inline-block">
            <Rating value={product.rating} size={15} showValue count={product.reviews_count} />
          </a>

          <div className="mt-4 flex items-center gap-3">
            <Price price={product.price} compareAt={product.compare_at} size="lg" />
            {off && <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">Deal</span>}
          </div>
          <p className="mt-1 text-xs text-stone-400">Incl. taxes · {product.stock > 10 ? 'In stock' : `Only ${product.stock} left`}</p>

          <p className="mt-5 text-stone-600 leading-relaxed">{product.description}</p>

          {/* Colorway */}
          <div className="mt-6">
            <p className="text-sm font-medium text-stone-700 mb-2">Color: <span className="text-stone-500">{colorway}</span></p>
            <div className="flex gap-2">
              {COLORWAYS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColorway(c.name)}
                  aria-pressed={colorway === c.name}
                  aria-label={`Color ${c.name}`}
                  className={`w-9 h-9 rounded-full border-2 p-0.5 transition-colors ${colorway === c.name ? 'border-teal-600' : 'border-stone-200 hover:border-stone-300'}`}
                >
                  <span className="block w-full h-full rounded-full border border-stone-300/50" style={{ background: c.dot }} />
                </button>
              ))}
            </div>
          </div>

          {/* Purchase row */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <QuantityStepper value={qty} onChange={setQty} max={product.stock} />
            <Button size="lg" className="grow sm:grow-0 sm:min-w-44"
              onClick={() => { addToCart(product, qty); setCartOpen(true); }}>
              Add to cart · {money(product.price * qty)}
            </Button>
            <Button size="lg" variant="dark" onClick={buyNow}>Buy now</Button>
          </div>

          {/* Delivery info */}
          <div className="mt-8 rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
            {[
              ['M3 7h11v8H3zM14 10h3l3 3v2h-6zM6.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z', 'Free 2–4 day delivery', 'Free on orders over $50, tracked end to end.'],
              ['M12 3l7 3v5c0 4.4-3 8.4-7 9.5C8 19.4 5 15.4 5 11V6z', '2-year warranty', 'Covers every manufacturing defect.'],
              ['M4 9a8 8 0 1 1 2.3 5.7M4 9V4m0 5h5', '30-day returns', 'Full refund, free return label.'],
            ].map(([icon, title, text]) => (
              <div key={title} className="flex gap-3 px-4 py-3">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={icon} />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-stone-900">{title}</p>
                  <p className="text-[13px] text-stone-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ------- Reviews ------- */}
      <section id="reviews" className="mt-16 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 mb-1.5">Customer reviews</p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
              {product.rating.toFixed(1)} out of 5
            </h2>
            <div className="mt-1.5 flex items-center gap-2">
              <Rating value={product.rating} size={15} />
              <span className="text-sm text-stone-500">{product.reviews_count} global ratings</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
          <ul className="grid gap-3">
            {reviews === null
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)
              : reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
            {reviews && reviews.length === 0 && (
              <li className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
                No reviews yet — be the first to share your experience.
              </li>
            )}
          </ul>
          <div className="lg:sticky lg:top-28">
            <ReviewForm productId={product.id} onPosted={() => { loadReviews(); toast('Thanks! Your review was posted.'); }} />
          </div>
        </div>
      </section>
    </div>
  );
}
