import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function Select({ value, onChange, options, placeholder = 'Select an option', className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={`custom-select-container ${className}`} style={{ position: 'relative', minWidth: '200px' }}>
      <div 
        className="custom-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 1rem',
          background: 'var(--select-bg)',
          border: '1px solid',
          borderColor: isOpen ? 'var(--primary)' : 'var(--border)',
          borderRadius: '16px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontSize: '0.9rem',
          color: selectedOption ? 'var(--text)' : 'var(--text-muted)'
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
      </div>

      {isOpen && (
        <div 
          className="custom-select-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.5rem',
            background: 'var(--bg-card)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 1000,
            maxHeight: '250px',
            overflowY: 'auto',
            animation: 'fadeInUp 0.2s ease-out'
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
              No options available
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: '0.5rem', margin: 0 }}>
              {options.map((opt) => (
                <li 
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.9rem',
                    color: opt.value === value ? 'var(--primary-light)' : 'var(--text)',
                    background: opt.value === value ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (opt.value !== value) e.currentTarget.style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (opt.value !== value) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {opt.label}
                  {opt.value === value && <Check size={16} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
