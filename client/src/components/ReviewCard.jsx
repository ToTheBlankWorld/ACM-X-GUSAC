import ProductVisual from './ProductVisual.jsx';
import Rating from './Rating.jsx';
import { shortDate } from '../lib/format.js';

/**
 * Customer review card. The body is rendered either as an HTML sink or as
 * a plain text node, strictly following the contract delivered by the API
 * (review.html vs review.text). The UI itself carries no security labels.
 */
export default function ReviewCard({ review }) {
  const initials = String(review.author || '?').trim().slice(0, 2).toUpperCase();
  return (
    <li className="rounded-xl border border-stone-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-xs font-bold flex items-center justify-center shrink-0" aria-hidden>
          {initials}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-900 truncate">{review.author}</p>
          <p className="text-xs text-stone-400">{shortDate(review.created_at)}</p>
        </div>
        <span className="ml-auto shrink-0">
          <Rating value={review.rating} size={13} />
        </span>
      </div>
      {review.html != null ? (
        /* Unsafe sink — only used when the backend delivers raw content. */
        <div className="mt-3 text-sm text-stone-600 leading-relaxed review-body" dangerouslySetInnerHTML={{ __html: review.html }} />
      ) : (
        /* Plain text node — the browser renders this as data. */
        <p className="mt-3 text-sm text-stone-600 leading-relaxed whitespace-pre-wrap break-words">
          {review.text ?? review.content}
        </p>
      )}
    </li>
  );
}
