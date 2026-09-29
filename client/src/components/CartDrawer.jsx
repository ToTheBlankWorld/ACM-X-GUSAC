import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { money } from '../lib/format.js';
import QuantityStepper from './QuantityStepper.jsx';
import ProductVisual from './ProductVisual.jsx';
import Button from './Button.jsx';

const FREE_SHIPPING_AT = 50;

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQty, removeFromCart, subtotal, cartCount } = useStore();

  useEffect(() => {
    if (!cartOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setCartOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [cartOpen, setCartOpen]);

  const away = Math.max(0, FREE_SHIPPING_AT - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_AT) * 100);

  return (
    <AnimatePresence>
      {cartOpen && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-900/45"
            onClick={() => setCartOpen(false)}
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-drawer flex flex-col"
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-stone-200">
              <h2 className="font-semibold text-stone-900">Your cart {cartCount > 0 && <span className="text-stone-400 font-normal">({cartCount})</span>}</h2>
              <button onClick={() => setCartOpen(false)} aria-label="Close cart"
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100">
                <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <span className="text-4xl" aria-hidden>🛒</span>
                <p className="font-medium text-stone-900">Your cart is empty</p>
                <p className="text-sm text-stone-500">Browse the catalog and find something you like.</p>
                <Button onClick={() => setCartOpen(false)} variant="secondary">Continue shopping</Button>
              </div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-stone-100">
                  <p className="text-xs text-stone-500 mb-1.5">
                    {away > 0 ? <>You're <strong className="text-stone-700">{money(away)}</strong> away from free shipping</> : '🎉 You unlocked free shipping'}
                  </p>
                  <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                    <div className="h-full rounded-full bg-teal-600 transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <ul className="flex-1 overflow-y-auto thin-scroll divide-y divide-stone-100 px-5">
                  {cart.map((item) => (
                    <li key={item.id} className="py-4 flex gap-3">
                      <ProductVisual icon={item.icon} tint={item.tint} className="w-16 h-16 rounded-lg shrink-0" glyphClass="text-2xl" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link to={`/product/${item.id}`} onClick={() => setCartOpen(false)}
                            className="text-sm font-semibold text-stone-900 leading-snug hover:text-teal-800 line-clamp-2">
                            {item.name}
                          </Link>
                          <button onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name} from cart`}
                            className="text-stone-300 hover:text-red-500 transition-colors p-0.5">
                            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                              <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">{item.category}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <QuantityStepper small value={item.qty} onChange={(q) => setQty(item.id, q)} />
                          <span className="text-sm font-semibold text-stone-900">{money(item.price * item.qty)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-stone-200 p-5 grid gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500">Subtotal</span>
                    <span className="font-semibold text-stone-900">{money(subtotal)}</span>
                  </div>
                  <p className="text-xs text-stone-400">Shipping and taxes calculated at checkout.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={() => setCartOpen(false)}>Keep shopping</Button>
                    <Link to="/cart" onClick={() => setCartOpen(false)}
                      className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-colors">
                      View cart
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
