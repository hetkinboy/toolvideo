/**
 * AI Video Studio — API Client
 * Kết nối frontend ↔ backend
 */

const API_BASE = 'http://localhost:3001/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API Error');
  }
  return res.json();
}

export const api = {
  // Projects
  getProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (data) => request('/projects', { method: 'POST', body: data }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: data }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  getDashboard: (projectId) => request(`/projects/${projectId}/dashboard`),
  getBible: (projectId) => request(`/projects/${projectId}/bible`),

  // Characters
  getCharacters: (projectId) => request(`/characters?project_id=${projectId}`),
  getCharacter: (id) => request(`/characters/${id}`),
  getCharacterFull: (id) => request(`/characters/${id}/full`),
  createCharacter: (data) => request('/characters', { method: 'POST', body: data }),
  updateCharacter: (id, data) => request(`/characters/${id}`, { method: 'PUT', body: data }),
  deleteCharacter: (id) => request(`/characters/${id}`, { method: 'DELETE' }),
  getCharacterOutfits: (characterId) => request(`/characters/${characterId}/outfits`),
  getOutfits: (projectId) => request(`/character-outfits?project_id=${projectId}`),
  createOutfit: (data) => request('/character-outfits', { method: 'POST', body: data }),
  updateOutfit: (id, data) => request(`/character-outfits/${id}`, { method: 'PUT', body: data }),
  deleteOutfit: (id) => request(`/character-outfits/${id}`, { method: 'DELETE' }),

  // Character States
  getCharacterStates: (projectId) => request(`/character-states?project_id=${projectId}`),
  updateCharacterState: (id, data) => request(`/character-states/${id}`, { method: 'PUT', body: data }),

  // Locations
  getLocations: (projectId) => request(`/locations?project_id=${projectId}`),
  getLocation: (id) => request(`/locations/${id}`),
  createLocation: (data) => request('/locations', { method: 'POST', body: data }),
  updateLocation: (id, data) => request(`/locations/${id}`, { method: 'PUT', body: data }),
  deleteLocation: (id) => request(`/locations/${id}`, { method: 'DELETE' }),

  // Items
  getItems: (projectId) => request(`/items?project_id=${projectId}`),
  getItem: (id) => request(`/items/${id}`),
  createItem: (data) => request('/items', { method: 'POST', body: data }),
  updateItem: (id, data) => request(`/items/${id}`, { method: 'PUT', body: data }),
  deleteItem: (id) => request(`/items/${id}`, { method: 'DELETE' }),

  // Factions
  getFactions: (projectId) => request(`/factions?project_id=${projectId}`),
  createFaction: (data) => request('/factions', { method: 'POST', body: data }),
  updateFaction: (id, data) => request(`/factions/${id}`, { method: 'PUT', body: data }),
  deleteFaction: (id) => request(`/factions/${id}`, { method: 'DELETE' }),

  // Story Arcs
  getStoryArcs: (projectId) => request(`/story-arcs?project_id=${projectId}`),
  getStoryArc: (id) => request(`/story-arcs/${id}`),
  getArcEpisodes: (arcId) => request(`/story-arcs/${arcId}/episodes`),

  // Episodes
  getEpisodes: (projectId) => request(`/episodes?project_id=${projectId}`),
  getEpisode: (id) => request(`/episodes/${id}`),
  createEpisode: (data) => request('/episodes', { method: 'POST', body: data }),
  updateEpisode: (id, data) => request(`/episodes/${id}`, { method: 'PUT', body: data }),

  // Scenes
  getScenes: (projectId) => request(`/scenes?project_id=${projectId}`),
  getScene: (id) => request(`/scenes/${id}`),
  getEpisodeScenes: (episodeId) => request(`/episodes/${episodeId}/scenes`),
  createScene: (data) => request('/scenes', { method: 'POST', body: data }),
  updateScene: (id, data) => request(`/scenes/${id}`, { method: 'PUT', body: data }),
  autoLinkScene: (id, data = {}) => request(`/scenes/${id}/auto-link`, { method: 'POST', body: data }),

  // Phase 3: Shots / Storyboard
  getShots: (projectId) => request(`/shots?project_id=${projectId}`),
  getSceneShots: (sceneId) => request(`/scenes/${sceneId}/shots`),
  getSceneIdentityPack: (sceneId) => request(`/scenes/${sceneId}/identity-pack`),
  createShot: (data) => request('/shots', { method: 'POST', body: data }),
  generateShotFromScene: (sceneId, data = {}) => request(`/scenes/${sceneId}/shots/generate`, { method: 'POST', body: data }),
  updateShot: (id, data) => request(`/shots/${id}`, { method: 'PUT', body: data }),
  deleteShot: (id) => request(`/shots/${id}`, { method: 'DELETE' }),

  // Phase 3: Assets
  getAssets: (projectId) => request(`/assets?project_id=${projectId}`),
  getCharacterReferenceAssets: (characterId) => request(`/characters/${characterId}/reference-assets`),
  uploadAsset: (data) => request('/assets/upload', { method: 'POST', body: data }),
  createAsset: (data) => request('/assets', { method: 'POST', body: data }),
  updateAsset: (id, data) => request(`/assets/${id}`, { method: 'PUT', body: data }),
  deleteAsset: (id) => request(`/assets/${id}`, { method: 'DELETE' }),

  // Story Threads
  getStoryThreads: (projectId) => request(`/story-threads?project_id=${projectId}`),
  createStoryThread: (data) => request('/story-threads', { method: 'POST', body: data }),
  updateStoryThread: (id, data) => request(`/story-threads/${id}`, { method: 'PUT', body: data }),
  deleteStoryThread: (id) => request(`/story-threads/${id}`, { method: 'DELETE' }),

  // Foreshadows
  getForeshadows: (projectId) => request(`/foreshadows?project_id=${projectId}`),
  createForeshadow: (data) => request('/foreshadows', { method: 'POST', body: data }),
  updateForeshadow: (id, data) => request(`/foreshadows/${id}`, { method: 'PUT', body: data }),
  deleteForeshadow: (id) => request(`/foreshadows/${id}`, { method: 'DELETE' }),

  // Knowledge Matrix
  getKnowledgeMatrix: (projectId) => request(`/knowledge-matrix?project_id=${projectId}`),
  upsertKnowledgeEntry: (data) => request('/knowledge-entries/upsert', { method: 'POST', body: data }),

  // Story State Snapshots
  getStoryStateSnapshots: (projectId) => request(`/story-state-snapshots?project_id=${projectId}`),
  getStoryStateSnapshot: (id) => request(`/story-state-snapshots/${id}`),
  deleteStoryStateSnapshot: (id) => request(`/story-state-snapshots/${id}`, { method: 'DELETE' }),
  clearProjectSnapshots: (projectId) => request(`/projects/${projectId}/snapshots`, { method: 'DELETE' }),
  generateSnapshot: (sceneId) => request(`/story-state-snapshots/generate/${sceneId}`, { method: 'POST' }),
  getSnapshotDiff: (fromId, toId) => request(`/story-state-snapshots/diff?fromId=${fromId}&toId=${toId}`),

  // Continuity Check
  checkContinuity: (data) => request('/continuity/check', { method: 'POST', body: data }),

  // Prompts
  getPrompts: (projectId) => request(`/prompts?project_id=${projectId}`),
  getPrompt: (id) => request(`/prompts/${id}`),

  // Prompt Runs
  getPromptRuns: (projectId) => request(`/prompt-runs?project_id=${projectId}`),
  createPromptRun: (data) => request('/prompt-runs', { method: 'POST', body: data }),
  updatePromptRun: (id, data) => request(`/prompt-runs/${id}`, { method: 'PUT', body: data }),

  // Bible
  updateBible: (id, data) => request(`/bibles/${id}`, { method: 'PUT', body: data }),

  // Master Outline & Scene Batch Import & Auto-Generators
  importMasterOutline: (projectId, data) => request(`/projects/${projectId}/import-master-outline`, { method: 'POST', body: data }),
  autoGenerateArcs: (projectId) => request(`/projects/${projectId}/auto-generate-arcs`, { method: 'POST' }),
  autoGenerateFactions: (projectId) => request(`/projects/${projectId}/auto-generate-factions`, { method: 'POST' }),
  importEpisodeScenes: (episodeId, data) => request(`/episodes/${episodeId}/import-scenes`, { method: 'POST', body: data }),
  getSceneVisualPrompt: (sceneId) => request(`/scenes/${sceneId}/visual-prompt`),

  // Search
  search: (projectId, q) => request(`/search?project_id=${projectId}&q=${encodeURIComponent(q)}`),
};
