import React from 'react';
import { useLocation } from 'react-router-dom';

export default function PlaceholderPage() {
  const location = useLocation();
  const pageName = location.pathname.slice(1).replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()) || 'Page';

  const icons = {
    '/arcs': '🎯',
    '/locations': '🏛️',
    '/items': '⚔️',
    '/factions': '🏴',
    '/story-state': '📸',
    '/foreshadowing': '🔮',
    '/knowledge': '🧠',
    '/shots': '📷',
    '/storyboard': '🖼️',
    '/assets': '📁',
    '/prompt-studio': '✨',
    '/prompt-library': '📚',
    '/prompt-history': '📜',
    '/settings': '⚙️',
  };

  const phases = {
    '/arcs': 'Phase 1',
    '/locations': 'Phase 2',
    '/items': 'Phase 2',
    '/factions': 'Phase 2',
    '/story-state': 'Phase 2',
    '/foreshadowing': 'Phase 2',
    '/knowledge': 'Phase 2',
    '/shots': 'Phase 3',
    '/storyboard': 'Phase 3',
    '/assets': 'Phase 3',
    '/prompt-studio': 'Phase 1 (coming soon)',
    '/prompt-library': 'Phase 1 (coming soon)',
    '/prompt-history': 'Phase 1 (coming soon)',
    '/settings': 'Phase 1',
  };

  return (
    <div className="empty-state" style={{ minHeight: '60vh' }}>
      <div className="empty-state__icon" style={{ fontSize: '4rem' }}>
        {icons[location.pathname] || '🚧'}
      </div>
      <div className="empty-state__title" style={{ fontSize: 'var(--text-xl)' }}>
        {pageName}
      </div>
      <div className="empty-state__desc">
        Module này sẽ được xây dựng trong {phases[location.pathname] || 'Phase tiếp theo'}.
        <br />
        Cấu trúc database đã sẵn sàng.
      </div>
      <div style={{
        marginTop: 'var(--space-4)',
        padding: 'var(--space-2) var(--space-4)',
        background: 'var(--accent-subtle)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-xs)',
        color: 'var(--accent)',
        fontWeight: 600,
      }}>
        {phases[location.pathname] || 'UPCOMING'}
      </div>
    </div>
  );
}
