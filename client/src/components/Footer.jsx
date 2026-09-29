import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from './Modal.jsx';

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', to: '/shop' },
      { label: 'Peripherals', to: '/shop?category=Peripherals' },
      { label: 'Audio', to: '/shop?category=Audio' },
      { label: 'Displays', to: '/shop?category=Displays' },
      { label: 'Deals', to: '/shop?deals=1' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Shipping & delivery', info: 'Orders over $50 ship free. Standard delivery arrives in 2–4 business days.' },
      { label: 'Returns', info: 'Changed your mind? Return anything within 30 days for a full refund — no questions asked.' },
      { label: 'Warranty', info: 'Every NovaCart device carries a 2-year warranty covering manufacturing defects.' },
      { label: 'Contact us', info: 'Our team answers within one business day: hello@novacart.example' },
    ],
  },
];

export default function Footer() {
  const [info, setInfo] = useState(null);

  return (
    <footer className="mt-20 bg-stone-900 text-stone-300">
      <div className="mx-auto max-w-shell px-4 py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="text-lg font-bold text-white tracking-tight">Nova<span className="text-teal-400">Cart</span></p>
          <p className="mt-3 text-sm leading-relaxed text-stone-400 max-w-xs">
            Desk gear, audio and everyday tech — picked by people who use it, backed by a two-year
            warranty and 30-day returns.
          </p>
          <p className="mt-5 text-sm text-stone-400">
            {COLUMNS[1].links[3].info.split(':')[1]?.trim() || 'hello@novacart.example'}
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">{col.title}</h3>
            <ul className="grid gap-2.5 text-sm">
              {col.links.map((l) =>
                l.to ? (
                  <li key={l.label}>
                    <Link to={l.to} className="hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ) : (
                  <li key={l.label}>
                    <button onClick={() => setInfo(l)} className="text-left hover:text-white transition-colors">
                      {l.label}
                    </button>
                  </li>
                )
              )}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-stone-800">
        <div className="mx-auto max-w-shell px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <p>© 2026 NovaCart, Inc. All rights reserved.</p>
          <p className="flex items-center gap-3">
            <button onClick={() => setInfo({ label: 'Privacy Policy', info: 'NovaCart stores your cart and sign-in session on this device only. Nothing is shared with third parties.' })} className="hover:text-stone-300">Privacy Policy</button>
            <button onClick={() => setInfo({ label: 'Terms of Service', info: 'By using NovaCart you agree to use this store for lawful shopping activities only. Fictional catalog; orders are not fulfilled.' })} className="hover:text-stone-300">Terms of Service</button>
          </p>
        </div>
      </div>

      <Modal open={!!info} onClose={() => setInfo(null)} title={info?.label}>
        <p className="text-sm text-stone-600 leading-relaxed">{info?.info}</p>
      </Modal>
    </footer>
  );
}
