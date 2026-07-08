export default function LoadingSpinner({ message = 'Generating with AI...' }) {
  return (
    <div className="loading">
      <div className="spinner" />
      <p>{message}</p>
    </div>
  );
}
