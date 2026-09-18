import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStore } from '../../core/store';
import ProjectSwitcher from '../../shared/ProjectSwitcher';

export default function Header({ breadcrumbs = [] }) {
  const saveStatus = useStore((s) => s.saveStatus);
  const performSearch = useStore((s) => s.performSearch);
  const searchResults = useStore((s) => s.searchResults);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const searchRef = useRef(null);

  const statusLabel = {
    saved: 'Saved',
    saving: 'Saving...',
    error: 'Save Failed',
  };

  const handleSearch = useCallback((e) => {
    const val = e.target.value;
    setSearchValue(val);
    if (val.length >= 2) {
      performSearch(val);
      setSearchOpen(true);
    } else {
      setSearchOpen(false);
    }
  }, [performSearch]);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <header className="header">
      <div className="flex items-center gap-3">
        <ProjectSwitcher />
        <div className="header__breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="header__breadcrumb-sep">/</span>}
              {i === breadcrumbs.length - 1 ? (
                <span className="header__breadcrumb-current">{crumb}</span>
              ) : (
                <span>{crumb}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="header__actions">
        <div className="search-box">
          <span className="search-box__icon">🔍</span>
          <input
            ref={searchRef}
            className="search-box__input"
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={handleSearch}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
          />
          <span className="search-box__shortcut">⌘K</span>

          {searchOpen && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              maxHeight: '320px',
              overflowY: 'auto',
              zIndex: 'var(--z-tooltip)',
            }}>
              {searchResults.map((r) => (
                <div key={r.id} className="list-item" style={{ fontSize: 'var(--text-sm)' }}>
                  <span style={{ opacity: 0.5, fontSize: 'var(--text-xs)', width: 70, textTransform: 'uppercase' }}>
                    {r.type}
                  </span>
                  <span style={{ color: 'var(--text-primary)' }}>{r.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="header__save-status">
          <span className={`header__save-dot ${saveStatus === 'saving' ? 'header__save-dot--saving' : ''}`} />
          {statusLabel[saveStatus]}
        </div>
      </div>
    </header>
  );
}
