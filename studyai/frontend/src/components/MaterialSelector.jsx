import Select from './Select';

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
      <div className="select-wrapper" style={{ margin: 0 }}>
        <Select 
          value={selectedId}
          onChange={onChange}
          placeholder="-- Select a material --"
          options={materials.map(m => ({
            value: m.id,
            label: `${m.title} (${m.source_type.toUpperCase()}, ${m.word_count} words)`
          }))}
        />
      </div>
    </div>
  );
}
