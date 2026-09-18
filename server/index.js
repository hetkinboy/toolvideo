/**
 * AI Video Studio — Express Server
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getDb, closeDb } = require('./database/db');
const { seedDemoData, seedContinuityIfMissing } = require('./database/seed');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// HELPER: Generic CRUD
// ============================================================
function createCrudRoutes(tableName, options = {}) {
  const router = express.Router();
  const db = getDb();

  // GET all (filtered by project_id)
  router.get('/', (req, res) => {
    try {
      const { project_id } = req.query;
      let rows;
      if (project_id) {
        rows = db.prepare(`SELECT * FROM ${tableName} WHERE project_id = ? ORDER BY ${options.orderBy || 'created_at DESC'}`).all(project_id);
      } else if (tableName === 'projects') {
        rows = db.prepare(`SELECT * FROM ${tableName} ORDER BY updated_at DESC`).all();
      } else {
        return res.status(400).json({ error: 'project_id is required' });
      }
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET by ID
  router.get('/:id', (req, res) => {
    try {
      const row = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(req.params.id);
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST create
  router.post('/', (req, res) => {
    try {
      const { v4: uuidv4 } = require('uuid');
      const id = req.body.id || uuidv4();
      const data = { ...req.body, id };

      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(col => data[col]);

      db.prepare(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`).run(...values);

      const created = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);
      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update
  router.put('/:id', (req, res) => {
    try {
      const data = { ...req.body, updated_at: new Date().toISOString() };
      delete data.id;
      delete data.created_at;

      const sets = Object.keys(data).map(col => `${col} = ?`).join(', ');
      const values = Object.values(data);

      db.prepare(`UPDATE ${tableName} SET ${sets} WHERE id = ?`).run(...values, req.params.id);

      const updated = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(req.params.id);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  router.delete('/:id', (req, res) => {
    try {
      const result = db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(req.params.id);
      if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

// ============================================================
// API ROUTES
// ============================================================
// Custom Project Creation (Auto initializes Bible and default Prompts)
app.post('/api/projects', (req, res) => {
  try {
    const db = getDb();
    const { v4: uuidv4 } = require('uuid');
    const id = req.body.id || uuidv4();
    const slug = req.body.slug || (req.body.name || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + id.slice(0, 4);

    const projectData = {
      ...req.body,
      id,
      slug,
      status: req.body.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const columns = Object.keys(projectData);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(c => projectData[c]);

    db.prepare(`INSERT INTO projects (${columns.join(', ')}) VALUES (${placeholders})`).run(...values);

    // 1. Auto create empty Project Bible
    const bibleId = uuidv4();
    db.prepare(`
      INSERT INTO project_bibles (id, project_id, title, logline, main_story_summary, genre, story_tone,
        storytelling_style, world_description, world_rules, power_system, main_conflict,
        main_objective, ending_direction, forbidden_changes, canon_rules, section_locks, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bibleId, id,
      (projectData.name || 'Dự Án') + ' — Story Bible',
      projectData.description || '',
      '', projectData.genre || '', projectData.story_tone || '',
      'Narrative visual storytelling', '', '', '', '', '', '', '', '',
      JSON.stringify({ world_rules: 'draft', power_system: 'draft' }),
      1
    );

    // 2. Auto create default prompt templates
    const defaultPrompts = [
      {
        name: 'Tạo Scene',
        type: 'PROMPT_CREATE_SCENE',
        description: 'Tạo nội dung scene mới từ dàn ý và context dự án',
        template: `Bạn là biên kịch chuyên nghiệp cho phim ngắn dọc (TikTok/YouTube Shorts).

## THÔNG TIN DỰ ÁN
{{PROJECT_BIBLE}}

## CỐT TRUYỆN HIỆN TẠI
Arc: {{CURRENT_ARC}}
Episode: {{EPISODE}}

## SCENE TRƯỚC
{{PREVIOUS_SCENE}}

## NHÂN VẬT LIÊN QUAN
{{CHARACTERS}}

## TRẠNG THÁI HIỆN TẠI
{{CURRENT_STATE}}

## ĐỊA ĐIỂM
{{LOCATIONS}}

## TUYẾN TRUYỆN ĐANG MỞ
{{STORY_THREADS}}

## YÊU CẦU
{{USER_INPUT}}

## ĐỊNH DẠNG OUTPUT (JSON)
{
  "title": "",
  "purpose": "",
  "summary": "",
  "time_of_day": "",
  "weather": "",
  "duration": 0,
  "starting_state": {},
  "action": "",
  "dialogue": "",
  "emotion_change": "",
  "ending_state": {},
  "transition": ""
}`,
        variables: JSON.stringify(['PROJECT_BIBLE', 'CURRENT_ARC', 'EPISODE', 'PREVIOUS_SCENE', 'CHARACTERS', 'CURRENT_STATE', 'LOCATIONS', 'STORY_THREADS', 'USER_INPUT'])
      },
      {
        name: 'Kiểm Tra Liên Tục',
        type: 'PROMPT_CONTINUITY_CHECK',
        description: 'Kiểm tra tính nhất quán của scene mới so với context',
        template: `Bạn là hệ thống kiểm tra tính liên tục (continuity) cho phim dài tập.

## CANON HIỆN TẠI
{{CURRENT_STATE}}

## SCENE CẦN KIỂM TRA
{{USER_INPUT}}

## YÊU CẦU KIỂM TRA
1. Vị trí nhân vật có khớp với scene trước?
2. Trang phục có thay đổi vô lý?
3. Chấn thương có được duy trì?
4. Nhân vật có biết thông tin mà họ chưa được biết?
5. Cấp độ sức mạnh có nhất quán?
6. Vật phẩm có đúng chủ sở hữu?
7. Quy tắc thế giới có bị vi phạm?

## ĐỊNH DẠNG OUTPUT
{
  "valid": true/false,
  "errors": [],
  "warnings": [],
  "suggestions": []
}`,
        variables: JSON.stringify(['CURRENT_STATE', 'USER_INPUT'])
      },
      {
        name: 'Viết Lời Thoại (Dialogue)',
        type: 'PROMPT_DIALOGUE',
        description: 'Viết lời thoại kịch tính đúng khẩu khí từng nhân vật',
        template: `Viết lời thoại cho phân cảnh phim:
## THÔNG TIN NHÂN VẬT VÀ KHẨU KHÍ:
{{CHARACTERS}}

## TÌNH HUỐNG VÀ XUNG ĐỘT:
{{USER_INPUT}}

## YÊU CẦU:
- Đúng ngữ điệu của từng nhân vật
- Không tiết lộ bí mật nhân vật chưa biết
- Lời thoại cô đọng, sắc bén`,
        variables: JSON.stringify(['CHARACTERS', 'USER_INPUT'])
      },
      {
        name: 'Tạo Visual Prompt Sinh Ảnh',
        type: 'PROMPT_CHARACTER_IMAGE',
        description: 'Tạo prompt tiếng Anh cho Midjourney/Stable Diffusion',
        template: `Tạo visual prompt tiếng Anh cho nhân vật hoặc bối cảnh:
Dự án: {{PROJECT_BIBLE}}
Thông tin: {{USER_INPUT}}
Yêu cầu: Anime/Cinematic style, 8k resolution, dramatic lighting, detailed character features.`,
        variables: JSON.stringify(['PROJECT_BIBLE', 'USER_INPUT'])
      }
    ];

    const insertPrompt = db.prepare(`
      INSERT INTO prompts (id, project_id, name, type, description, template, variables, current_version)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    for (const p of defaultPrompts) {
      insertPrompt.run(uuidv4(), id, p.name, p.type, p.description, p.template, p.variables);
    }

    const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Custom Project Delete (Cascades all tables)
app.delete('/api/projects/:id', (req, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    // Manual cascade to be 100% safe
    const tables = [
      'project_bibles', 'characters', 'character_states', 'character_relationships',
      'locations', 'items', 'factions', 'story_arcs', 'episodes', 'scenes', 'shots',
      'story_threads', 'foreshadows', 'knowledge_entries', 'story_state_snapshots',
      'prompts', 'assets'
    ];
    for (const t of tables) {
      try {
        db.prepare(`DELETE FROM ${t} WHERE project_id = ?`).run(id);
      } catch (e) {}
    }
    const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/projects', createCrudRoutes('projects'));
app.use('/api/bibles', createCrudRoutes('project_bibles'));
app.use('/api/characters', createCrudRoutes('characters', { orderBy: 'sort_order ASC' }));
app.use('/api/character-states', createCrudRoutes('character_states'));
app.use('/api/character-relationships', createCrudRoutes('character_relationships'));
app.use('/api/locations', createCrudRoutes('locations'));
app.use('/api/items', createCrudRoutes('items'));
app.use('/api/factions', createCrudRoutes('factions'));
app.use('/api/story-arcs', createCrudRoutes('story_arcs', { orderBy: 'order_index ASC' }));
app.use('/api/episodes', createCrudRoutes('episodes', { orderBy: 'episode_number ASC' }));
app.use('/api/scenes', createCrudRoutes('scenes', { orderBy: 'scene_number ASC' }));
app.use('/api/shots', createCrudRoutes('shots', { orderBy: 'shot_number ASC' }));
app.use('/api/story-threads', createCrudRoutes('story_threads'));
app.use('/api/foreshadows', createCrudRoutes('foreshadows'));
app.use('/api/knowledge-entries', createCrudRoutes('knowledge_entries'));
app.use('/api/story-state-snapshots', createCrudRoutes('story_state_snapshots'));
app.use('/api/prompts', createCrudRoutes('prompts'));
app.use('/api/prompt-versions', createCrudRoutes('prompt_versions'));
app.use('/api/prompt-runs', createCrudRoutes('prompt_runs'));
app.use('/api/assets', createCrudRoutes('assets'));

// Upload a real image file as a base64 JSON payload. This keeps the app
// dependency-free while making the reference usable by the local frontend.
app.post('/api/assets/upload', (req, res) => {
  try {
    const { project_id, target_type = '', target_id = '', reference_kind = '', asset_type = 'image', filename = 'upload', mime_type, data, version = 1, status = 'draft' } = req.body || {};
    if (!project_id || !data) return res.status(400).json({ error: 'Thiếu project_id hoặc file ảnh' });
    if (asset_type !== 'image') return res.status(400).json({ error: 'Tính năng tải lên hiện chỉ hỗ trợ ảnh' });
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(mime_type)) {
      return res.status(400).json({ error: 'Chỉ hỗ trợ PNG, JPG, WEBP hoặc GIF' });
    }

    const db = getDb();
    const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(project_id);
    if (!project) return res.status(400).json({ error: 'Dự án không tồn tại' });

    const encoded = String(data).replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(encoded, 'base64');
    if (!buffer.length) return res.status(400).json({ error: 'File ảnh rỗng hoặc không hợp lệ' });
    if (buffer.length > 12 * 1024 * 1024) return res.status(413).json({ error: 'Ảnh vượt quá giới hạn 12MB' });

    const extensionByMime = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif' };
    const extension = extensionByMime[mime_type];
    const uploadsDir = path.join(__dirname, 'uploads');
    fs.mkdirSync(uploadsDir, { recursive: true });
    const storedName = `${uuidv4()}${extension}`;
    fs.writeFileSync(path.join(uploadsDir, storedName), buffer);

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${storedName}`;
    const assetId = uuidv4();
    db.prepare(`
      INSERT INTO assets (id, project_id, asset_type, target_type, target_id, reference_kind, file_path, thumbnail, version, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(assetId, project_id, asset_type, target_type, target_id, reference_kind, fileUrl, fileUrl, version, status);

    res.status(201).json(db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId));
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải ảnh lên: ' + err.message });
  }
});

// ============================================================
// PHASE 3 PRODUCTION ROUTES
// ============================================================

function parseIdArray(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getIdentityPack(db, projectId, characterIds) {
  const ids = [...new Set(parseIdArray(characterIds))];
  if (ids.length === 0) return { characters: [], references: [] };

  const placeholders = ids.map(() => '?').join(', ');
  const characters = db.prepare(`
    SELECT id, name, appearance, face, hair, eyes, body, default_outfit
    FROM characters
    WHERE project_id = ? AND id IN (${placeholders})
  `).all(projectId, ...ids);
  const references = db.prepare(`
    SELECT id, target_id, reference_kind, file_path, thumbnail, version, status
    FROM assets
    WHERE project_id = ?
      AND target_type = 'character'
      AND target_id IN (${placeholders})
      AND asset_type = 'image'
      AND status <> 'archived'
    ORDER BY version DESC, created_at DESC
  `).all(projectId, ...ids);

  return { characters, references };
}

function identityLockText(identityPack) {
  if (!identityPack.characters.length) return '';
  const refsByCharacter = identityPack.references.reduce((map, ref) => {
    (map[ref.target_id] ||= []).push(ref.file_path || ref.thumbnail || `asset:${ref.id}`);
    return map;
  }, {});

  return [
    'CHARACTER IDENTITY LOCK — preserve the same face, hair, eye color, body proportions and signature outfit in every frame:',
    ...identityPack.characters.map((character) => {
      const reference = refsByCharacter[character.id]
        ?.map((ref) => `${ref.reference_kind || 'other'}: ${ref.file_path || ref.thumbnail || `asset:${ref.id}`}`)
        .join(' | ');
      return [
        `${character.name}: face=${character.face || character.appearance || 'consistent face'}, hair=${character.hair || 'consistent hair'}, eyes=${character.eyes || 'consistent eyes'}, body=${character.body || 'consistent body'}, outfit=${character.default_outfit || 'signature outfit'}`,
        reference ? `Reference image: ${reference}` : '',
      ].filter(Boolean).join(', ');
    }),
    'Do not change character identity, hairstyle, eye color or outfit unless the shot explicitly says so.',
  ].join('\n');
}

app.get('/api/characters/:characterId/reference-assets', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM assets
      WHERE target_type = 'character' AND target_id = ? AND asset_type = 'image'
      ORDER BY version DESC, created_at DESC
    `).all(req.params.characterId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/scenes/:sceneId/identity-pack', (req, res) => {
  try {
    const db = getDb();
    const scene = db.prepare('SELECT id, project_id, character_ids FROM scenes WHERE id = ?').get(req.params.sceneId);
    if (!scene) return res.status(404).json({ error: 'Scene không tồn tại' });
    const identityPack = getIdentityPack(db, scene.project_id, scene.character_ids);
    res.json({ ...identityPack, identity_lock: identityLockText(identityPack) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET shots for a scene
app.get('/api/scenes/:sceneId/shots', (req, res) => {
  try {
    const db = getDb();
    const scene = db.prepare('SELECT id FROM scenes WHERE id = ?').get(req.params.sceneId);
    if (!scene) return res.status(404).json({ error: 'Scene không tồn tại' });

    const shots = db.prepare(`
      SELECT * FROM shots
      WHERE scene_id = ?
      ORDER BY shot_number ASC, created_at ASC
    `).all(req.params.sceneId);
    res.json(shots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a first production shot from a scene. Further shots can be added and
// edited from the Shot Editor/Storyboard UI.
app.post('/api/scenes/:sceneId/shots/generate', (req, res) => {
  try {
    const db = getDb();
    const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(req.params.sceneId);
    if (!scene) return res.status(404).json({ error: 'Scene không tồn tại' });

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(scene.project_id);
    if (!project) return res.status(400).json({ error: 'Project của scene không tồn tại' });
    const identityPack = getIdentityPack(db, scene.project_id, scene.character_ids);
    const identityLock = identityLockText(identityPack);

    const maxShot = db.prepare('SELECT MAX(shot_number) AS maxNum FROM shots WHERE scene_id = ?').get(scene.id);
    const shotNumber = (maxShot?.maxNum || 0) + 1;
    const id = uuidv4();
    const visualStyle = project.visual_style || 'cinematic anime, highly detailed, dramatic lighting';
    const imagePrompt = [
      visualStyle,
      scene.action ? `Action: ${scene.action}` : '',
      scene.time_of_day ? `Time of day: ${scene.time_of_day}` : '',
      identityLock,
      project.aspect_ratio ? `--ar ${project.aspect_ratio}` : ''
    ].filter(Boolean).join(', ');
    const videoPrompt = [
      'Cinematic video shot',
      scene.action || scene.summary || '',
      scene.dialogue ? `Dialogue: ${scene.dialogue}` : '',
      'natural character motion, expressive acting, coherent camera movement'
    ].filter(Boolean).join(', ');

    db.prepare(`
      INSERT INTO shots (
        id, project_id, scene_id, shot_number, duration, description,
        camera_shot, camera_angle, camera_movement, character_action,
        dialogue, image_prompt, video_prompt, character_ids, reference_asset_ids, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, scene.project_id, scene.id, shotNumber, req.body?.duration || 5,
      scene.summary || scene.action || scene.title || `Shot ${shotNumber}`,
      'medium shot', 'eye level', 'slow push in', scene.action || '',
      scene.dialogue || '', imagePrompt, videoPrompt,
      JSON.stringify(parseIdArray(scene.character_ids)),
      JSON.stringify(identityPack.references.map((reference) => reference.id)),
      'script_done'
    );

    res.status(201).json(db.prepare('SELECT * FROM shots WHERE id = ?').get(id));
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo shot: ' + err.message });
  }
});

// ============================================================
// SPECIAL ROUTES
// ============================================================

// GET scenes by episode
app.get('/api/episodes/:episodeId/scenes', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM scenes WHERE episode_id = ? ORDER BY scene_number ASC').all(req.params.episodeId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET episodes by arc
app.get('/api/story-arcs/:arcId/episodes', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM episodes WHERE arc_id = ? ORDER BY episode_number ASC').all(req.params.arcId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET character with latest state
app.get('/api/characters/:id/full', (req, res) => {
  try {
    const db = getDb();
    const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!character) return res.status(404).json({ error: 'Character not found' });

    const state = db.prepare('SELECT * FROM character_states WHERE character_id = ? ORDER BY created_at DESC LIMIT 1').get(req.params.id);
    const relationships = db.prepare('SELECT cr.*, c.name as target_name FROM character_relationships cr LEFT JOIN characters c ON cr.target_character_id = c.id WHERE cr.character_id = ?').all(req.params.id);

    res.json({ ...character, current_state: state, relationships });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET project bible
app.get('/api/projects/:projectId/bible', (req, res) => {
  try {
    const db = getDb();
    const bible = db.prepare('SELECT * FROM project_bibles WHERE project_id = ?').get(req.params.projectId);
    if (!bible) return res.status(404).json({ error: 'Bible not found' });
    res.json(bible);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET dashboard data
app.get('/api/projects/:projectId/dashboard', (req, res) => {
  try {
    const db = getDb();
    const projectId = req.params.projectId;

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const stats = {
      episodes: db.prepare('SELECT COUNT(*) as count FROM episodes WHERE project_id = ?').get(projectId).count,
      scenes: db.prepare('SELECT COUNT(*) as count FROM scenes WHERE project_id = ?').get(projectId).count,
      characters: db.prepare('SELECT COUNT(*) as count FROM characters WHERE project_id = ?').get(projectId).count,
      shots: db.prepare('SELECT COUNT(*) as count FROM shots WHERE project_id = ?').get(projectId).count,
      story_threads: db.prepare('SELECT COUNT(*) as count FROM story_threads WHERE project_id = ?').get(projectId).count,
      locations: db.prepare('SELECT COUNT(*) as count FROM locations WHERE project_id = ?').get(projectId).count,
      items: db.prepare('SELECT COUNT(*) as count FROM items WHERE project_id = ?').get(projectId).count,
    };

    const episode_status = db.prepare(`
      SELECT status, COUNT(*) as count FROM episodes WHERE project_id = ? GROUP BY status
    `).all(projectId);

    const scene_status = db.prepare(`
      SELECT status, COUNT(*) as count FROM scenes WHERE project_id = ? GROUP BY status
    `).all(projectId);

    // Recent scenes for "Continue Working"
    const recent_scenes = db.prepare(`
      SELECT s.*, e.title as episode_title, e.episode_number
      FROM scenes s
      LEFT JOIN episodes e ON s.episode_id = e.id
      WHERE s.project_id = ? AND s.status != 'locked'
      ORDER BY s.updated_at DESC LIMIT 5
    `).all(projectId);

    res.json({ project, stats, episode_status, scene_status, recent_scenes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GLOBAL SEARCH
app.get('/api/search', (req, res) => {
  try {
    const db = getDb();
    const { q, project_id } = req.query;
    if (!q || !project_id) return res.status(400).json({ error: 'q and project_id required' });

    const term = `%${q}%`;
    const results = [];

    const charResults = db.prepare('SELECT id, name, role as subtitle, "character" as type FROM characters WHERE project_id = ? AND (name LIKE ? OR alias LIKE ? OR description LIKE ?)').all(project_id, term, term, term);
    results.push(...charResults);

    const epResults = db.prepare('SELECT id, title as name, summary as subtitle, "episode" as type FROM episodes WHERE project_id = ? AND (title LIKE ? OR summary LIKE ?)').all(project_id, term, term);
    results.push(...epResults);

    const sceneResults = db.prepare('SELECT id, title as name, summary as subtitle, "scene" as type FROM scenes WHERE project_id = ? AND (title LIKE ? OR summary LIKE ? OR dialogue LIKE ?)').all(project_id, term, term, term);
    results.push(...sceneResults);

    const locResults = db.prepare('SELECT id, name, description as subtitle, "location" as type FROM locations WHERE project_id = ? AND (name LIKE ? OR description LIKE ?)').all(project_id, term, term);
    results.push(...locResults);

    const itemResults = db.prepare('SELECT id, name, description as subtitle, "item" as type FROM items WHERE project_id = ? AND (name LIKE ? OR description LIKE ?)').all(project_id, term, term);
    results.push(...itemResults);

    const threadResults = db.prepare('SELECT id, title as name, description as subtitle, "story_thread" as type FROM story_threads WHERE project_id = ? AND (title LIKE ? OR description LIKE ?)').all(project_id, term, term);
    results.push(...threadResults);

    res.json(results.slice(0, 50));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PHASE 2: CONTINUITY & KNOWLEDGE ENDPOINTS
// ============================================================

// 1. KNOWLEDGE MATRIX (2D Grid: Characters × Facts)
app.get('/api/knowledge-matrix', (req, res) => {
  try {
    const db = getDb();
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ error: 'project_id required' });

    const characters = db.prepare('SELECT id, name, alias, role FROM characters WHERE project_id = ? ORDER BY sort_order ASC').all(project_id);
    const entries = db.prepare('SELECT * FROM knowledge_entries WHERE project_id = ?').all(project_id);

    const facts = [...new Set(entries.map(e => e.fact))];
    const matrix = {};
    for (const fact of facts) {
      matrix[fact] = {};
    }
    for (const e of entries) {
      if (!matrix[e.fact]) matrix[e.fact] = {};
      matrix[e.fact][e.character_id] = e;
    }

    res.json({ characters, facts, matrix, entries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. KNOWLEDGE ENTRY UPSERT
app.post('/api/knowledge-entries/upsert', (req, res) => {
  try {
    const db = getDb();
    const { project_id, character_id, fact, knowledge_state, learned_episode, learned_scene } = req.body;
    if (!project_id || !character_id || !fact) {
      return res.status(400).json({ error: 'project_id, character_id, and fact are required' });
    }

    const existing = db.prepare('SELECT * FROM knowledge_entries WHERE project_id = ? AND character_id = ? AND fact = ?').get(project_id, character_id, fact);
    if (existing) {
      db.prepare(`
        UPDATE knowledge_entries
        SET knowledge_state = ?, learned_episode = ?, learned_scene = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(knowledge_state || 'unknown', learned_episode || '', learned_scene || '', existing.id);
      const updated = db.prepare('SELECT * FROM knowledge_entries WHERE id = ?').get(existing.id);
      return res.json(updated);
    } else {
      const { v4: uuidv4 } = require('uuid');
      const id = uuidv4();
      db.prepare(`
        INSERT INTO knowledge_entries (id, project_id, character_id, fact, knowledge_state, learned_episode, learned_scene)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, project_id, character_id, fact, knowledge_state || 'unknown', learned_episode || '', learned_scene || '');
      const created = db.prepare('SELECT * FROM knowledge_entries WHERE id = ?').get(id);
      return res.status(201).json(created);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GENERATE SNAPSHOT FOR SCENE
app.post('/api/story-state-snapshots/generate/:sceneId', (req, res) => {
  try {
    const db = getDb();
    const sceneId = req.params.sceneId;
    const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(sceneId);
    if (!scene) return res.status(404).json({ error: 'Scene not found' });

    const projectId = scene.project_id;
    const { v4: uuidv4 } = require('uuid');

    // Parse scene character states
    let endingState = {};
    try {
      endingState = typeof scene.ending_state === 'string' ? JSON.parse(scene.ending_state || '{}') : (scene.ending_state || {});
    } catch (e) {
      endingState = {};
    }

    const charactersInScene = db.prepare('SELECT * FROM characters WHERE project_id = ?').all(projectId);
    const charMap = {};
    for (const char of charactersInScene) {
      const state = db.prepare('SELECT * FROM character_states WHERE character_id = ? ORDER BY created_at DESC LIMIT 1').get(char.id);
      charMap[char.name] = {
        location: state?.current_location || scene.title,
        outfit: state?.current_outfit || char.default_outfit,
        health: state?.health || 'normal',
        injuries: state?.injuries || 'none',
        emotion: state?.emotion || 'neutral',
        power: state?.power_level || '',
        inventory: state?.inventory ? JSON.parse(state.inventory) : []
      };
    }

    // Merge scene ending_state into characters
    for (const [key, val] of Object.entries(endingState)) {
      if (typeof val === 'object' && val !== null) {
        const foundName = Object.keys(charMap).find(n => n.toLowerCase().includes(key.toLowerCase().replace('_', ' ')));
        if (foundName) {
          charMap[foundName] = { ...charMap[foundName], ...val };
        }
      }
    }

    // Items
    const items = db.prepare('SELECT * FROM items WHERE project_id = ?').all(projectId);
    const itemMap = {};
    for (const item of items) {
      itemMap[item.name] = {
        owner: item.owner,
        location: item.current_location,
        condition: item.condition
      };
    }

    // Open threads
    const threads = db.prepare("SELECT title FROM story_threads WHERE project_id = ? AND status IN ('open', 'developing')").all(projectId).map(t => t.title);

    const snapshotData = {
      scene_number: scene.scene_number,
      scene_title: scene.title,
      location: scene.location_id ? (db.prepare('SELECT name FROM locations WHERE id = ?').get(scene.location_id)?.name || 'Vị trí') : 'Chưa định rõ',
      characters: charMap,
      items: itemMap,
      active_threads: threads,
      unresolved_injuries: Object.entries(charMap).filter(([_, c]) => c.injuries && c.injuries !== 'none' && c.injuries !== 'Không').map(([name, c]) => `${name}: ${c.injuries}`)
    };

    const snapId = uuidv4();
    db.prepare(`
      INSERT INTO story_state_snapshots (id, project_id, episode_id, scene_id, snapshot_data, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(snapId, projectId, scene.episode_id, scene.id, JSON.stringify(snapshotData));

    const saved = db.prepare('SELECT * FROM story_state_snapshots WHERE id = ?').get(snapId);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. SNAPSHOT DIFF (Compare 2 snapshots)
app.get('/api/story-state-snapshots/diff', (req, res) => {
  try {
    const db = getDb();
    const { fromId, toId } = req.query;
    if (!fromId || !toId) return res.status(400).json({ error: 'fromId and toId are required' });

    const snapA = db.prepare('SELECT * FROM story_state_snapshots WHERE id = ?').get(fromId);
    const snapB = db.prepare('SELECT * FROM story_state_snapshots WHERE id = ?').get(toId);
    if (!snapA || !snapB) return res.status(404).json({ error: 'One or both snapshots not found' });

    const dataA = JSON.parse(snapA.snapshot_data || '{}');
    const dataB = JSON.parse(snapB.snapshot_data || '{}');

    const characterDiffs = [];
    const allChars = new Set([...Object.keys(dataA.characters || {}), ...Object.keys(dataB.characters || {})]);
    for (const charName of allChars) {
      const cA = (dataA.characters && dataA.characters[charName]) || {};
      const cB = (dataB.characters && dataB.characters[charName]) || {};
      const changes = [];
      if (cA.location !== cB.location) changes.push({ field: 'Vị trí', from: cA.location || 'N/A', to: cB.location || 'N/A' });
      if (cA.outfit !== cB.outfit) changes.push({ field: 'Trang phục', from: cA.outfit || 'N/A', to: cB.outfit || 'N/A' });
      if (cA.health !== cB.health) changes.push({ field: 'Sức khỏe', from: cA.health || 'N/A', to: cB.health || 'N/A' });
      if (cA.injuries !== cB.injuries) changes.push({ field: 'Chấn thương', from: cA.injuries || 'N/A', to: cB.injuries || 'N/A' });
      if (cA.emotion !== cB.emotion) changes.push({ field: 'Cảm xúc', from: cA.emotion || 'N/A', to: cB.emotion || 'N/A' });
      if (cA.power !== cB.power) changes.push({ field: 'Thực lực', from: cA.power || 'N/A', to: cB.power || 'N/A' });
      if (changes.length > 0) {
        characterDiffs.push({ character: charName, changes });
      }
    }

    const itemDiffs = [];
    const allItems = new Set([...Object.keys(dataA.items || {}), ...Object.keys(dataB.items || {})]);
    for (const itemName of allItems) {
      const iA = (dataA.items && dataA.items[itemName]) || {};
      const iB = (dataB.items && dataB.items[itemName]) || {};
      const changes = [];
      if (iA.owner !== iB.owner) changes.push({ field: 'Người sở hữu', from: iA.owner || 'N/A', to: iB.owner || 'N/A' });
      if (iA.location !== iB.location) changes.push({ field: 'Vị trí', from: iA.location || 'N/A', to: iB.location || 'N/A' });
      if (iA.condition !== iB.condition) changes.push({ field: 'Tình trạng', from: iA.condition || 'N/A', to: iB.condition || 'N/A' });
      if (changes.length > 0) {
        itemDiffs.push({ item: itemName, changes });
      }
    }

    res.json({
      from: { id: snapA.id, scene_title: dataA.scene_title, scene_number: dataA.scene_number },
      to: { id: snapB.id, scene_title: dataB.scene_title, scene_number: dataB.scene_number },
      characterDiffs,
      itemDiffs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. CONTINUITY CHECK ENGINE
app.post('/api/continuity/check', (req, res) => {
  try {
    const db = getDb();
    const { scene_id, project_id, draft_content } = req.body;
    if (!project_id) return res.status(400).json({ error: 'project_id is required' });

    const errors = [];
    const warnings = [];
    const suggestions = [];

    // Fetch context
    const bible = db.prepare('SELECT * FROM project_bibles WHERE project_id = ?').get(project_id);
    const knowledge = db.prepare('SELECT * FROM knowledge_entries WHERE project_id = ?').all(project_id);
    const characters = db.prepare('SELECT * FROM characters WHERE project_id = ?').all(project_id);
    const items = db.prepare('SELECT * FROM items WHERE project_id = ?').all(project_id);

    let scene = null;
    let prevScene = null;
    if (scene_id) {
      scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(scene_id);
      if (scene) {
        prevScene = db.prepare('SELECT * FROM scenes WHERE episode_id = ? AND scene_number < ? ORDER BY scene_number DESC LIMIT 1').get(scene.episode_id, scene.scene_number);
      }
    }

    const textToAnalyze = `${draft_content || ''} ${scene?.dialogue || ''} ${scene?.action || ''} ${scene?.summary || ''}`;

    // CHECK 1: Knowledge Matrix Violation (Speaking secrets that character does not know)
    for (const char of characters) {
      const unknownFacts = knowledge.filter(k => k.character_id === char.id && k.knowledge_state === 'unknown');
      for (const uf of unknownFacts) {
        // Extract key terms
        const keyWords = uf.fact.toLowerCase().replace(/[(),.-]/g, '').split(' ').filter(w => w.length > 3);
        const matchCount = keyWords.filter(w => textToAnalyze.toLowerCase().includes(w)).length;
        if (matchCount >= 3) {
          warnings.push({
            type: 'knowledge_leak',
            title: `Nguy cơ lộ thông tin bí mật: "${uf.fact}"`,
            description: `Nhân vật [${char.name}] hiện đang ở trạng thái CHƯA BIẾT (unknown) đối với thông tin này, nhưng kịch bản dường như có đề cập đến nội dung liên quan.`
          });
        }
      }
    }

    // CHECK 2: Injury / Health Continuity
    if (prevScene) {
      let prevEnding = {};
      try {
        prevEnding = typeof prevScene.ending_state === 'string' ? JSON.parse(prevScene.ending_state || '{}') : (prevScene.ending_state || {});
      } catch (e) {}

      for (const [key, charState] of Object.entries(prevEnding)) {
        if (charState && (charState.health === 'critical' || charState.injuries)) {
          // Check if current scene explains medical treatment / healing
          const mentionsHeal = /chữa|lành|hệ thống trị|uống đan|thuốc|băng bó|bình phục/i.test(textToAnalyze);
          if (!mentionsHeal && scene && scene.scene_number === prevScene.scene_number + 1) {
            warnings.push({
              type: 'unresolved_injury',
              title: `Chấn thương chưa có diễn biến hợp lý từ Cảnh ${prevScene.scene_number}`,
              description: `Ở cảnh trước, nhân vật có chấn thương [${charState.injuries || 'nguy kịch'}]. Cảnh này chưa miêu tả việc chữa thương hoặc ảnh hưởng của vết thương lên hành động.`
            });
            suggestions.push(`Thêm 1 câu miêu tả vết thương rỉ máu gây đau đớn, hoặc giải thích nhân vật dùng đan dược/Hệ Thống để hồi phục.`);
          }
        }
      }
    }

    // CHECK 3: World Rules / Canon Violation (From Bible)
    if (bible && bible.world_rules) {
      const rules = bible.world_rules;
      if (/không có công nghệ|không dùng điện thoại/i.test(rules)) {
        if (/điện thoại|smartphone|laptop|internet|máy tính/i.test(textToAnalyze)) {
          errors.push({
            type: 'canon_violation',
            title: 'Vi phạm luật thế giới (World Rules)',
            description: 'Phát hiện thuật ngữ công nghệ hiện đại trong thế giới tu tiên cổ đại bị cấm bởi Bible.'
          });
        }
      }
    }

    // CHECK 4: Destroyed / Lost Items usage
    for (const item of items) {
      if (item.condition === 'lost' || item.condition === 'destroyed') {
        if (textToAnalyze.includes(item.name)) {
          errors.push({
            type: 'item_condition_error',
            title: `Vật phẩm đã hỏng/thất lạc: [${item.name}]`,
            description: `Vật phẩm "${item.name}" đang có trạng thái là "${item.condition}", nhưng lại xuất hiện trong cảnh quay.`
          });
        }
      }
    }

    // If no errors, add general approval suggestions
    if (errors.length === 0 && warnings.length === 0) {
      suggestions.push('Tính liên tục rất tốt: Vị trí, trạng thái chấn thương và bí mật của nhân vật hoàn toàn khớp với Canon.');
    }

    res.json({
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      checked_at: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// MASTER OUTLINE 1-CLICK IMPORT & VISUAL PROMPT GENERATOR
// ============================================================

// 1. Import Master Outline (Bible, Characters, Locations, Items, Episodes, Scenes)
app.post('/api/projects/:id/import-master-outline', (req, res) => {
  const db = getDb();
  const projectId = req.params.id;
  const data = req.body || {};

  try {
    const importTransaction = db.transaction(() => {
      // 0. Deduplication / Reset old outline if replaceExisting is true (default: true)
      const replaceExisting = data.replaceExisting !== false;
      if (replaceExisting) {
        db.prepare('DELETE FROM character_states WHERE project_id = ?').run(projectId);
        db.prepare('DELETE FROM characters WHERE project_id = ?').run(projectId);
        db.prepare('DELETE FROM locations WHERE project_id = ?').run(projectId);
        db.prepare('DELETE FROM items WHERE project_id = ?').run(projectId);
        db.prepare('DELETE FROM factions WHERE project_id = ?').run(projectId);
        db.prepare('DELETE FROM story_arcs WHERE project_id = ?').run(projectId);
        db.prepare('DELETE FROM story_threads WHERE project_id = ?').run(projectId);
        db.prepare('DELETE FROM scenes WHERE project_id = ?').run(projectId);
        db.prepare('DELETE FROM episodes WHERE project_id = ?').run(projectId);
      }

      // 1. Update Project Bible if present
      if (data.bible) {
        const b = data.bible;
        db.prepare(`
          UPDATE project_bibles 
          SET logline = COALESCE(?, logline),
              main_story_summary = COALESCE(?, main_story_summary),
              genre = COALESCE(?, genre),
              story_tone = COALESCE(?, story_tone),
              world_description = COALESCE(?, world_description),
              world_rules = COALESCE(?, world_rules),
              power_system = COALESCE(?, power_system),
              main_conflict = COALESCE(?, main_conflict),
              main_objective = COALESCE(?, main_objective),
              ending_direction = COALESCE(?, ending_direction),
              forbidden_changes = COALESCE(?, forbidden_changes),
              updated_at = CURRENT_TIMESTAMP
          WHERE project_id = ?
        `).run(
          b.logline || null,
          b.main_story_summary || null,
          b.genre || null,
          b.story_tone || null,
          b.world_description || null,
          b.world_rules || null,
          b.power_system || null,
          b.main_conflict || null,
          b.main_objective || null,
          b.ending_direction || null,
          b.forbidden_changes || null,
          projectId
        );
      }

      // 2. Insert Characters (with deduplication by name)
      const createdCharacters = [];
      if (Array.isArray(data.characters)) {
        for (const c of data.characters) {
          if (!c.name) continue;
          const existingChar = db.prepare('SELECT id FROM characters WHERE project_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?))').get(projectId, c.name);
          if (existingChar) continue; // Skip duplicate

          const charId = uuidv4();
          const rawRole = String(c.role || '').toLowerCase();
          let role = 'supporting';
          if (['main', 'supporting', 'enemy', 'npc'].includes(rawRole)) {
            role = rawRole;
          } else if (rawRole.includes('main') || rawRole.includes('chính') || rawRole === 'hero') {
            role = 'main';
          } else if (rawRole.includes('enemy') || rawRole.includes('villain') || rawRole.includes('phản') || rawRole === 'boss') {
            role = 'enemy';
          } else if (rawRole.includes('npc') || rawRole.includes('quần')) {
            role = 'npc';
          } else {
            role = 'supporting';
          }

          db.prepare(`
            INSERT INTO characters (
              id, project_id, name, alias, role, age, gender, height, description,
              appearance, default_outfit, personality, speaking_style, background,
              goal, motivation, strength, weakness, secret, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            charId, projectId,
            c.name || 'Nhân vật mới',
            c.alias || '',
            role,
            c.age || '20',
            c.gender || 'Nam',
            c.height || '175cm',
            c.description || '',
            c.appearance || '',
            c.default_outfit || 'Trang phục thường',
            c.personality || '',
            c.speaking_style || '',
            c.background || '',
            c.goal || '',
            c.motivation || '',
            c.strength || '',
            c.weakness || '',
            c.secret || '',
            'approved'
          );

          // Create initial character state
          db.prepare(`
            INSERT INTO character_states (
              id, character_id, project_id, current_location, current_outfit,
              health, injuries, emotion, power_level, inventory, knowledge
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            uuidv4(), charId, projectId,
            'Chưa xác định',
            c.default_outfit || 'Thường phục',
            'normal', '', 'neutral',
            c.power_level || 'Luyện Khí Tầng 1',
            '[]', '[]'
          );

          createdCharacters.push({ id: charId, name: c.name });
        }
      }

      // 3. Insert Locations (with deduplication by name)
      const createdLocations = [];
      if (Array.isArray(data.locations)) {
        for (const loc of data.locations) {
          if (!loc.name) continue;
          const existingLoc = db.prepare('SELECT id FROM locations WHERE project_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?))').get(projectId, loc.name);
          if (existingLoc) continue;

          const locId = uuidv4();
          db.prepare(`
            INSERT INTO locations (
              id, project_id, name, type, description, architecture, environment,
              colors, lighting, default_weather, important_objects, visual_prompt, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            locId, projectId,
            loc.name || 'Địa điểm mới',
            loc.type || 'outdoor',
            loc.description || '',
            loc.architecture || '',
            loc.environment || loc.atmosphere || '',
            loc.colors || loc.color_palette || 'Vibrant cinematic',
            loc.lighting || 'Dramatic lighting',
            loc.default_weather || 'Clear sky',
            loc.important_objects || loc.key_props || '',
            loc.visual_prompt || `${loc.name}, cinematic lighting, detailed background, 8k`,
            'approved'
          );
          createdLocations.push({ id: locId, name: loc.name });
        }
      }

      // 4. Insert Items (with deduplication by name)
      if (Array.isArray(data.items)) {
        for (const it of data.items) {
          if (!it.name) continue;
          const existingItem = db.prepare('SELECT id FROM items WHERE project_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?))').get(projectId, it.name);
          if (existingItem) continue;

          db.prepare(`
            INSERT INTO items (
              id, project_id, name, type, description, appearance,
              abilities, history, owner, current_location, condition, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            uuidv4(), projectId,
            it.name || 'Vật phẩm mới',
            it.type || 'weapon',
            it.description || '',
            it.appearance || it.visual_description || '',
            it.abilities || '',
            it.history || it.origin || '',
            it.owner || 'Chưa rõ',
            it.current_location || 'Chưa rõ',
            it.condition || 'normal',
            'approved'
          );
        }
      }

      // 5. Insert Story Threads (with deduplication)
      if (Array.isArray(data.storyThreads)) {
        for (const th of data.storyThreads) {
          if (!th.title) continue;
          const existingTh = db.prepare('SELECT id FROM story_threads WHERE project_id = ? AND LOWER(TRIM(title)) = LOWER(TRIM(?))').get(projectId, th.title);
          if (existingTh) continue;

          db.prepare(`
            INSERT INTO story_threads (
              id, project_id, title, description, priority, status
            ) VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            uuidv4(), projectId,
            th.title || 'Tuyến truyện mới',
            th.description || '',
            th.priority ? String(th.priority).toLowerCase() : 'normal',
            'open'
          );
        }
      }

      // 6. Insert or Auto-generate Factions & Sects
      let createdFactions = [];
      if (Array.isArray(data.factions) && data.factions.length > 0) {
        for (const f of data.factions) {
          if (!f.name) continue;
          const fid = uuidv4();
          const validAlign = ['ally', 'rival', 'enemy', 'neutral'];
          const align = validAlign.includes(String(f.alignment || '').toLowerCase()) ? String(f.alignment).toLowerCase() : 'neutral';
          db.prepare(`
            INSERT INTO factions (
              id, project_id, name, type, description, leader, alignment, headquarters, relationships, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            fid, projectId,
            f.name,
            f.type || 'cult',
            f.description || '',
            f.leader || 'Chưa rõ',
            align,
            f.headquarters || '',
            f.relationships || '',
            'approved'
          );
          createdFactions.push({ id: fid, name: f.name });
        }
      } else {
        // Auto-extract factions from story context
        const autoFactions = generateDefaultFactionsForProject(data);
        for (const f of autoFactions) {
          const fid = uuidv4();
          db.prepare(`
            INSERT INTO factions (
              id, project_id, name, type, description, leader, alignment, headquarters, relationships, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            fid, projectId,
            f.name, f.type, f.description, f.leader, f.alignment, f.headquarters, '', 'approved'
          );
          createdFactions.push({ id: fid, name: f.name });
        }
      }

      // 7. Insert or Auto-generate Story Arcs
      const rawEpisodes = Array.isArray(data.episodes) ? data.episodes : [];
      const totalEp = rawEpisodes.length || 20;
      let createdArcs = [];
      let arcMap = {}; // epNum -> arcId

      if (Array.isArray(data.arcs) && data.arcs.length > 0) {
        for (let i = 0; i < data.arcs.length; i++) {
          const a = data.arcs[i];
          const arcId = uuidv4();
          const startEp = a.start_episode || 1;
          const endEp = a.end_episode || totalEp;
          db.prepare(`
            INSERT INTO story_arcs (
              id, project_id, name, summary, goal, start_episode, end_episode, order_index, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            arcId, projectId,
            a.name || `Cung Truyện ${i + 1}`,
            a.summary || '',
            a.goal || '',
            startEp, endEp, i, 'approved'
          );
          createdArcs.push({ id: arcId, name: a.name, start: startEp, end: endEp });
          for (let ep = startEp; ep <= endEp; ep++) {
            arcMap[ep] = arcId;
          }
        }
      } else {
        // Auto-generate 3 logical Story Arcs based on total episodes
        const autoArcs = generateDefaultArcsForProject(data, totalEp);
        for (let i = 0; i < autoArcs.length; i++) {
          const a = autoArcs[i];
          const arcId = uuidv4();
          db.prepare(`
            INSERT INTO story_arcs (
              id, project_id, name, summary, goal, start_episode, end_episode, order_index, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            arcId, projectId,
            a.name, a.summary, a.goal, a.start_episode, a.end_episode, i, 'approved'
          );
          createdArcs.push({ id: arcId, name: a.name, start: a.start_episode, end: a.end_episode });
          for (let ep = a.start_episode; ep <= a.end_episode; ep++) {
            arcMap[ep] = arcId;
          }
        }
      }

      // 8. Insert Episodes & Scenes
      let createdEpisodeCount = 0;
      let createdSceneCount = 0;

      if (rawEpisodes.length > 0) {
        for (let i = 0; i < rawEpisodes.length; i++) {
          const ep = rawEpisodes[i];
          const epId = uuidv4();
          const epNum = ep.episode_number || (i + 1);
          const assignedArcId = arcMap[epNum] || null;

          db.prepare(`
            INSERT INTO episodes (
              id, project_id, arc_id, episode_number, title, summary, goal, opening_hook,
              main_conflict, climax, ending, cliffhanger, duration_target, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            epId, projectId, assignedArcId, epNum,
            ep.title || `Tập ${epNum}`,
            ep.summary || '',
            ep.goal || '',
            ep.opening_hook || '',
            ep.main_conflict || '',
            ep.climax || '',
            ep.ending || '',
            ep.ending_hook || ep.cliffhanger || '',
            ep.estimated_duration || ep.duration_target || 120,
            'draft'
          );
          createdEpisodeCount++;

          // If episode has nested scenes
          if (Array.isArray(ep.scenes) && ep.scenes.length > 0) {
            for (let j = 0; j < ep.scenes.length; j++) {
              const sc = ep.scenes[j];
              const scNum = sc.scene_number || (j + 1);
              db.prepare(`
                INSERT INTO scenes (
                  id, project_id, episode_id, scene_number, title, purpose, summary, action,
                  dialogue, emotion_change, transition, starting_state, ending_state, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(
                uuidv4(), projectId, epId, scNum,
                sc.title || `Cảnh ${scNum}`,
                sc.purpose || '',
                sc.summary || '',
                sc.action || '',
                sc.dialogue || '',
                sc.emotion_change || '',
                sc.transition || 'Cut',
                typeof sc.starting_state === 'object' ? JSON.stringify(sc.starting_state) : (sc.starting_state || '{}'),
                typeof sc.ending_state === 'object' ? JSON.stringify(sc.ending_state) : (sc.ending_state || '{}'),
                'draft'
              );
              createdSceneCount++;
            }
          }
        }
      }

      return {
        charactersCount: createdCharacters.length,
        locationsCount: createdLocations.length,
        factionsCount: createdFactions.length,
        arcsCount: createdArcs.length,
        episodesCount: createdEpisodeCount,
        scenesCount: createdSceneCount
      };
    });

    const result = importTransaction();
    res.json({
      success: true,
      message: 'Import toàn bộ dàn ý truyện thành công (Đã tối ưu và liên kết Arc/Phe phái)!',
      ...result
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi import dàn ý: ' + err.message });
  }
});

// Helper: Generate Default Arcs from Project Data
function generateDefaultArcsForProject(data, totalEp) {
  const p1 = Math.max(1, Math.round(totalEp * 0.3));
  const p2 = Math.min(totalEp - 1, Math.round(totalEp * 0.7));

  const logline = data.bible?.logline || '';
  const mainConflict = data.bible?.main_conflict || '';

  return [
    {
      name: 'Arc 1: Khởi Đầu & Hôn Nhân Định Mệnh',
      start_episode: 1,
      end_episode: p1,
      summary: `Mở đầu hành trình xuyên không/bước ngoặt định mệnh, cuộc gặp gỡ bất đắc dĩ và những thử thách sinh tử ban đầu từ tập 1 đến tập ${p1}.`,
      goal: 'Bảo vệ mái ấm, vượt qua các mâu thuẫn cục bộ tại địa phương và thức tỉnh năng lực bí ẩn.'
    },
    {
      name: 'Arc 2: Sóng Gió Huyện Thành & Thân Phận Phát Lộ',
      start_episode: p1 + 1,
      end_episode: p2,
      summary: `Quy mô xung đột mở rộng ra huyện thành và tông môn tà phái từ tập ${p1 + 1} đến tập ${p2}. Thân phận thật của các nhân vật dần bại lộ.`,
      goal: 'Điều tra nguồn gốc huyết mạch và bảo vật, xây dựng liên minh và đối phó với kẻ giật dây giấu mặt.'
    },
    {
      name: 'Arc 3: Đại Chiến Đỉnh Điểm & Mở Ra Tương Lai',
      start_episode: p2 + 1,
      end_episode: totalEp,
      summary: `Đỉnh điểm đối đầu sinh tử trước thềm Thiên Môn từ tập ${p2 + 1} đến tập ${totalEp}. Mở khóa toàn bộ thực lực và đối mặt với thực thể Thượng Giới.`,
      goal: 'Đập tan âm mưu của trùm phản diện, bảo vệ người quan trọng nhất và mở ra chương mới cho mùa tiếp theo.'
    }
  ];
}

// Helper: Generate Default Factions from Project Data
function generateDefaultFactionsForProject(data) {
  const factions = [];
  const chars = Array.isArray(data.characters) ? data.characters : [];
  const enemies = chars.filter(c => String(c.role || '').toLowerCase().includes('enemy'));
  const allies = chars.filter(c => String(c.role || '').toLowerCase().includes('main') || String(c.role || '').toLowerCase().includes('support'));

  // Enemy Faction
  const mainEnemy = enemies[0];
  factions.push({
    name: mainEnemy ? (mainEnemy.alias ? `${mainEnemy.name} Phái (${mainEnemy.alias})` : 'Huyết Ảnh Điện') : 'Huyết Ảnh Điện',
    type: 'cult',
    description: 'Thế lực hắc ám/tà phái thèm khát cổ vật và thao túng các quan lại địa phương để mở phong ấn cấm kỵ.',
    leader: mainEnemy ? mainEnemy.name : 'Hàn Thiên Sát',
    alignment: 'enemy',
    headquarters: 'Thiên Trụ Sơn / Sơn Trại Hắc Ám'
  });

  // Allied Clan / Family
  const nobleChar = chars.find(c => (c.secret && c.secret.includes('Vương')) || (c.description && c.description.includes('quận chúa')) || c.name.includes('Thanh Ly'));
  factions.push({
    name: nobleChar ? 'Bắc Cảnh Vương Phủ (Tô Gia Di Tộc)' : 'Gia Tộc Nhân Vật Chính',
    type: 'family',
    description: 'Danh gia vọng tộc từng nắm giữ binh quyền và thần vật, sau khi bị hãm hại chỉ còn sót lại những người thừa kế chân chính.',
    leader: nobleChar ? nobleChar.name : 'Tô Thanh Ly',
    alignment: 'ally',
    headquarters: 'Bắc Cảnh Phủ Cũ'
  });

  // Local authority / Bandits
  const bandit = chars.find(c => c.name.includes('Hổ') || (c.description && c.description.includes('ác bá')));
  factions.push({
    name: 'Hắc Phong Trại & Cường Hào Địa Phương',
    type: 'crime',
    description: 'Băng đảng thổ phỉ kết hợp cường hào áp bức dân chúng biên cảnh, bí mật tiếp tay cho các thế lực lớn.',
    leader: bandit ? bandit.name : 'Triệu Hổ',
    alignment: 'enemy',
    headquarters: 'Thanh Hà Thôn / Hắc Phong Trại'
  });

  // Mystery / Heavenly Faction
  factions.push({
    name: 'Thượng Cổ Thần Tộc (Thượng Giới)',
    type: 'cult',
    description: 'Tầng thế giới cao hơn đang âm thầm quan sát và thao túng vận mệnh nhân gian, đứng sau hiện tượng Ngoại Mệnh.',
    leader: 'Tiểu Cửu / Cự Thần Bí Ẩn',
    alignment: 'neutral',
    headquarters: 'Bên Kia Thiên Môn'
  });

  return factions;
}

// 1b. Auto-generate Story Arcs for a Project
app.post('/api/projects/:id/auto-generate-arcs', (req, res) => {
  const db = getDb();
  const projectId = req.params.id;

  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) return res.status(404).json({ error: 'Project không tồn tại' });

    const episodes = db.prepare('SELECT id, episode_number, title FROM episodes WHERE project_id = ? ORDER BY episode_number ASC').all(projectId);
    if (episodes.length === 0) {
      return res.status(400).json({ error: 'Dự án chưa có tập phim nào để phân chia Arc. Hãy tạo tập phim trước!' });
    }

    const bible = db.prepare('SELECT * FROM project_bibles WHERE project_id = ?').get(projectId) || {};
    const totalEp = episodes.length;

    const autoArcs = generateDefaultArcsForProject({ bible }, totalEp);

    const tx = db.transaction(() => {
      // Clear old arcs
      db.prepare('DELETE FROM story_arcs WHERE project_id = ?').run(projectId);

      const created = [];
      const arcMap = {};

      for (let i = 0; i < autoArcs.length; i++) {
        const a = autoArcs[i];
        const arcId = uuidv4();
        db.prepare(`
          INSERT INTO story_arcs (
            id, project_id, name, summary, goal, start_episode, end_episode, order_index, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          arcId, projectId,
          a.name, a.summary, a.goal, a.start_episode, a.end_episode, i, 'approved'
        );
        created.push({ id: arcId, ...a });

        for (let ep = a.start_episode; ep <= a.end_episode; ep++) {
          arcMap[ep] = arcId;
        }
      }

      // Update episodes with arc_id
      for (const ep of episodes) {
        const targetArcId = arcMap[ep.episode_number] || null;
        if (targetArcId) {
          db.prepare('UPDATE episodes SET arc_id = ? WHERE id = ?').run(targetArcId, ep.id);
        }
      }

      return created;
    });

    const result = tx();
    res.json({
      success: true,
      message: `Đã tự động tạo và phân bổ ${result.length} Cung Truyện Lớn cho ${episodes.length} tập phim!`,
      arcs: result
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo Story Arcs: ' + err.message });
  }
});

// 1c. Auto-generate Factions for a Project
app.post('/api/projects/:id/auto-generate-factions', (req, res) => {
  const db = getDb();
  const projectId = req.params.id;

  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) return res.status(404).json({ error: 'Project không tồn tại' });

    const bible = db.prepare('SELECT * FROM project_bibles WHERE project_id = ?').get(projectId) || {};
    const characters = db.prepare('SELECT * FROM characters WHERE project_id = ?').all(projectId);

    const autoFactions = generateDefaultFactionsForProject({ bible, characters });

    const tx = db.transaction(() => {
      // Clear old factions
      db.prepare('DELETE FROM factions WHERE project_id = ?').run(projectId);

      const created = [];
      for (const f of autoFactions) {
        const fid = uuidv4();
        db.prepare(`
          INSERT INTO factions (
            id, project_id, name, type, description, leader, alignment, headquarters, relationships, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          fid, projectId,
          f.name, f.type, f.description, f.leader, f.alignment, f.headquarters, '', 'approved'
        );
        created.push({ id: fid, ...f });
      }
      return created;
    });

    const result = tx();
    res.json({
      success: true,
      message: `Đã tự động phân tích và tạo ${result.length} Thế Lực / Phe Phái từ cốt truyện!`,
      factions: result
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo Factions: ' + err.message });
  }
});

// 1d. Clear All Snapshots for a Project
app.delete('/api/projects/:id/snapshots', (req, res) => {
  const db = getDb();
  const projectId = req.params.id;
  try {
    const result = db.prepare('DELETE FROM story_state_snapshots WHERE project_id = ?').run(projectId);
    res.json({ success: true, message: `Đã xóa ${result.changes} snapshots.` });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xóa snapshots: ' + err.message });
  }
});

// 2. Batch Import Detailed Scenes into an Episode
app.post('/api/episodes/:id/import-scenes', (req, res) => {
  const db = getDb();
  const episodeId = req.params.id;
  const { scenes: newScenes, replaceExisting } = req.body;

  if (!Array.isArray(newScenes) || newScenes.length === 0) {
    return res.status(400).json({ error: 'Danh sách cảnh quay trống' });
  }

  try {
    const episode = db.prepare('SELECT * FROM episodes WHERE id = ?').get(episodeId);
    if (!episode) return res.status(404).json({ error: 'Episode không tồn tại' });

    const importScenesTx = db.transaction(() => {
      let startSceneNum = 1;
      if (replaceExisting) {
        // Scenes can be referenced by continuity records. Detach those
        // references before deleting the old scenes, otherwise SQLite rejects
        // the replacement with a FOREIGN KEY constraint error.
        const oldSceneIds = db
          .prepare('SELECT id FROM scenes WHERE episode_id = ?')
          .all(episodeId)
          .map((scene) => scene.id);

        if (oldSceneIds.length > 0) {
          const placeholders = oldSceneIds.map(() => '?').join(', ');

          db.prepare(`
            UPDATE character_states
            SET scene_id = NULL
            WHERE scene_id IN (${placeholders})
          `).run(...oldSceneIds);

          db.prepare(`
            UPDATE character_relationships
            SET updated_scene_id = NULL
            WHERE updated_scene_id IN (${placeholders})
          `).run(...oldSceneIds);

          db.prepare(`
            UPDATE story_state_snapshots
            SET scene_id = NULL
            WHERE scene_id IN (${placeholders})
          `).run(...oldSceneIds);
        }

        db.prepare('DELETE FROM scenes WHERE episode_id = ?').run(episodeId);
      } else {
        const row = db.prepare('SELECT MAX(scene_number) as maxNum FROM scenes WHERE episode_id = ?').get(episodeId);
        startSceneNum = (row?.maxNum || 0) + 1;
      }

      const inserted = [];
      for (let i = 0; i < newScenes.length; i++) {
        const sc = newScenes[i];
        const scNum = replaceExisting ? (i + 1) : (startSceneNum + i);
        const sceneId = uuidv4();

        db.prepare(`
          INSERT INTO scenes (
            id, project_id, episode_id, scene_number, title, purpose, summary, action,
            dialogue, emotion_change, transition, starting_state, ending_state, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          sceneId, episode.project_id, episodeId, scNum,
          sc.title || `Cảnh ${scNum}`,
          sc.purpose || '',
          sc.summary || '',
          sc.action || '',
          sc.dialogue || '',
          sc.emotion_change || '',
          sc.transition || 'Cut',
          sc.starting_state ? (typeof sc.starting_state === 'object' ? JSON.stringify(sc.starting_state) : sc.starting_state) : '{}',
          sc.ending_state ? (typeof sc.ending_state === 'object' ? JSON.stringify(sc.ending_state) : sc.ending_state) : '{}',
          'draft'
        );

        inserted.push({ id: sceneId, scene_number: scNum, title: sc.title });
      }

      return inserted;
    });

    const result = importScenesTx();
    res.json({
      success: true,
      message: `Đã import ${result.length} cảnh quay vào tập phim!`,
      scenes: result
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi import scenes: ' + err.message });
  }
});

// 3. Generate Standardized Visual Prompt for Scene
app.get('/api/scenes/:id/visual-prompt', (req, res) => {
  const db = getDb();
  const sceneId = req.params.id;

  try {
    const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(sceneId);
    if (!scene) return res.status(404).json({ error: 'Scene không tồn tại' });

    const episode = db.prepare('SELECT * FROM episodes WHERE id = ?').get(scene.episode_id);
    const project = episode ? db.prepare('SELECT * FROM projects WHERE id = ?').get(episode.project_id) : null;

    // Parse characters and location
    let charList = [];
    try { charList = JSON.parse(scene.characters || '[]'); } catch { }

    let charPrompts = [];
    if (charList.length > 0) {
      const placeholders = charList.map(() => '?').join(', ');
      const chars = db.prepare(`SELECT name, appearance, default_outfit FROM characters WHERE id IN (${placeholders})`).all(...charList);
      charPrompts = chars.map(c => `${c.name}: ${c.appearance || ''}, wearing ${c.default_outfit || 'signature robes'}`);
    }

    let locPrompt = '';
    if (scene.location_id) {
      const loc = db.prepare('SELECT name, architecture, lighting, visual_prompt FROM locations WHERE id = ?').get(scene.location_id);
      if (loc) {
        locPrompt = loc.visual_prompt || `${loc.name}, ${loc.architecture || ''}, ${loc.lighting || 'cinematic lighting'}`;
      }
    }

    const ar = project?.aspect_ratio || '9:16';
    const visualStyle = project?.visual_style || 'Anime cinematic style, unreal engine 5 render, highly detailed';

    // Construct unified prompt
    const parts = [
      visualStyle,
      locPrompt ? `Environment: ${locPrompt}` : '',
      charPrompts.length > 0 ? `Characters: ${charPrompts.join('; ')}` : '',
      scene.action ? `Action: ${scene.action}` : '',
      scene.time_of_day ? `Time of day: ${scene.time_of_day}` : '',
      `aspect ratio ${ar}`,
      `--ar ${ar.replace(':', ':')}`
    ].filter(Boolean);

    res.json({
      scene_id: sceneId,
      aspect_ratio: ar,
      visual_prompt: parts.join(', ')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// START SERVER
// ============================================================
const db = getDb();
seedDemoData(db);
seedContinuityIfMissing(db);

app.listen(PORT, () => {
  console.log(`\n🎬 AI Video Studio Server`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  closeDb();
  process.exit(0);
});
