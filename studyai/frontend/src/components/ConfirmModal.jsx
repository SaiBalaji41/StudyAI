import React from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', loading = false }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="card" style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '24px',
        padding: '2rem',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        position: 'relative',
        animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--danger)' }}>
            <AlertTriangle size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1rem' }}>
            {message}
          </p>
          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <button 
              className="btn btn-secondary" 
              onClick={onClose} 
              style={{ flex: 1, padding: '0.75rem', borderRadius: '16px' }}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              className="btn" 
              onClick={onConfirm} 
              style={{ flex: 1, padding: '0.75rem', borderRadius: '16px', background: 'var(--danger)', color: 'white', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
              disabled={loading}
            >
              {loading ? <Loader2 size={18} className="spin" /> : confirmText}
            </button>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}} />
    </div>
  );
}
