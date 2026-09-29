import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { money } from '../lib/format.js';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import Button from '../components/Button.jsx';

const ORDERS = [
  { id: 'NC-1042', item: 'Quantum K8 Mechanical Keyboard', date: '2026-08-14', total: 129.99, status: 'Delivered' },
  { id: 'NC-0987', item: 'Pulsar RGB Desk Mat', date: '2026-07-02', total: 24.99, status: 'Delivered' },
  { id: 'NC-1101', item: 'Aegis Titan 20K Power Bank', date: '2026-09-19', total: 59.95, status: 'Shipped' },
];

export default function Account() {
  const { user, signOut } = useStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="mx-auto max-w-shell px-4 py-24 text-center">
        <p className="text-4xl mb-3" aria-hidden>👋</p>
        <h1 className="text-xl font-semibold text-stone-900">You're not signed in</h1>
        <p className="mt-2 text-sm text-stone-500">Sign in to see your orders and account details.</p>
        <Link to="/login" className="inline-block mt-6 h-10 leading-10 px-5 rounded-lg bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800">
          Sign in
        </Link>
      </div>
    );
  }

  const initials = user.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="mx-auto max-w-shell px-4 py-10">
      <Breadcrumbs trail={[{ label: 'My account' }]} />
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-stone-900">My account</h1>

      <div className="mt-8 grid lg:grid-cols-[300px_1fr] gap-6 items-start">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card">
          <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-lg font-bold flex items-center justify-center" aria-hidden>
            {initials}
          </span>
          <p className="mt-4 text-lg font-semibold text-stone-900">{user.full_name}</p>
          <p className="text-sm text-stone-500">@{user.username}</p>
          <p className="text-sm text-stone-500">{user.email}</p>
          <span className={`mt-3 inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${
            user.role === 'administrator' ? 'bg-teal-50 text-teal-800' : 'bg-stone-100 text-stone-500'
          }`}>
            {user.role}
          </span>
          <div className="mt-5 grid gap-2">
            <Button variant="secondary" className="w-full" onClick={() => navigate('/shop')}>Keep shopping</Button>
            <Button variant="ghost" className="w-full" onClick={() => { signOut(); toast('Signed out. See you soon!'); navigate('/'); }}>
              Sign out
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">Order history</h2>
          <div className="rounded-2xl border border-stone-200 bg-white divide-y divide-stone-100 shadow-card overflow-hidden">
            {ORDERS.map((o) => (
              <div key={o.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-stone-500">{o.id} · {o.date}</p>
                  <p className="text-sm font-medium text-stone-900 truncate">{o.item}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-stone-900">{money(o.total)}</p>
                  <p className={`text-xs font-medium ${o.status === 'Delivered' ? 'text-teal-700' : 'text-amber-700'}`}>{o.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
