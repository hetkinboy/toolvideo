import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import ProjectSwitcher from '../../shared/ProjectSwitcher';

const navGroups = [
  {
    items: [
      { path: '/', label: 'Dashboard', icon: '📊' },
    ],
  },
  {
    title: 'STORY',
    items: [
      { path: '/bible', label: 'Project Bible', icon: '📖' },
      { path: '/outline-studio', label: 'Master Outline (AI)', icon: '🚀' },
      { path: '/arcs', label: 'Story Arcs', icon: '🎯' },
      { path: '/episodes', label: 'Episodes', icon: '🎬' },
      { path: '/scenes', label: 'Scenes', icon: '🎭' },
    ],
  },
  {
    title: 'WORLD',
    items: [
      { path: '/characters', label: 'Characters', icon: '👤' },
      { path: '/locations', label: 'Locations', icon: '🏛️' },
      { path: '/items', label: 'Items', icon: '⚔️' },
      { path: '/factions', label: 'Factions', icon: '🏴' },
    ],
  },
  {
    title: 'CONTINUITY',
    items: [
      { path: '/story-state', label: 'Story State', icon: '📸' },
      { path: '/story-threads', label: 'Story Threads', icon: '🧵' },
      { path: '/foreshadowing', label: 'Foreshadowing', icon: '🔮' },
      { path: '/knowledge', label: 'Knowledge Matrix', icon: '🧠' },
    ],
  },
  {
    title: 'PRODUCTION',
    items: [
      { path: '/shots', label: 'Shots', icon: '📷' },
      { path: '/storyboard', label: 'Storyboard', icon: '🖼️' },
      { path: '/assets', label: 'Assets', icon: '📁' },
    ],
  },
  {
    title: 'AI TOOLS',
    items: [
      { path: '/prompt-studio', label: 'Prompt Studio', icon: '✨' },
      { path: '/prompt-library', label: 'Prompt Library', icon: '📚' },
      { path: '/prompt-history', label: 'Prompt History', icon: '📜' },
    ],
  },
  {
    title: 'PROJECT',
    items: [
      { path: '/settings', label: 'Settings', icon: '⚙️' },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">🎬</div>
        <span className="sidebar__logo-text">AI Video Studio</span>
      </div>

      <div style={{ padding: '0 var(--space-3) var(--space-3) var(--space-3)' }}>
        <ProjectSwitcher />
      </div>

      <nav className="sidebar__nav">
        {navGroups.map((group, gi) => (
          <div className="sidebar__group" key={gi}>
            {group.title && (
              <div className="sidebar__group-title">{group.title}</div>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
                }
                end={item.path === '/'}
              >
                <span className="sidebar__item-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
