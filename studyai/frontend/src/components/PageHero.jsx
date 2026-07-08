export default function PageHero({ title, subtitle, badge, children }) {
  return (
    <div className="page-hero">
      <div className="page-hero-bg" />
      <div className="page-hero-content">
        {badge && <span className="hero-badge">{badge}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
