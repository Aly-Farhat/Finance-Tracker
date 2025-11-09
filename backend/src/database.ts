import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { config } from './config.js'
import { logger } from './logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.isAbsolute(config.databasePath) 
  ? config.databasePath 
  : path.join(__dirname, '..', config.databasePath)

export const db = new Database(dbPath)

// Database version for migrations
const CURRENT_DB_VERSION = 2

export function initDatabase() {
  try {
    logger.info('Initializing database...', { path: dbPath })
    
    // Enable foreign keys and WAL mode for better concurrency
    db.pragma('foreign_keys = ON')
    db.pragma('journal_mode = WAL')
    
    // Create migrations table
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Check current version
    const currentVersion = db.prepare('SELECT MAX(version) as version FROM migrations').get() as { version: number | null }
    const version = currentVersion?.version || 0
    
    // Run migrations
    if (version < 1) {
      runMigration1()
    }
    if (version < 2) {
      runMigration2()
    }
    
    logger.info('Database initialized successfully', { version: CURRENT_DB_VERSION })
  } catch (error) {
    logger.error('Failed to initialize database', { error })
    throw error
  }
}

function runMigration1() {
  logger.info('Running migration 1...')
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL CHECK(length(category) <= 50),
      amount REAL NOT NULL CHECK(amount > 0 AND amount <= 999999999),
      description TEXT CHECK(length(description) <= 500),
      date TEXT NOT NULL,
      source TEXT CHECK(length(source) <= 100),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)
  `)
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC)
  `)
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL CHECK(length(name) <= 100),
      target_amount REAL NOT NULL CHECK(target_amount > 0 AND target_amount <= 999999999),
      current_amount REAL NOT NULL DEFAULT 0 CHECK(current_amount >= 0 AND current_amount <= 999999999),
      deadline TEXT NOT NULL,
      color TEXT NOT NULL CHECK(color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline)
  `)
  
  // Create triggers for updated_at
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_transactions_timestamp 
    AFTER UPDATE ON transactions
    BEGIN
      UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `)
  
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_goals_timestamp 
    AFTER UPDATE ON goals
    BEGIN
      UPDATE goals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
  `)
  
  // Record migration
  db.prepare('INSERT INTO migrations (version) VALUES (?)').run(1)
  
  logger.info('Migration 1 completed')
}

function runMigration2() {
  logger.info('Running migration 2: Adding notes column to goals...')
  
  // Add notes column to goals table
  db.exec(`
    ALTER TABLE goals ADD COLUMN notes TEXT CHECK(length(notes) <= 1000)
  `)
  
  // Record migration
  db.prepare('INSERT INTO migrations (version) VALUES (?)').run(2)
  
  logger.info('Migration 2 completed')
}

export function generateId(): string {
  return uuidv4()
}

// Backup database function
export function backupDatabase(): string {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = dbPath.replace('.db', `_backup_${timestamp}.db`)
    
    db.backup(backupPath)
    logger.info('Database backup created', { path: backupPath })
    
    return backupPath
  } catch (error) {
    logger.error('Failed to create database backup', { error })
    throw error
  }
}

