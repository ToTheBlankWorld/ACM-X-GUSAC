/**
 * Consistent product visual: soft tinted tile, dotted texture, radial
 * highlight and a large product glyph. Deliberate placeholder art that
 * keeps the catalog looking intentional without fake photography.
 */
export default function ProductVisual({ icon, tint = 'from-teal-100 to-cyan-100', className = '', glyphClass = 'text-6xl' }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${tint} ${className}`}>
      <div className="absolute inset-0 tile-dots opacity-40" aria-hidden />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 90% at 30% 20%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 60%)' }}
        aria-hidden
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${glyphClass} drop-shadow-sm select-none`} role="img" aria-label={icon}>
          {icon}
        </span>
      </div>
    </div>
  );
}
