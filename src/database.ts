import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface Player {
  id?: number;
  name: string;
  rank: number;
  level: number;
  xp: number;
  firstSeen: number;
  lastSeen: number;
  isActive: boolean;
}

export interface XPHistory {
  id?: number;
  playerId: number;
  rank: number;
  xp: number;
  timestamp: number;
}

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string = path.join(__dirname, '../data/leaderboard.db')) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  private initDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        rank INTEGER NOT NULL,
        level INTEGER NOT NULL,
        xp INTEGER NOT NULL,
        firstSeen INTEGER NOT NULL,
        lastSeen INTEGER NOT NULL,
        isActive BOOLEAN NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS xp_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playerId INTEGER NOT NULL,
        rank INTEGER NOT NULL,
        xp INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (playerId) REFERENCES players(id)
      );

      CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
      CREATE INDEX IF NOT EXISTS idx_players_active ON players(isActive);
      CREATE INDEX IF NOT EXISTS idx_xp_history_player ON xp_history(playerId);
      CREATE INDEX IF NOT EXISTS idx_xp_history_timestamp ON xp_history(timestamp);
    `);
  }

  upsertPlayer(player: Omit<Player, 'id'>): number {
    const existing = this.db.prepare('SELECT id, firstSeen FROM players WHERE name = ?').get(player.name) as { id: number, firstSeen: number } | undefined;

    if (existing) {
      this.db.prepare(`
        UPDATE players 
        SET rank = ?, level = ?, xp = ?, lastSeen = ?, isActive = ?
        WHERE id = ?
      `).run(player.rank, player.level, player.xp, player.lastSeen, player.isActive ? 1 : 0, existing.id);
      return existing.id;
    } else {
      const result = this.db.prepare(`
        INSERT INTO players (name, rank, level, xp, firstSeen, lastSeen, isActive)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(player.name, player.rank, player.level, player.xp, player.firstSeen, player.lastSeen, player.isActive ? 1 : 0);
      return result.lastInsertRowid as number;
    }
  }

  addXPHistory(history: Omit<XPHistory, 'id'>): void {
    this.db.prepare(`
      INSERT INTO xp_history (playerId, rank, xp, timestamp)
      VALUES (?, ?, ?, ?)
    `).run(history.playerId, history.rank, history.xp, history.timestamp);
  }

  getPlayer(name: string): Player | undefined {
    return this.db.prepare('SELECT * FROM players WHERE name = ?').get(name) as Player | undefined;
  }

  getActivePlayers(): Player[] {
    return this.db.prepare('SELECT * FROM players WHERE isActive = 1 ORDER BY rank').all() as Player[];
  }

  getPlayerHistory(playerId: number, limit: number = 100): XPHistory[] {
    return this.db.prepare(`
      SELECT * FROM xp_history 
      WHERE playerId = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(playerId, limit) as XPHistory[];
  }

  deactivatePlayer(name: string): void {
    this.db.prepare('UPDATE players SET isActive = 0 WHERE name = ?').run(name);
  }

  close(): void {
    this.db.close();
  }
}
