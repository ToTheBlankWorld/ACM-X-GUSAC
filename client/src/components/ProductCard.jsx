import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductVisual from './ProductVisual.jsx';
import Rating from './Rating.jsx';
import Price from './Price.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function ProductCard({ product, index = 0 }) {
  const { addToCart } = useStore();
  const { toast } = useToast();

  const quickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast(`${product.name} added to cart`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3), ease: 'easeOut' }}
    >
      <Link
        to={`/product/${product.id}`}
        className="group block rounded-xl border border-stone-200 bg-white overflow-hidden shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="relative">
          <ProductVisual
            icon={product.icon}
            tint={product.tint}
            className="aspect-[4/3]"
            glyphClass="text-6xl group-hover:scale-110 transition-transform duration-300"
          />
          <button
            onClick={quickAdd}
            aria-label={`Add ${product.name} to cart`}
            className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white border border-stone-200 shadow-card flex items-center justify-center text-stone-700 hover:bg-teal-700 hover:text-white hover:border-teal-700 transition-colors"
          >
            <svg viewBox="0 0 20 20" className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M10 4v12M4 10h12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{product.category}</p>
          <h3 className="mt-1 text-[15px] font-semibold text-stone-900 leading-snug line-clamp-2 group-hover:text-teal-800 transition-colors">
            {product.name}
          </h3>
          <div className="mt-1.5">
            <Rating value={product.rating} count={product.reviews_count} />
          </div>
          <div className="mt-2">
            <Price price={product.price} compareAt={product.compare_at} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
