import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '../api.js';
import { useStore } from '../context/StoreContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/Button.jsx';

const DEMO_ACCOUNTS = [
  ['sarah_chen', 'Sunshine#88'],
  ['mike_torres', 'Turbo#5512'],
];

// Presentation timings for the sign-in transition. The API request itself is
// never delayed: the request and the minimum loading hold run in parallel, so
// the button stays in its loading state only for whichever lasts longer.
const MIN_LOADING_MS = 500;
const SUCCESS_HOLD_MS = 180;
const EXIT_MS = 160;

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { signInUser } = useStore();
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [stage, setStage] = useState('idle'); // idle | loading | success | exiting

  const submittingRef = useRef(false);
  const aliveRef = useRef(true);
  const timersRef = useRef([]);

  useEffect(() => {
    // StrictMode mounts, cleans up, then remounts — re-arm on every mount so
    // the flag only goes false when the form really unmounts.
    aliveRef.current = true;
    const timers = timersRef.current;
    return () => {
      aliveRef.current = false;
      timers.forEach(clearTimeout);
    };
  }, []);

  const wait = (ms) => new Promise((resolve) => {
    const id = setTimeout(() => {
      const i = timersRef.current.indexOf(id);
      if (i !== -1) timersRef.current.splice(i, 1);
      resolve();
    }, ms);
    timersRef.current.push(id);
  });

  const busy = stage !== 'idle';
  const succeeded = stage === 'success' || stage === 'exiting';

  const submit = async (e) => {
    e.preventDefault();
    // Synchronous guard: a second click in the same tick cannot start a second request.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError('');
    setStage('loading');

    const startedAt = performance.now();
    try {
      const data = await api.post('/store/login', { username: username.trim(), password });

      const remaining = MIN_LOADING_MS - (performance.now() - startedAt);
      if (remaining > 0) await wait(remaining);
      if (!aliveRef.current) return;
      setStage('success');

      await wait(SUCCESS_HOLD_MS);
      if (!aliveRef.current) return;
      setStage('exiting');

      await wait(reduced ? 0 : EXIT_MS);
      if (!aliveRef.current) return;
      signInUser(data.user);
      toast(`Welcome back, ${data.user.full_name.split(' ')[0]}!`);
      navigate('/account');
    } catch (err) {
      if (!aliveRef.current) return;
      // Failures surface immediately: no hold, no animation, try again right away.
      setError(err.message || "That username and password don't match our records.");
      setStage('idle');
    } finally {
      submittingRef.current = false;
    }
  };


  return (
    <div className="mx-auto max-w-shell px-4 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={stage === 'exiting' ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
          transition={{ duration: stage === 'exiting' ? (reduced ? 0 : 0.16) : 0.4, ease: stage === 'exiting' ? 'easeIn' : 'easeOut' }}
          className="mx-auto w-full max-w-sm"
        >
        <div className="text-center mb-8">
          <svg viewBox="0 0 24 24" className="w-12 h-12 mx-auto" aria-hidden>
            <rect width="24" height="24" rx="6" fill="#0d9488" />
            <path d="M5 6h2l1.6 8.5a1.5 1.5 0 0 0 1.5 1.2h6.9a1.5 1.5 0 0 0 1.5-1.2L20 9H8" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="10.5" cy="19" r="1.3" fill="white" />
            <circle cx="16.5" cy="19" r="1.3" fill="white" />
          </svg>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-stone-900">Welcome back</h1>
          <p className="mt-1.5 text-sm text-stone-500">Sign in to your NovaCart account</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card grid gap-4">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-stone-700">Email or username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="you@example.com"
              className="h-11 rounded-lg border border-stone-300 px-3 text-sm placeholder:text-stone-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-stone-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 rounded-lg border border-stone-300 px-3 text-sm placeholder:text-stone-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              required
            />
          </label>

          {error && (
            <motion.p initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-[13px] text-red-700" role="alert">
              {error}
            </motion.p>
          )}

          <Button type="submit" size="lg" loading={busy} spinner={stage === 'loading'} disabled={busy} className="w-full">
            {succeeded ? (
              <motion.span
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: reduced ? 0 : 0.18, ease: 'easeOut' }}
                className="inline-flex items-center gap-2"
              >
                <CheckIcon />
                Signed in
              </motion.span>
            ) : stage === 'loading' ? (
              'Signing in…'
            ) : (
              'Sign in'
            )}
          </Button>

          <div className="flex items-center justify-between text-[13px]">
            <button type="button" onClick={() => toast('Password reset is not available in this environment.', 'info')}
              className="text-stone-500 hover:text-stone-800">
              Forgot password?
            </button>
            <button type="button" onClick={() => toast('New account registration opens soon.', 'info')}
              className="font-semibold text-teal-700 hover:text-teal-800">
              Create account
            </button>
          </div>
        </form>

        <div className="mt-5 rounded-xl border border-stone-200 bg-stone-100/70 px-4 py-3 text-xs text-stone-500 leading-relaxed">
          <p className="font-semibold text-stone-600 mb-0.5">Demo accounts</p>
          {DEMO_ACCOUNTS.map(([u, p]) => (
            <p key={u} className="font-mono text-[11px]">
              {u} · {p}
              <button
                type="button"
                onClick={() => { setUsername(u); setPassword(p); }}
                className="ml-2 not-italic font-sans font-semibold text-teal-700 hover:text-teal-800"
              >
                use
              </button>
            </p>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
