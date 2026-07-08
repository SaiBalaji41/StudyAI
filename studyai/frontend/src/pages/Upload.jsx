import { useCallback, useState } from 'react';
import { uploadMaterial } from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHero from '../components/PageHero';

export default function Upload() {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('file');
  const { addToast } = useToast();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setLoading(true);

    try {
      const formData = new FormData();
      if (title) formData.append('title', title);

      if (activeTab === 'file') {
        if (!file) {
          setError('Please select a file to upload');
          setLoading(false);
          return;
        }
        formData.append('file', file);
      } else {
        if (!text.trim()) {
          setError('Please paste some text content');
          setLoading(false);
          return;
        }
        formData.append('text', text);
      }

      const res = await uploadMaterial(formData);
      setSuccess(res.data.material);
      setTitle('');
      setText('');
      setFile(null);
      addToast(`"${res.data.material.title}" uploaded successfully!`, 'success');
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHero badge="Upload" title="Add Study Material" subtitle="Upload PDF, DOCX, TXT files or paste text to power all AI features." />

      {error && <div className="alert alert-error">{error}</div>}
      {success && (
        <div className="alert alert-success">
          Successfully uploaded "{success.title}" ({success.word_count} words)
        </div>
      )}

      <div className="card">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'file' ? 'active' : ''}`}
            onClick={() => setActiveTab('file')}
          >
            File Upload
          </button>
          <button
            className={`tab ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            Paste Text
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chapter 5 - Photosynthesis"
            />
          </div>

          {activeTab === 'file' ? (
            <div
              className={`dropzone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              <div className="dropzone-icon">📁</div>
              {file ? (
                <p><strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)</p>
              ) : (
                <>
                  <p>Drag & drop your file here, or click to browse</p>
                  <p className="file-types">Supported: PDF, DOCX, TXT (max 10 MB)</p>
                </>
              )}
              <input
                id="file-input"
                type="file"
                accept=".pdf,.docx,.txt"
                style={{ display: 'none' }}
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Paste your study content</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your notes, textbook content, or study material here (minimum 50 characters)..."
                rows={12}
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Uploading...' : 'Upload Material'}
          </button>
        </form>
      </div>
    </div>
  );
}
