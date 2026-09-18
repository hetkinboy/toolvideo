import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../core/store';
import CreateProjectModal from './CreateProjectModal';

export default function ProjectSwitcher({ compact = false }) {
  const projects = useStore((s) => s.projects);
  const currentProject = useStore((s) => s.currentProject);
  const switchProject = useStore((s) => s.switchProject);

  const [open, setOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        className="btn btn--secondary"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: compact ? '4px 10px' : '6px 12px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          maxWidth: 240,
          textAlign: 'left',
        }}
        title="Bấm để chuyển đổi giữa các dự án"
      >
        <span style={{ fontSize: '15px' }}>🎬</span>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {currentProject?.name || 'Chọn dự án...'}
          </div>
          {!compact && (
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {currentProject?.target_platform} • {currentProject?.aspect_ratio}
            </div>
          )}
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '4px' }}>▼</span>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: 290,
            zIndex: 1000,
            padding: 'var(--space-2)',
            boxShadow: '0 16px 36px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08)',
            background: 'rgba(19, 19, 28, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div className="flex justify-between items-center" style={{ padding: '6px 8px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Danh Sách Dự Án ({projects.length})
            </span>
            <span className="badge badge--primary" style={{ fontSize: '10px', padding: '1px 6px' }}>Studio</span>
          </div>

          <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px 0' }}>
            {projects.map((p) => {
              const isSelected = p.id === currentProject?.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    switchProject(p.id);
                    setOpen(false);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div className="flex justify-between items-center">
                    <strong style={{ fontSize: '13px', color: isSelected ? '#a5b4fc' : 'var(--text-primary)' }}>
                      {p.name}
                    </strong>
                    {isSelected && (
                      <span className="badge badge--success" style={{ fontSize: '9px', padding: '1px 6px' }}>
                        ĐANG CHỌN
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {p.genre || 'Chưa định genre'} • {p.target_platform}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', marginTop: '2px' }}>
            <button
              className="btn btn--primary btn--sm w-full"
              onClick={() => {
                setOpen(false);
                setShowCreateModal(true);
              }}
            >
              + Tạo Dự Án Mới
            </button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
