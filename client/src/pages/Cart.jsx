import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { money } from '../lib/format.js';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import ProductVisual from '../components/ProductVisual.jsx';
import QuantityStepper from '../components/QuantityStepper.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';

const FREE_SHIPPING_AT = 50;
const SHIPPING_FLAT = 4.99;

export default function Cart() {
  const { cart, setQty, removeFromCart, subtotal, clearCart } = useStore();
  const { toast } = useToast();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;
  const away = Math.max(0, FREE_SHIPPING_AT - subtotal);

  const checkout = () => {
    setCheckoutOpen(false);
    toast('This environment does not process payments — your cart was saved.', 'info', 4500);
  };

  return (
    <div className="mx-auto max-w-shell px-4 py-10">
      <Breadcrumbs trail={[{ label: 'Cart' }]} />
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-stone-900">Shopping cart</h1>
      <p className="mt-1 text-sm text-stone-500">{cart.length === 0 ? 'Your cart is empty.' : `${cart.length} item${cart.length === 1 ? '' : 's'} in your cart`}</p>

      {cart.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-white p-14 text-center">
          <p className="text-4xl mb-3" aria-hidden>🛒</p>
          <p className="font-semibold text-stone-900">Nothing here yet</p>
          <p className="mt-1 text-sm text-stone-500">Find something you love in the catalog.</p>
          <Link to="/shop" className="inline-block mt-6 h-10 leading-10 px-5 rounded-lg bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* Items */}
          <ul className="grid gap-3">
            {cart.map((item) => (
              <li key={item.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-card flex gap-4">
                <Link to={`/product/${item.id}`} className="shrink-0">
                  <ProductVisual icon={item.icon} tint={item.tint} className="w-20 h-20 rounded-lg" glyphClass="text-3xl" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/product/${item.id}`} className="text-[15px] font-semibold text-stone-900 hover:text-teal-800 leading-snug line-clamp-2">
                        {item.name}
                      </Link>
                      <p className="text-xs text-stone-400 mt-0.5">{item.category}</p>
                    </div>
                    <p className="font-semibold text-stone-900 whitespace-nowrap">{money(item.price * item.qty)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <QuantityStepper small value={item.qty} onChange={(q) => setQty(item.id, q)} />
                    <button onClick={() => removeFromCart(item.id)} className="text-[13px] font-medium text-stone-400 hover:text-red-600 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
            <li className="flex justify-between items-center px-1 pt-1">
              <Link to="/shop" className="text-sm font-semibold text-teal-700 hover:text-teal-800">← Continue shopping</Link>
              <button onClick={clearCart} className="text-[13px] font-medium text-stone-400 hover:text-red-600 transition-colors">Clear cart</button>
            </li>
          </ul>

          {/* Summary */}
          <aside className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card lg:sticky lg:top-28" aria-label="Order summary">
            <h2 className="font-semibold text-stone-900">Order summary</h2>
            <dl className="mt-4 grid gap-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Subtotal</dt>
                <dd className="font-medium text-stone-900">{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Shipping</dt>
                <dd className="font-medium text-stone-900">{shipping === 0 ? <span className="text-teal-700 font-semibold">Free</span> : money(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-2.5 mt-1">
                <dt className="font-semibold text-stone-900">Total</dt>
                <dd className="font-bold text-stone-900 text-base">{money(total)}</dd>
              </div>
            </dl>
            {away > 0 && (
              <p className="mt-3 text-xs text-stone-500">Add <strong className="text-stone-700">{money(away)}</strong> more for free shipping.</p>
            )}
            <Button size="lg" className="w-full mt-5" onClick={() => setCheckoutOpen(true)}>Checkout</Button>
            <p className="mt-3 text-[11px] text-center text-stone-400">Secure checkout · Major cards accepted</p>
          </aside>
        </div>
      )}

      <Modal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        title="Checkout"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCheckoutOpen(false)}>Close</Button>
            <Button onClick={checkout}>Got it</Button>
          </div>
        }
      >
        <p className="text-sm text-stone-600 leading-relaxed">
          Online payments aren't available in this environment, so checkout stops here. Your cart is saved
          on this device and will be here when you come back.
        </p>
      </Modal>
    </div>
  );
}
