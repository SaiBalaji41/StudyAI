import { useEffect, useState, useRef } from 'react';
import { getMaterials, chatWithTutor, getChatHistory, clearChat } from '../services/api';
import MaterialSelector from '../components/MaterialSelector';
import PageHero from '../components/PageHero';
import { MessageSquare } from 'lucide-react';

const SUGGESTIONS = [
  'Explain the main concepts in simple terms',
  'What are the most important topics to focus on?',
  'Give me an analogy to understand this better',
  'What questions might appear on an exam?',
];

export default function Tutor() {
  const [materials, setMaterials] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    getMaterials().then((res) => setMaterials(res.data.materials)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    getChatHistory(selectedId)
      .then((res) => setMessages(res.data.messages || []))
      .catch(() => setMessages([]));
  }, [selectedId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

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

  return (
    <div>
      <PageHero badge="AI Tutor" title="Chat with StudyAI Tutor" subtitle="Ask questions about your study materials and get personalized explanations." />

      <div className="card" style={{ marginBottom: '1rem' }}>
        <MaterialSelector materials={materials} selectedId={selectedId} onChange={setSelectedId} />
      </div>

      <div className="card chat-container">
        <div className="chat-messages">
          {messages.length === 0 && !thinking && (
            <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
              <div className="empty-state-icon" style={{ color: 'var(--text-muted)' }}><MessageSquare size={48} /></div>
              <p style={{ color: 'var(--text-muted)' }}>Select a material from the sidebar to start a tutoring session.</p>
              {selectedId && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="btn btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => sendMessage(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>{m.content}</div>
          ))}
          {thinking && (
            <div className="chat-bubble assistant">
              <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-bar">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={selectedId ? 'Ask anything about your material...' : 'Select a material first'}
            disabled={!selectedId || thinking}
          />
          <button className="btn btn-primary" onClick={() => sendMessage()} disabled={!selectedId || thinking || !input.trim()}>
            Send
          </button>
          {messages.length > 0 && (
            <button className="btn btn-secondary" onClick={handleClear}>Clear</button>
          )}
        </div>
      </div>
    </div>
  );
}
