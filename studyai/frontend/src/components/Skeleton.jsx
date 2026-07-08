export default function Skeleton({ width = '100%', height = '20px', className = '' }) {
  return <div className={`skeleton ${className}`} style={{ width, height }} />;
}

export function SkeletonCard() {
  return (
    <div className="card skeleton-card">
      <Skeleton height="24px" width="60%" />
      <Skeleton height="16px" width="40%" />
      <Skeleton height="40px" />
    </div>
  );
}
