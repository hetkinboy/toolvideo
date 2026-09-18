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

  const assetColumns = database.pragma('table_info(assets)').map((column) => column.name);
  if (!assetColumns.includes('reference_kind')) {
    database.exec("ALTER TABLE assets ADD COLUMN reference_kind TEXT DEFAULT ''");
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
