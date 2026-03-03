/**
 * SQLite database initialisation using better-sqlite3.
 *
 * Tables: users, payments, subscriptions.
 * WAL mode is enabled for better concurrent-read performance.
 */

import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'photobooth.db');

const db = new Database(DB_PATH);

// Enable WAL for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Users ──────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    name          TEXT    NOT NULL DEFAULT '',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// ── Payments ───────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL REFERENCES users(id),
    plan_id             TEXT    NOT NULL,
    amount              INTEGER NOT NULL,
    currency            TEXT    NOT NULL DEFAULT 'PHP',
    status              TEXT    NOT NULL DEFAULT 'pending',
    payment_method      TEXT,
    xendit_external_id  TEXT    NOT NULL UNIQUE,
    xendit_invoice_id   TEXT,
    checkout_url        TEXT,
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT    NOT NULL DEFAULT (datetime('now')),
    paid_at             TEXT
  );
`);

// ── Subscriptions ──────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id),
    plan_id       TEXT    NOT NULL,
    status        TEXT    NOT NULL DEFAULT 'active',
    start_date    TEXT    NOT NULL,
    end_date      TEXT    NOT NULL,
    active_until  TEXT    NOT NULL,
    auto_renew    INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// ── Desktop Auth Codes ─────────────────────────────────────────────
// Short-lived, one-time-use authorization codes for the desktop ↔ website
// OAuth-style handoff. The website generates a code after successful auth,
// then the desktop app exchanges it for a long-lived JWT.
db.exec(`
  CREATE TABLE IF NOT EXISTS auth_codes (
    code       TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    expires_at TEXT    NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

export default db;
