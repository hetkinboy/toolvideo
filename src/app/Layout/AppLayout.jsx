import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useStore } from '../../core/store';

const breadcrumbMap = {
  '/': ['Dashboard'],
  '/bible': ['Story', 'Project Bible'],
  '/arcs': ['Story', 'Story Arcs'],
  '/episodes': ['Story', 'Episodes'],
  '/scenes': ['Story', 'Scenes'],
  '/characters': ['World', 'Characters'],
  '/locations': ['World', 'Locations'],
  '/items': ['World', 'Items'],
  '/factions': ['World', 'Factions'],
  '/story-state': ['Continuity', 'Story State'],
  '/story-threads': ['Continuity', 'Story Threads'],
  '/foreshadowing': ['Continuity', 'Foreshadowing'],
  '/knowledge': ['Continuity', 'Knowledge Matrix'],
  '/shots': ['Production', 'Shots'],
  '/storyboard': ['Production', 'Storyboard'],
  '/assets': ['Production', 'Assets'],
  '/prompt-studio': ['AI Tools', 'Prompt Studio'],
  '/prompt-library': ['AI Tools', 'Prompt Library'],
  '/prompt-history': ['AI Tools', 'Prompt History'],
  '/settings': ['Project', 'Settings'],
};

export default function AppLayout() {
  const location = useLocation();
  const loadProjects = useStore((s) => s.loadProjects);
  const currentProject = useStore((s) => s.currentProject);

  useEffect(() => {
    loadProjects();
  }, []);

  const basePath = '/' + (location.pathname.split('/')[1] || '');
  const breadcrumbs = [
    currentProject?.name || 'AI Video Studio',
    ...(breadcrumbMap[basePath] || [location.pathname]),
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <Header breadcrumbs={breadcrumbs} />
      <main className="workspace">
        <Outlet />
      </main>
    </div>
  );
}
