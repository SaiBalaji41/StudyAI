import { useEffect, useState, useRef } from 'react';
import { 
  getMaterials, chatWithTutor, getChatHistory, clearChat,
  getSummary, getAnnotations, saveAnnotations, getInsights 
} from '../services/api';
import MaterialSelector from '../components/MaterialSelector';
import PageHero from '../components/PageHero';
import LoadingSpinner from '../components/LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import { 
  MessageSquare, Brain, Highlighter, Trash2, 
  Send, Sparkles, RefreshCw, X, PlusCircle, ExternalLink 
} from 'lucide-react';

const SUGGESTIONS = [
  'Explain the main concepts in simple terms',
  'What are the most important topics to focus on?',
  'Give me an analogy to understand this better',
  'What questions might appear on an exam?',
];

const COLORS = [
  { name: 'yellow', code: 'rgba(253, 224, 71, 0.4)' },
  { name: 'green', code: 'rgba(110, 231, 183, 0.4)' },
  { name: 'pink', code: 'rgba(244, 114, 182, 0.4)' },
  { name: 'blue', code: 'rgba(147, 197, 253, 0.4)' }
];

export default function Tutor() {
  const [materials, setMaterials] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const chatEndRef = useRef(null);

  // Left Pane states
  const [leftTab, setLeftTab] = useState('summary'); // 'summary' | 'annotations' | 'mindmap'
  const [summary, setSummary] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loadingLeft, setLoadingLeft] = useState(false);

  // Floating highlight state
  const [selection, setSelection] = useState('');
  const [selectionCoords, setSelectionCoords] = useState(null);
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [annotationComment, setAnnotationComment] = useState('');
  const [annotationColor, setAnnotationColor] = useState(COLORS[0].code);

  const notesContainerRef = useRef(null);

  useEffect(() => {
    getMaterials().then((res) => setMaterials(res.data.materials)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setSummary(null);
      setAnnotations([]);
      setInsights(null);
      return;
    }
    
    setLoadingLeft(true);
    
    // Fetch chat history
    getChatHistory(selectedId)
      .then((res) => setMessages(res.data.messages || []))
      .catch(() => setMessages([]));

    // Fetch summary, annotations and insights
    Promise.all([
      getSummary(selectedId).then(res => setSummary(res.data.summary)).catch(() => setSummary(null)),
      getAnnotations(selectedId).then(res => setAnnotations(res.data.annotations || [])).catch(() => setAnnotations([])),
      getInsights(selectedId).then(res => setInsights(res.data.insights)).catch(() => setInsights(null))
    ]).finally(() => {
      setLoadingLeft(false);
    });
  }, [selectedId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // Highlight capture logic
  const handleTextSelection = () => {
    const sel = window.getSelection();
    const text = sel.toString().trim();
    if (!text || text.length < 3) {
      setSelection('');
      setSelectionCoords(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setSelection(text);
    setSelectionCoords({
      top: window.scrollY + rect.top - 48,
      left: window.scrollX + rect.left + rect.width / 2
    });
  };

  const handleAddAnnotation = (e) => {
    e.preventDefault();
    if (!selection) return;

    const newAnn = {
      id: `ann_${Date.now()}`,
      text: selection,
      comment: annotationComment,
      color: annotationColor,
      created_at: new Date().toISOString()
    };

    const updated = [...annotations, newAnn];
    setAnnotations(updated);
    saveAnnotations(selectedId, updated).catch(() => {});

    // Reset states
    setSelection('');
    setSelectionCoords(null);
    setAnnotationComment('');
    setShowAnnotationForm(false);
    
    // Switch to annotations tab to view
    setLeftTab('annotations');
  };

  const handleDeleteAnnotation = (id) => {
    const updated = annotations.filter(a => a.id !== id);
    setAnnotations(updated);
    saveAnnotations(selectedId, updated).catch(() => {});
  };

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim() || !selectedId) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setThinking(true);
    try {
      const res = await chatWithTutor(selectedId, msg);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: err.response?.data?.error || err.message || 'Failed to get response.' }]);
    } finally {
      setThinking(false);
    }
  };

  const handleClear = async () => {
    if (!selectedId) return;
    await clearChat(selectedId);
    setMessages([]);
  };

  const askTutorAboutHighlight = (text) => {
    sendMessage(`Explain this passage: "${text}"`);
  };

  return (
    <div>
      <PageHero badge="AI Tutor Space" title="Interactive Study Workspace" subtitle="Read summary notes, highlight to annotate, visualize mind maps, and chat with AI Tutor." />

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <MaterialSelector materials={materials} selectedId={selectedId} onChange={setSelectedId} />
      </div>

      {!selectedId ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="empty-state-icon" style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}><Brain size={56} /></div>
          <h2>Access Your Learning Workspace</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Select a study material above to open the notes reader, visual mind maps, and your personal AI Tutor.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
          {/* Left Pane - Study Materials Workspace */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '650px', position: 'relative' }}>
            <div className="tabs" style={{ marginBottom: '1rem', flexShrink: 0 }}>
              <button className={`tab ${leftTab === 'summary' ? 'active' : ''}`} onClick={() => setLeftTab('summary')}>Summary Notes</button>
              <button className={`tab ${leftTab === 'annotations' ? 'active' : ''}`} onClick={() => setLeftTab('annotations')}>Highlights ({annotations.length})</button>
              <button className={`tab ${leftTab === 'mindmap' ? 'active' : ''}`} onClick={() => setLeftTab('mindmap')}>Mind Map</button>
            </div>

            {loadingLeft ? (
              <LoadingSpinner message="Loading workspace assets..." />
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                {/* Tab 1: Summary Notes */}
                {leftTab === 'summary' && (
                  <div 
                    ref={notesContainerRef}
                    onMouseUp={handleTextSelection}
                    style={{ position: 'relative', lineHeight: 1.7 }}
                    className="markdown-body"
                  >
                    {summary ? (
                      <ReactMarkdown>{summary.markdown}</ReactMarkdown>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No summaries found. Please go to Summary page to generate summary notes.</p>
                    )}

                    {/* Floating Highlight Button */}
                    {selectionCoords && !showAnnotationForm && (
                      <button
                        onClick={() => setShowAnnotationForm(true)}
                        style={{
                          position: 'absolute',
                          top: `${selectionCoords.top}px`,
                          left: `${selectionCoords.left}px`,
                          transform: 'translateX(-50%)',
                          background: 'var(--primary)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          zIndex: 100
                        }}
                      >
                        <Highlighter size={14} /> Highlight
                      </button>
                    )}

                    {/* Annotation Form Popup */}
                    {showAnnotationForm && selectionCoords && (
                      <div
                        style={{
                          position: 'absolute',
                          top: `${selectionCoords.top}px`,
                          left: `${selectionCoords.left}px`,
                          transform: 'translateX(-50%)',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: '16px',
                          padding: '1rem',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
                          width: '280px',
                          zIndex: 1000,
                          animation: 'slideUp 0.2s ease-out'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Add Highlight</span>
                          <button onClick={() => setShowAnnotationForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '8px', marginBottom: '0.5rem', maxHeight: '60px', overflowY: 'auto' }}>
                          "{selection}"
                        </p>
                        <form onSubmit={handleAddAnnotation} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <input 
                            type="text"
                            placeholder="Add a revision note/comment..."
                            value={annotationComment}
                            onChange={e => setAnnotationComment(e.target.value)}
                            required
                            style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Color:</span>
                            {COLORS.map((c) => (
                              <button
                                key={c.name}
                                type="button"
                                onClick={() => setAnnotationColor(c.code)}
                                style={{
                                  width: '18px', height: '18px', borderRadius: '50%',
                                  background: c.code, border: annotationColor === c.code ? '2px solid var(--primary-light)' : 'none',
                                  cursor: 'pointer'
                                }}
                              />
                            ))}
                          </div>
                          <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem', fontSize: '0.8rem', marginTop: '0.25rem' }}>Save Highlight</button>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Highlights */}
                {leftTab === 'annotations' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Study Highlights</h4>
                    {annotations.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Highlight text inside summary notes to create quick revision highlights and notes.
                      </p>
                    ) : (
                      annotations.map((ann) => (
                        <div 
                          key={ann.id} 
                          className="card" 
                          style={{ 
                            padding: '1rem', borderLeft: `5px solid ${ann.color || 'var(--primary)'}`,
                            background: 'var(--bg-glass)'
                          }}
                        >
                          <blockquote style={{ fontSize: '0.9rem', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                            "{ann.text}"
                          </blockquote>
                          <p style={{ fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.75rem' }}>
                            <strong>Note:</strong> {ann.comment}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              onClick={() => askTutorAboutHighlight(ann.text)}
                            >
                              <ExternalLink size={12} /> Ask AI Tutor
                            </button>
                            <button 
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                              onClick={() => handleDeleteAnnotation(ann.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab 3: Mind Map */}
                {leftTab === 'mindmap' && (
                  <div>
                    {insights?.mind_map ? (
                      <div className="mind-map" style={{ padding: '1rem' }}>
                        <div className="mind-map-center" style={{ 
                          background: 'var(--primary)', color: 'white', padding: '0.75rem 1.5rem', 
                          borderRadius: '16px', fontWeight: 'bold', display: 'inline-block',
                          boxShadow: '0 4px 15px var(--glow)'
                        }}>
                          {insights.mind_map.central_topic}
                        </div>
                        <div className="mind-map-branches" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                          {(insights.mind_map.branches || []).map((b, i) => (
                            <div key={i} className="mind-map-branch" style={{ 
                              background: 'var(--bg-glass)', border: '1px solid var(--border)',
                              padding: '1rem', borderRadius: '16px', textAlign: 'left'
                            }}>
                              <h5 style={{ color: 'var(--primary-light)', fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>{b.label}</h5>
                              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {(b.children || []).map((c, j) => <li key={j} style={{ marginBottom: '0.25rem' }}>{c}</li>)}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        <p>No mind maps generated for this material yet.</p>
                        <p style={{ fontSize: '0.8rem' }}>Visit the Insights page to analyze your notes and view mind maps.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Pane - Chat with Tutor */}
          <div className="card chat-container" style={{ height: '650px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <MessageSquare className="text-primary" /> AI Tutor Chat
              </h3>
              {messages.length > 0 && (
                <button 
                  className="btn" 
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', padding: '0.4rem 0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }} 
                  onClick={handleClear}
                >
                  <Trash2 size={14} /> Clear Chat
                </button>
              )}
            </div>

            <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1rem' }}>
              {messages.length === 0 && !thinking && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', height: '100%', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(124, 58, 237, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--primary-light)' }}>
                    <MessageSquare size={36} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 'bold' }}>Study Tutor Active</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '300px', margin: '0.25rem 0' }}>
                      Ask questions, query concepts, or select text highlights to study interactively.
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', maxWidth: '400px' }}>
                    {SUGGESTIONS.map((s) => (
                      <button key={s} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }} onClick={() => sendMessage(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`chat-bubble ${m.role}`} style={{ 
                  margin: '0.5rem 0',
                  padding: '0.75rem 1rem',
                  borderRadius: '16px',
                  maxWidth: '85%',
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  background: m.role === 'user' ? 'var(--primary)' : 'var(--bg-glass)',
                  color: m.role === 'user' ? '#fff' : 'var(--text)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                  lineHeight: 1.5,
                  fontSize: '0.925rem'
                }}>
                  {m.content}
                </div>
              ))}
              {thinking && (
                <div className="chat-bubble assistant" style={{ 
                  margin: '0.5rem 0', padding: '0.75rem 1rem', borderRadius: '16px', alignSelf: 'flex-start',
                  background: 'var(--bg-glass)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Thinking...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-input-bar" style={{ flexShrink: 0, display: 'flex', gap: '0.5rem' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask anything about your material..."
                disabled={thinking}
                style={{ 
                  flex: 1, padding: '0.75rem 1rem', 
                  background: 'var(--select-bg)', border: '1px solid var(--border)', 
                  borderRadius: '12px', color: 'var(--text)', outline: 'none'
                }}
              />
              <button 
                className="btn btn-primary" 
                onClick={() => sendMessage()} 
                disabled={thinking || !input.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', borderRadius: '12px', padding: '0.75rem 1.25rem' }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
}
