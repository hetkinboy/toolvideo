/**
 * AI Video Studio — Database Schema (SQLite)
 * Phase 1: Tất cả bảng cần thiết cho workflow cốt lõi
 */

const SCHEMA_SQL = `
-- ============================================================
-- PROJECTS
-- Dự án phim/series. Gốc của toàn bộ dữ liệu.
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT DEFAULT '',

  genre TEXT DEFAULT '',
  language TEXT DEFAULT 'vi',

  target_platform TEXT DEFAULT 'TikTok',
  aspect_ratio TEXT DEFAULT '9:16',

  episode_min_duration INTEGER DEFAULT 120,
  episode_max_duration INTEGER DEFAULT 180,

  visual_style TEXT DEFAULT '',
  story_tone TEXT DEFAULT '',

  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','preproduction','production','completed','archived')),

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- PROJECT BIBLES
-- Luật nền của toàn bộ phim. Mỗi project 1 bible.
-- ============================================================
CREATE TABLE IF NOT EXISTS project_bibles (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  title TEXT DEFAULT '',
  logline TEXT DEFAULT '',
  main_story_summary TEXT DEFAULT '',
  genre TEXT DEFAULT '',
  story_tone TEXT DEFAULT '',
  storytelling_style TEXT DEFAULT '',
  world_description TEXT DEFAULT '',
  world_rules TEXT DEFAULT '',
  power_system TEXT DEFAULT '',
  main_conflict TEXT DEFAULT '',
  main_objective TEXT DEFAULT '',
  ending_direction TEXT DEFAULT '',
  forbidden_changes TEXT DEFAULT '',
  canon_rules TEXT DEFAULT '',

  -- Lock per section: JSON object { "world_rules": "locked", "ending_direction": "draft", ... }
  section_locks TEXT DEFAULT '{}',

  version INTEGER DEFAULT 1,
  is_locked INTEGER DEFAULT 0,

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- CHARACTERS
-- Hồ sơ nhân vật (static profile)
-- ============================================================
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  alias TEXT DEFAULT '',
  role TEXT DEFAULT 'npc' CHECK(role IN ('main','supporting','enemy','npc')),
  age TEXT DEFAULT '',
  apparent_age TEXT DEFAULT '',
  gender TEXT DEFAULT '',
  height TEXT DEFAULT '',

  description TEXT DEFAULT '',
  appearance TEXT DEFAULT '',
  face TEXT DEFAULT '',
  hair TEXT DEFAULT '',
  eyes TEXT DEFAULT '',
  body TEXT DEFAULT '',
  default_outfit TEXT DEFAULT '',

  personality TEXT DEFAULT '',
  speaking_style TEXT DEFAULT '',
  background TEXT DEFAULT '',
  goal TEXT DEFAULT '',
  motivation TEXT DEFAULT '',
  strength TEXT DEFAULT '',
  weakness TEXT DEFAULT '',
  secret TEXT DEFAULT '',

  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','approved','locked')),
  sort_order INTEGER DEFAULT 0,

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- CHARACTER STATES
-- Trạng thái hiện tại thay đổi theo diễn biến phim
-- ============================================================
CREATE TABLE IF NOT EXISTS character_states (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_id TEXT REFERENCES scenes(id) ON DELETE SET NULL,

  current_location TEXT DEFAULT '',
  current_outfit TEXT DEFAULT '',
  health TEXT DEFAULT 'normal',
  injuries TEXT DEFAULT '',
  emotion TEXT DEFAULT 'neutral',
  power_level TEXT DEFAULT '',
  inventory TEXT DEFAULT '[]',
  knowledge TEXT DEFAULT '[]',
  alive INTEGER DEFAULT 1,

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- CHARACTER OUTFITS
-- Named wardrobe library, reusable per Scene
-- ============================================================
CREATE TABLE IF NOT EXISTS character_outfits (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  era TEXT DEFAULT '',
  description TEXT DEFAULT '',
  visual_prompt TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  is_default INTEGER DEFAULT 0,
  status TEXT DEFAULT 'approved',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- CHARACTER RELATIONSHIPS
-- Quan hệ giữa các nhân vật
-- ============================================================
CREATE TABLE IF NOT EXISTS character_relationships (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  target_character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,

  relationship_type TEXT DEFAULT 'neutral' CHECK(relationship_type IN ('friend','enemy','family','lover','ally','rival','neutral')),
  relationship_value INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  updated_scene_id TEXT REFERENCES scenes(id) ON DELETE SET NULL,

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- LOCATIONS
-- Địa điểm trong phim
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type TEXT DEFAULT '',
  description TEXT DEFAULT '',
  architecture TEXT DEFAULT '',
  environment TEXT DEFAULT '',
  colors TEXT DEFAULT '',
  lighting TEXT DEFAULT '',
  default_weather TEXT DEFAULT '',
  important_objects TEXT DEFAULT '',
  layout_description TEXT DEFAULT '',
  visual_prompt TEXT DEFAULT '',

  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','approved','locked')),

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- ITEMS
-- Vật phẩm, vũ khí, artifacts
-- ============================================================
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type TEXT DEFAULT '',
  description TEXT DEFAULT '',
  appearance TEXT DEFAULT '',
  abilities TEXT DEFAULT '',
  history TEXT DEFAULT '',
  owner TEXT DEFAULT '',
  current_location TEXT DEFAULT '',
  condition TEXT DEFAULT 'normal' CHECK(condition IN ('normal','damaged','broken','lost','destroyed')),
  introduced_episode TEXT DEFAULT '',

  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','approved','locked')),

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- FACTIONS
-- Tổ chức, phe phái
-- ============================================================
CREATE TABLE IF NOT EXISTS factions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type TEXT DEFAULT '',
  description TEXT DEFAULT '',
  leader TEXT DEFAULT '',
  alignment TEXT DEFAULT '',
  headquarters TEXT DEFAULT '',
  relationships TEXT DEFAULT '',

  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','approved','locked')),

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- STORY ARCS
-- Cung truyện lớn
-- ============================================================
CREATE TABLE IF NOT EXISTS story_arcs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  summary TEXT DEFAULT '',
  goal TEXT DEFAULT '',
  start_episode INTEGER DEFAULT 1,
  end_episode INTEGER DEFAULT 1,

  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','approved','locked')),
  order_index INTEGER DEFAULT 0,

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- EPISODES
-- Tập phim
-- ============================================================
CREATE TABLE IF NOT EXISTS episodes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  arc_id TEXT REFERENCES story_arcs(id) ON DELETE SET NULL,

  episode_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  summary TEXT DEFAULT '',
  goal TEXT DEFAULT '',
  opening_hook TEXT DEFAULT '',
  main_conflict TEXT DEFAULT '',
  climax TEXT DEFAULT '',
  ending TEXT DEFAULT '',
  cliffhanger TEXT DEFAULT '',
  duration_target INTEGER DEFAULT 120,
  duration_min INTEGER DEFAULT 90,
  duration_max INTEGER DEFAULT 300,
  content_density TEXT DEFAULT 'adaptive',
  word_budget INTEGER DEFAULT 0,
  planned_duration INTEGER DEFAULT 0,
  duration_notes TEXT DEFAULT '',

  previous_episode_id TEXT REFERENCES episodes(id),
  next_episode_id TEXT REFERENCES episodes(id),

  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','approved','locked')),

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- SCENES
-- Cảnh — đơn vị kịch bản chính
-- ============================================================
CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  episode_id TEXT NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,

  scene_number INTEGER NOT NULL,
  title TEXT DEFAULT '',
  purpose TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  location_id TEXT REFERENCES locations(id),
  time_of_day TEXT DEFAULT '',
  weather TEXT DEFAULT '',
  duration INTEGER DEFAULT 0,

  starting_state TEXT DEFAULT '{}',
  action TEXT DEFAULT '',
  dialogue TEXT DEFAULT '',
  emotion_change TEXT DEFAULT '',
  ending_state TEXT DEFAULT '{}',
  transition TEXT DEFAULT '',

  -- Prompt pack used by the visual and video production workflow
  character_prompt TEXT DEFAULT '',
  image_prompt TEXT DEFAULT '',
  video_prompt TEXT DEFAULT '',

  -- JSON arrays of IDs
  character_ids TEXT DEFAULT '[]',
  item_ids TEXT DEFAULT '[]',
  story_thread_ids TEXT DEFAULT '[]',
  character_appearances TEXT DEFAULT '{}',

  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','approved','locked')),

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- SHOTS
-- Đơn vị sản xuất (Phase 3, tạo structure sẵn)
-- ============================================================
CREATE TABLE IF NOT EXISTS shots (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  character_ids TEXT DEFAULT '[]',
  reference_asset_ids TEXT DEFAULT '[]',
  start_frame_asset_ids TEXT DEFAULT '[]',
  end_frame_asset_ids TEXT DEFAULT '[]',

  shot_number INTEGER NOT NULL,
  duration REAL DEFAULT 0,
  description TEXT DEFAULT '',
  camera_shot TEXT DEFAULT '',
  camera_angle TEXT DEFAULT '',
  camera_movement TEXT DEFAULT '',
  lens TEXT DEFAULT '',
  composition TEXT DEFAULT '',
  lighting TEXT DEFAULT '',
  background TEXT DEFAULT '',
  character_action TEXT DEFAULT '',
  facial_expression TEXT DEFAULT '',
  dialogue TEXT DEFAULT '',
  sfx TEXT DEFAULT '',
  music TEXT DEFAULT '',
  image_prompt TEXT DEFAULT '',
  video_prompt TEXT DEFAULT '',
  start_frame_prompt TEXT DEFAULT '',
  end_frame_prompt TEXT DEFAULT '',
  flow_transition_prompt TEXT DEFAULT '',

  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','script_done','image_prompt_done','image_done','video_prompt_done','video_done','approved')),

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- STORY THREADS
-- Tuyến truyện cần theo dõi
-- ============================================================
CREATE TABLE IF NOT EXISTS story_threads (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  introduced_episode TEXT DEFAULT '',
  introduced_scene TEXT DEFAULT '',
  priority TEXT DEFAULT 'normal',
  planned_resolution_episode TEXT DEFAULT '',
  resolved_episode TEXT DEFAULT '',

  status TEXT DEFAULT 'open' CHECK(status IN ('open','developing','ready_to_resolve','resolved','abandoned')),

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- FORESHADOWS
-- Manh mối / Tiên báo
-- ============================================================
CREATE TABLE IF NOT EXISTS foreshadows (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  setup TEXT DEFAULT '',
  setup_episode TEXT DEFAULT '',
  setup_scene TEXT DEFAULT '',
  planned_reveal TEXT DEFAULT '',
  planned_reveal_episode TEXT DEFAULT '',

  status TEXT DEFAULT 'planned' CHECK(status IN ('planned','setup_done','revealed','cancelled')),

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- KNOWLEDGE ENTRIES
-- Ma trận kiến thức: nhân vật nào biết điều gì
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_entries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,

  fact TEXT NOT NULL,
  knowledge_state TEXT DEFAULT 'unknown' CHECK(knowledge_state IN ('knows','unknown','suspects','false_belief')),
  learned_episode TEXT DEFAULT '',
  learned_scene TEXT DEFAULT '',

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- STORY STATE SNAPSHOTS
-- Snapshot trạng thái sau mỗi scene approve
-- ============================================================
CREATE TABLE IF NOT EXISTS story_state_snapshots (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  episode_id TEXT REFERENCES episodes(id),
  scene_id TEXT REFERENCES scenes(id) ON DELETE SET NULL,

  snapshot_data TEXT DEFAULT '{}',

  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- PROMPTS
-- Template prompt
-- ============================================================
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT DEFAULT '',
  template TEXT DEFAULT '',
  variables TEXT DEFAULT '[]',

  current_version INTEGER DEFAULT 1,

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- PROMPT VERSIONS
-- Phiên bản prompt (không ghi đè version cũ)
-- ============================================================
CREATE TABLE IF NOT EXISTS prompt_versions (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,

  version INTEGER NOT NULL,
  template TEXT NOT NULL,
  variables TEXT DEFAULT '[]',
  changelog TEXT DEFAULT '',

  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- PROMPT RUNS
-- Lịch sử mỗi lần build + chạy prompt
-- ============================================================
CREATE TABLE IF NOT EXISTS prompt_runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  prompt_id TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,

  prompt_version INTEGER NOT NULL,
  target_type TEXT DEFAULT '',
  target_id TEXT DEFAULT '',
  context_data TEXT DEFAULT '{}',
  generated_prompt TEXT DEFAULT '',
  ai_response TEXT DEFAULT '',
  parsed_response TEXT DEFAULT '{}',

  status TEXT DEFAULT 'prepared' CHECK(status IN ('prepared','copied','response_received','parsed','approved','rejected')),

  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- ASSETS
-- Quản lý tài nguyên media (Phase 3, tạo structure sẵn)
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  asset_type TEXT NOT NULL CHECK(asset_type IN ('image','video','voice','music','sfx')),
  target_type TEXT DEFAULT '',
  target_id TEXT DEFAULT '',
  reference_kind TEXT DEFAULT '',
  file_path TEXT DEFAULT '',
  thumbnail TEXT DEFAULT '',
  version INTEGER DEFAULT 1,

  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','approved_reference','approved','archived')),

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id);
CREATE INDEX IF NOT EXISTS idx_character_states_character ON character_states(character_id);
CREATE INDEX IF NOT EXISTS idx_character_states_scene ON character_states(scene_id);
CREATE INDEX IF NOT EXISTS idx_character_outfits_character ON character_outfits(character_id);
CREATE INDEX IF NOT EXISTS idx_character_relationships_char ON character_relationships(character_id);
CREATE INDEX IF NOT EXISTS idx_locations_project ON locations(project_id);
CREATE INDEX IF NOT EXISTS idx_items_project ON items(project_id);
CREATE INDEX IF NOT EXISTS idx_factions_project ON factions(project_id);
CREATE INDEX IF NOT EXISTS idx_story_arcs_project ON story_arcs(project_id);
CREATE INDEX IF NOT EXISTS idx_episodes_project ON episodes(project_id);
CREATE INDEX IF NOT EXISTS idx_episodes_arc ON episodes(arc_id);
CREATE INDEX IF NOT EXISTS idx_scenes_episode ON scenes(episode_id);
CREATE INDEX IF NOT EXISTS idx_shots_scene ON shots(scene_id);
CREATE INDEX IF NOT EXISTS idx_story_threads_project ON story_threads(project_id);
CREATE INDEX IF NOT EXISTS idx_foreshadows_project ON foreshadows(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_character ON knowledge_entries(character_id);
CREATE INDEX IF NOT EXISTS idx_story_state_snapshots_scene ON story_state_snapshots(scene_id);
CREATE INDEX IF NOT EXISTS idx_prompts_project ON prompts(project_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt ON prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_runs_project ON prompt_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_project ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_target ON assets(target_type, target_id);
`;

module.exports = { SCHEMA_SQL };
