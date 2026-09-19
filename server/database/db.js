/**
 * AI Video Studio — Database Connection
 * SQLite + better-sqlite3
 */

const Database = require('better-sqlite3');
const path = require('path');
const { SCHEMA_SQL } = require('./schema');

const DB_PATH = path.join(__dirname, '..', 'data', 'ai-video-studio.db');

let db = null;

function ensureSchemaMigrations(database) {
  // CREATE TABLE IF NOT EXISTS does not add new columns to an existing demo
  // database. Keep Phase 3 identity-lock fields compatible with old DB files.
  const shotColumns = database.pragma('table_info(shots)').map((column) => column.name);
  if (!shotColumns.includes('character_ids')) {
    database.exec("ALTER TABLE shots ADD COLUMN character_ids TEXT DEFAULT '[]'");
  }
  if (!shotColumns.includes('reference_asset_ids')) {
    database.exec("ALTER TABLE shots ADD COLUMN reference_asset_ids TEXT DEFAULT '[]'");
  }
  if (!shotColumns.includes('start_frame_asset_ids')) {
    database.exec("ALTER TABLE shots ADD COLUMN start_frame_asset_ids TEXT DEFAULT '[]'");
  }
  if (!shotColumns.includes('end_frame_asset_ids')) {
    database.exec("ALTER TABLE shots ADD COLUMN end_frame_asset_ids TEXT DEFAULT '[]'");
  }
  for (const column of ['start_frame_prompt', 'end_frame_prompt', 'flow_transition_prompt']) {
    if (!shotColumns.includes(column)) {
      database.exec("ALTER TABLE shots ADD COLUMN " + column + " TEXT DEFAULT ''");
    }
  }

  const episodeColumns = database.pragma('table_info(episodes)').map((column) => column.name);
  for (const column of ['duration_min', 'duration_max', 'content_density', 'word_budget', 'planned_duration', 'duration_notes']) {
    if (!episodeColumns.includes(column)) {
      database.exec("ALTER TABLE episodes ADD COLUMN " + column + " " + (column === 'content_density' || column === 'duration_notes' ? "TEXT DEFAULT ''" : "INTEGER DEFAULT 0"));
    }
  }
  if (!episodeColumns.includes('duration_min')) database.exec("UPDATE episodes SET duration_min = 90 WHERE duration_min IS NULL OR duration_min = 0");
  if (!episodeColumns.includes('duration_max')) database.exec("UPDATE episodes SET duration_max = 300 WHERE duration_max IS NULL OR duration_max = 0");
  database.exec("UPDATE episodes SET content_density = 'adaptive' WHERE content_density IS NULL OR content_density = ''");

  const assetColumns = database.pragma('table_info(assets)').map((column) => column.name);
  if (!assetColumns.includes('reference_kind')) {
    database.exec("ALTER TABLE assets ADD COLUMN reference_kind TEXT DEFAULT ''");
  }

  const characterColumns = database.pragma('table_info(characters)').map((column) => column.name);
  if (!characterColumns.includes('apparent_age')) {
    database.exec("ALTER TABLE characters ADD COLUMN apparent_age TEXT DEFAULT ''");
  }

  const sceneColumns = database.pragma('table_info(scenes)').map((column) => column.name);
  for (const column of ['character_prompt', 'image_prompt', 'video_prompt']) {
    if (!sceneColumns.includes(column)) {
      database.exec("ALTER TABLE scenes ADD COLUMN " + column + " TEXT DEFAULT ''");
    }
  }
  if (!sceneColumns.includes('character_appearances')) {
    database.exec("ALTER TABLE scenes ADD COLUMN character_appearances TEXT DEFAULT '{}'");
  }
}

function getDb() {
  if (!db) {
    // Tạo thư mục data nếu chưa có
    const fs = require('fs');
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH);

    // Performance settings
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Tạo schema
    db.exec(SCHEMA_SQL);
    ensureSchemaMigrations(db);

    console.log(`[DB] Connected: ${DB_PATH}`);
  }
  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
    console.log('[DB] Connection closed');
  }
}

module.exports = { getDb, closeDb };
