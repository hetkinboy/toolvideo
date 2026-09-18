import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './Layout/AppLayout';
import Dashboard from '../features/dashboard/Dashboard';
import CharacterList from '../features/characters/CharacterList';
import CharacterDetail from '../features/characters/CharacterDetail';
import EpisodeList from '../features/episodes/EpisodeList';
import EpisodeDetail from '../features/episodes/EpisodeDetail';
import SceneList from '../features/scenes/SceneList';
import SceneDetail from '../features/scenes/SceneDetail';
import StoryArcList from '../features/story-arcs/StoryArcList';
import BibleEditor from '../features/bible/BibleEditor';
import LocationList from '../features/locations/LocationList';
import ItemList from '../features/items/ItemList';
import FactionList from '../features/factions/FactionList';
import StoryState from '../features/continuity/StoryState';
import StoryThreads from '../features/continuity/StoryThreads';
import Foreshadowing from '../features/continuity/Foreshadowing';
import KnowledgeMatrix from '../features/continuity/KnowledgeMatrix';
import PromptLibrary from '../features/prompts/PromptLibrary';
import PromptStudio from '../features/prompts/PromptStudio';
import PromptHistory from '../features/prompts/PromptHistory';
import MasterOutlineStudio from '../features/prompts/MasterOutlineStudio';
import ProjectSettings from '../features/project/ProjectSettings';
import ShotList from '../features/production/ShotList';
import Storyboard from '../features/production/Storyboard';
import AssetManager from '../features/production/AssetManager';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Story */}
          <Route path="bible" element={<BibleEditor />} />
          <Route path="arcs" element={<StoryArcList />} />
          <Route path="episodes" element={<EpisodeList />} />
          <Route path="episodes/:id" element={<EpisodeDetail />} />
          <Route path="scenes" element={<SceneList />} />
          <Route path="scenes/:id" element={<SceneDetail />} />

          {/* World */}
          <Route path="characters" element={<CharacterList />} />
          <Route path="characters/new" element={<CharacterList />} />
          <Route path="characters/:id" element={<CharacterDetail />} />
          <Route path="locations" element={<LocationList />} />
          <Route path="items" element={<ItemList />} />
          <Route path="factions" element={<FactionList />} />

          {/* Continuity */}
          <Route path="story-state" element={<StoryState />} />
          <Route path="story-threads" element={<StoryThreads />} />
          <Route path="foreshadowing" element={<Foreshadowing />} />
          <Route path="knowledge" element={<KnowledgeMatrix />} />

          {/* Production */}
          <Route path="shots" element={<ShotList />} />
          <Route path="storyboard" element={<Storyboard />} />
          <Route path="assets" element={<AssetManager />} />

          {/* AI Tools */}
          <Route path="outline-studio" element={<MasterOutlineStudio />} />
          <Route path="master-outline" element={<MasterOutlineStudio />} />
          <Route path="prompt-studio" element={<PromptStudio />} />
          <Route path="prompt-library" element={<PromptLibrary />} />
          <Route path="prompt-history" element={<PromptHistory />} />

          {/* Project */}
          <Route path="settings" element={<ProjectSettings />} />
          <Route path="projects" element={<ProjectSettings />} />

          {/* 404 */}
          <Route path="*" element={<div className="empty-state"><div className="empty-state__title">Không tìm thấy trang</div></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
