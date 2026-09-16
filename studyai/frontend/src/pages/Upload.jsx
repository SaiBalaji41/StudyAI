import { useCallback, useState } from 'react';
import { uploadMaterial } from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHero from '../components/PageHero';
import { Upload as UploadIcon, FileText, Globe, Video, File, CheckCircle2, Sparkles } from 'lucide-react';

export default function Upload() {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
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
      } else if (activeTab === 'text') {
        if (!text.trim()) {
          setError('Please paste some text content (min 50 characters)');
          setLoading(false);
          return;
        }
        formData.append('text', text);
      } else if (activeTab === 'url') {
        if (!url.trim()) {
          setError('Please provide a valid web page URL');
          setLoading(false);
          return;
        }
        formData.append('url', url.trim());
      } else if (activeTab === 'youtube') {
        if (!youtubeUrl.trim()) {
          setError('Please provide a YouTube video URL with transcripts enabled');
          setLoading(false);
          return;
        }
        formData.append('youtube_url', youtubeUrl.trim());
      }

      const res = await uploadMaterial(formData);
      setSuccess(res.data.material);
      setTitle('');
      setText('');
      setUrl('');
      setYoutubeUrl('');
      setFile(null);
      addToast('success', `"${res.data.material.title}" processed & added to library!`);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHero 
        badge="Universal Ingestion" 
        title="Add Study Material" 
        subtitle="Import PDF, DOCX, PPTX slides, images (OCR), pasted notes, web articles, or YouTube video transcripts." 
      />

      {error && <div className="alert alert-error">{error}</div>}
      {success && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={20} />
          <span>Successfully processed <strong>"{success.title}"</strong> ({success.word_count} words). Ready for AI summaries, flashcards, and quizzes!</span>
        </div>
      )}

      <div className="card">
        <div className="tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`tab ${activeTab === 'file' ? 'active' : ''}`}
            onClick={() => { setActiveTab('file'); setError(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <UploadIcon size={16} /> File / Slides / OCR
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => { setActiveTab('text'); setError(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FileText size={16} /> Paste Notes
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'url' ? 'active' : ''}`}
            onClick={() => { setActiveTab('url'); setError(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Globe size={16} /> Web Article
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'youtube' ? 'active' : ''}`}
            onClick={() => { setActiveTab('youtube'); setError(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Video size={16} /> YouTube Video
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label>Custom Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Biology Chapter 5 - Photosynthesis & Cell Respiration"
            />
          </div>

          {activeTab === 'file' && (
            <div
              className={`dropzone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
              style={{ cursor: 'pointer', padding: '2.5rem 1.5rem', textAlign: 'center' }}
            >
              <div className="dropzone-icon" style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
                <File size={40} />
              </div>
              {file ? (
                <div>
                  <p style={{ fontWeight: '600', fontSize: '1.1rem', color: 'var(--text)' }}>{file.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload
                  </p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '1.05rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Drag & drop your study file here, or click to browse
                  </p>
                  <p className="file-types" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Supported: PDF, DOCX, PPTX, TXT, PNG, JPG, JPEG (OCR Enabled) — max 10 MB
                  </p>
                </>
              )}
              <input
                id="file-input"
                type="file"
                accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg"
                style={{ display: 'none' }}
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
          )}

          {activeTab === 'text' && (
            <div className="form-group">
              <label>Paste your lecture notes, summaries, or textbook sections</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your notes, textbook content, or study material here (minimum 50 characters)..."
                rows={10}
              />
            </div>
          )}

          {activeTab === 'url' && (
            <div className="form-group">
              <label>Web Page / Article URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://en.wikipedia.org/wiki/Photosynthesis or https://arxiv.org/..."
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                StudyAI will extract and clean the core educational article text from the web page.
              </p>
            </div>
          )}

          {activeTab === 'youtube' && (
            <div className="form-group">
              <label>YouTube Video Link</label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                StudyAI will parse the spoken video lecture transcript for question generation and revision notes.
              </p>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading} 
            style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? <Sparkles size={18} className="spin" /> : <UploadIcon size={18} />}
            {loading ? 'Processing Material...' : 'Upload & Process Material'}
          </button>
        </form>
      </div>
    </div>
  );
}

