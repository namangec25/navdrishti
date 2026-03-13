// ============================================================
// NavDrishti Backend - Database Setup (sql.js / WASM SQLite)
// ============================================================
// Uses sql.js (pure JS/WASM) so no native build tools needed.
// Data is persisted to a file on disk.
// ============================================================

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'navdrishti.db');

let db = null;

// ---- Initialize Database ----
async function initDB() {
  const SQL = await initSqlJs();

  // Load existing database file if it exists
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'guardian',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS children (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guardian_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      device_id TEXT,
      avatar TEXT DEFAULT '👦',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guardian_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      child_id INTEGER REFERENCES children(id) ON DELETE SET NULL,
      route_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS waypoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      image_url TEXT,
      voice_url TEXT,
      instruction_text TEXT,
      step_number INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS location_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
  console.log('  ✅ Database initialized');
  return db;
}

// ---- Save database to file ----
function saveDB() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// ---- Helper: Run a query and return results as array of objects ----
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// ---- Helper: Run a query and return first result as object ----
function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

// ---- Helper: Run an insert/update/delete and return lastInsertRowid ----
function runSql(sql, params = []) {
  db.run(sql, params);
  saveDB();
  const result = queryOne('SELECT last_insert_rowid() as id');
  return { lastInsertRowid: result ? result.id : 0 };
}

// ---- Helper: Run SQL without returning lastInsertRowid ----
function execSql(sql, params = []) {
  db.run(sql, params);
  saveDB();
}

module.exports = { initDB, queryAll, queryOne, runSql, execSql, saveDB };
