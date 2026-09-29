import { useState } from 'react';
import Button from './Button.jsx';
import { api } from '../api.js';

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          className="p-0.5 group"
        >
          <svg viewBox="0 0 20 20" className={`w-6 h-6 transition-colors ${n <= value ? 'text-amber-400' : 'text-stone-300 group-hover:text-amber-200'}`} fill="currentColor" aria-hidden>
            <path d="M10 1.6l2.5 5.1 5.6.8-4 4 .9 5.6L10 14.5l-5 2.6.9-5.6-4-4 5.6-.8z" />
          </svg>
        </button>
      ))}
      <span className="ml-2 text-sm text-stone-500">{value}.0</span>
    </div>
  );
}

export default function ReviewForm({ productId, onPosted }) {
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please write a few words about the product.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await api.post(`/store/products/${productId}/reviews`, {
        author: author.trim() || 'Guest',
        content: content.trim(),
        rating,
      });
      setContent('');
      setRating(5);
      onPosted?.(data.review);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-stone-200 bg-white p-5 shadow-card grid gap-4">
      <h3 className="font-semibold text-stone-900">Write a review</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-stone-700">Name</span>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="How should we call you?"
            className="h-10 rounded-lg border border-stone-300 px-3 text-sm placeholder:text-stone-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
          />
        </label>
        <div className="grid gap-1.5 text-sm">
          <span className="font-medium text-stone-700">Rating</span>
          <StarPicker value={rating} onChange={setRating} />
        </div>
      </div>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-stone-700">Your review</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="What did you like or dislike?"
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 resize-y"
        />
      </label>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <div>
        <Button type="submit" disabled={busy}>{busy ? 'Posting…' : 'Post Review'}</Button>
      </div>
    </form>
  );
}
