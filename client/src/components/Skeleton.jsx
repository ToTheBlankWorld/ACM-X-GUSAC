export default function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden />;
}
