export default function MaterialSelector({ materials, selectedId, onChange, label = 'Select Material' }) {
  if (!materials.length) {
    return (
      <div className="alert alert-info">
        No materials uploaded yet. Go to Upload to add study material first.
      </div>
    );
  }

  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="select-wrapper">
        <select value={selectedId} onChange={(e) => onChange(e.target.value)}>
          <option value="">-- Select a material --</option>
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title} ({m.source_type.toUpperCase()}, {m.word_count} words)
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
