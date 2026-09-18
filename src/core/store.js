/**
 * AI Video Studio — Global Store (Zustand)
 * Quản lý project state, active entities, UI state
 */

import { create } from 'zustand';
import { api } from './api';

export const useStore = create((set, get) => ({
  // ============================================================
  // Project State
  // ============================================================
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  loading: false,
  error: null,

  setCurrentProject: (project) => {
    if (project) {
      localStorage.setItem('active_project_id', project.id);
    }
    set({ currentProject: project });
  },

  switchProject: (projectId) => {
    const p = get().projects.find(x => x.id === projectId);
    if (!p) return;
    localStorage.setItem('active_project_id', p.id);
    set({ currentProject: p });

    // Reload all dependent data for the new project
    get().loadDashboard();
    get().loadCharacters();
    get().loadEpisodes();
    get().loadScenes();
    get().loadStoryArcs();
    get().loadLocations();
    get().loadItems();
    get().loadFactions();
    get().loadStoryThreads();
    get().loadForeshadows();
    get().loadKnowledgeMatrix();
    get().loadStoryStateSnapshots();
    get().loadPrompts();
  },

  createProject: async (data) => {
    set({ loading: true });
    try {
      const created = await api.createProject(data);
      const projects = await api.getProjects();
      set({ projects, loading: false });
      get().switchProject(created.id);
      return created;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  deleteProject: async (projectId) => {
    set({ loading: true });
    try {
      await api.deleteProject(projectId);
      const projects = await api.getProjects();
      set({ projects, loading: false });
      if (get().currentProject?.id === projectId) {
        if (projects.length > 0) {
          get().switchProject(projects[0].id);
        } else {
          set({ currentProject: null });
        }
      }
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  loadProjects: async () => {
    set({ loading: true });
    try {
      const projects = await api.getProjects();
      set({ projects, loading: false });

      // Check persisted project id
      const savedId = localStorage.getItem('active_project_id');
      const found = projects.find(p => p.id === savedId);
      if (found) {
        set({ currentProject: found });
      } else if (projects.length > 0 && !get().currentProject) {
        set({ currentProject: projects[0] });
        localStorage.setItem('active_project_id', projects[0].id);
      }
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  // ============================================================
  // Dashboard
  // ============================================================
  dashboardData: null,
  loadDashboard: async () => {
    const project = get().currentProject;
    if (!project) return;
    try {
      const data = await api.getDashboard(project.id);
      set({ dashboardData: data });
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ============================================================
  // Characters
  // ============================================================
  characters: [],
  loadCharacters: async () => {
    const project = get().currentProject;
    if (!project) return;
    try {
      const characters = await api.getCharacters(project.id);
      set({ characters });
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ============================================================
  // Episodes
  // ============================================================
  episodes: [],
  loadEpisodes: async () => {
    const project = get().currentProject;
    if (!project) return;
    try {
      const episodes = await api.getEpisodes(project.id);
      set({ episodes });
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ============================================================
  // Scenes
  // ============================================================
  scenes: [],
  loadScenes: async () => {
    const project = get().currentProject;
    if (!project) return;
    try {
      const scenes = await api.getScenes(project.id);
      set({ scenes });
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ============================================================
  // Story Arcs
  // ============================================================
  storyArcs: [],
  loadStoryArcs: async () => {
    const project = get().currentProject;
    if (!project) return;
    try {
      const storyArcs = await api.getStoryArcs(project.id);
      set({ storyArcs });
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ============================================================
  // Locations
  // ============================================================
  locations: [],
  loadLocations: async () => {
    const project = get().currentProject;
    if (!project) return;
    try {
      const locations = await api.getLocations(project.id);
      set({ locations });
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ============================================================
  // Items
  // ============================================================
  items: [],
  loadItems: async () => {
    const project = get().currentProject;
    if (!project) return;
    try {
      const items = await api.getItems(project.id);
      set({ items });
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ============================================================
  // Story Threads
  // ============================================================
  storyThreads: [],
  loadStoryThreads: async () => {
    const project = get().currentProject;
    if (!project) return;
    try {
      const storyThreads = await api.getStoryThreads(project.id);
      set({ storyThreads });
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ============================================================
  // Factions
  // ============================================================
  factions: [],
  loadFactions: async () => {
    const project = get().currentProject;
    if (!project) return;
    try {
      const factions = await api.getFactions(project.id);
      set({ factions });
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ============================================================
  // Foreshadows
  // ============================================================
  foreshadows: [],
  loadForeshadows: async () => {
    const project = get().currentProject;
    if (!project) return;
    try {
      const foreshadows = await api.getForeshadows(project.id);
      set({ foreshadows });
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ============================================================
  // Knowledge Matrix
  // ============================================================
  knowledgeMatrix: null,
  loadKnowledgeMatrix: async () => {
    const project = get().currentProject;
    if (!project) return;
    try {
      const matrix = await api.getKnowledgeMatrix(project.id);
      set({ knowledgeMatrix: matrix });
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ============================================================
  // Story State Snapshots
  // ============================================================
  storyStateSnapshots: [],
  loadStoryStateSnapshots: async () => {
    const project = get().currentProject;
    if (!project) return;
    try {
      const storyStateSnapshots = await api.getStoryStateSnapshots(project.id);
      set({ storyStateSnapshots });
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ============================================================
  // Prompts
  // ============================================================
  prompts: [],
  loadPrompts: async () => {
    const project = get().currentProject;
    if (!project) return;
    try {
      const prompts = await api.getPrompts(project.id);
      set({ prompts });
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ============================================================
  // UI State
  // ============================================================
  sidebarCollapsed: false,
  rightPanelOpen: false,
  rightPanelTab: 'context',
  saveStatus: 'saved', // 'saved' | 'saving' | 'error'

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setSaveStatus: (status) => set({ saveStatus: status }),

  // ============================================================
  // Search
  // ============================================================
  searchQuery: '',
  searchResults: [],
  setSearchQuery: (q) => set({ searchQuery: q }),

  performSearch: async (q) => {
    const project = get().currentProject;
    if (!project || !q.trim()) {
      set({ searchResults: [] });
      return;
    }
    try {
      const results = await api.search(project.id, q);
      set({ searchResults: results });
    } catch (err) {
      set({ error: err.message });
    }
  },
}));
