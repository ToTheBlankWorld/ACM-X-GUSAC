import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';

const NAV_LINKS = [
  { to: '/shop', label: 'Shop' },
  { to: '/shop?deals=1', label: 'Deals' },
  { to: '/shop?sort=new', label: 'New arrivals' },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="NovaCart home">
      <svg viewBox="0 0 24 24" className="w-8 h-8" aria-hidden>
        <rect width="24" height="24" rx="6" fill="#0d9488" />
        <path d="M5 6h2l1.6 8.5a1.5 1.5 0 0 0 1.5 1.2h6.9a1.5 1.5 0 0 0 1.5-1.2L20 9H8" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10.5" cy="19" r="1.3" fill="white" />
        <circle cx="16.5" cy="19" r="1.3" fill="white" />
      </svg>
      <span className="text-lg font-bold tracking-tight text-stone-900">
        Nova<span className="text-teal-700">Cart</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { cartCount, setCartOpen, user } = useStore();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
    setMenuOpen(false);
  };

  const linkCls = ({ isActive }) =>
    `relative text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors px-1 py-2 ${
      isActive ? 'text-stone-900 after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-teal-600' : ''
    }`;

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-teal-900 text-teal-50 text-center text-xs py-1.5 px-4">
        Free shipping on orders over $50 · 30-day free returns
      </div>
      <div className="bg-white/95 backdrop-blur border-b border-stone-200">
        <div className="mx-auto max-w-shell px-4 h-16 flex items-center gap-4">
          <Logo />

          <nav className="hidden lg:flex items-center gap-5 ml-4" aria-label="Main">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.label} to={l.to} end={l.to === '/shop'} className={linkCls}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <form onSubmit={submitSearch} className="hidden md:block ml-auto" role="search">
            <label className="relative block">
              <span className="sr-only">Search products</span>
              <svg viewBox="0 0 20 20" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="9" cy="9" r="6" /><path d="m14 14 4 4" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                className="w-52 lg:w-60 rounded-full bg-stone-100 border border-transparent py-2 pl-9 pr-4 text-sm placeholder:text-stone-400 focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition"
              />
            </label>
          </form>

          <div className="ml-auto md:ml-2 flex items-center gap-1">
            <Link
              to={user ? '/account' : '/login'}
              className="hidden sm:inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            >
              <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <circle cx="10" cy="6.5" r="3.2" /><path d="M3.5 17c1-3.2 3.6-4.8 6.5-4.8s5.5 1.6 6.5 4.8" strokeLinecap="round" />
              </svg>
              {user ? user.full_name.split(' ')[0] : 'Sign in'}
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              aria-label={`Open cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <path d="M4 5h2l1.7 9.2a1.6 1.6 0 0 0 1.6 1.3h7.4a1.6 1.6 0 0 0 1.6-1.3L20 8H7" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10.5" cy="19.5" r="1.4" /><circle cx="17" cy="19.5" r="1.4" />
              </svg>
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              className="lg:hidden inline-flex p-2 rounded-lg text-stone-600 hover:bg-stone-100"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-stone-200 bg-white px-4 py-3 grid gap-1">
            <form onSubmit={submitSearch} className="md:hidden mb-2" role="search">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                className="w-full rounded-full bg-stone-100 py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                aria-label="Search products"
              />
            </form>
            {NAV_LINKS.map((l) => (
              <Link key={l.label} to={l.to} onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">
                {l.label}
              </Link>
            ))}
            <Link to={user ? '/account' : '/login'} onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">
              {user ? 'My account' : 'Sign in'}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
