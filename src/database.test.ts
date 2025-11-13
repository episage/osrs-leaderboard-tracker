import { DatabaseService } from './database';
import fs from 'fs';
import path from 'path';

describe('DatabaseService', () => {
  let db: DatabaseService;
  const testDbPath = path.join(__dirname, 'test.db');

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = new DatabaseService(testDbPath);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('upsertPlayer', () => {
    it('should insert a new player', () => {
      const playerId = db.upsertPlayer({
        name: 'TestPlayer',
        rank: 1,
        level: 2277,
        xp: 1000000,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        isActive: true
      });

      expect(playerId).toBeGreaterThan(0);
      
      const player = db.getPlayer('TestPlayer');
      expect(player).toBeDefined();
      expect(player?.name).toBe('TestPlayer');
      expect(player?.rank).toBe(1);
      expect(player?.xp).toBe(1000000);
    });

    it('should update an existing player', () => {
      const timestamp1 = Date.now();
      const playerId1 = db.upsertPlayer({
        name: 'TestPlayer',
        rank: 1,
        level: 2277,
        xp: 1000000,
        firstSeen: timestamp1,
        lastSeen: timestamp1,
        isActive: true
      });

      const timestamp2 = Date.now() + 1000;
      const playerId2 = db.upsertPlayer({
        name: 'TestPlayer',
        rank: 2,
        level: 2277,
        xp: 1500000,
        firstSeen: timestamp1,
        lastSeen: timestamp2,
        isActive: true
      });

      expect(playerId1).toBe(playerId2);
      
      const player = db.getPlayer('TestPlayer');
      expect(player?.rank).toBe(2);
      expect(player?.xp).toBe(1500000);
      expect(player?.firstSeen).toBe(timestamp1); // Should preserve first seen
    });
  });

  describe('getActivePlayers', () => {
    it('should return only active players', () => {
      const now = Date.now();
      
      db.upsertPlayer({
        name: 'ActivePlayer1',
        rank: 1,
        level: 2277,
        xp: 1000000,
        firstSeen: now,
        lastSeen: now,
        isActive: true
      });

      db.upsertPlayer({
        name: 'ActivePlayer2',
        rank: 2,
        level: 2277,
        xp: 900000,
        firstSeen: now,
        lastSeen: now,
        isActive: true
      });

      db.upsertPlayer({
        name: 'InactivePlayer',
        rank: 100,
        level: 2000,
        xp: 500000,
        firstSeen: now,
        lastSeen: now,
        isActive: false
      });

      const activePlayers = db.getActivePlayers();
      expect(activePlayers).toHaveLength(2);
      expect(activePlayers[0].name).toBe('ActivePlayer1');
      expect(activePlayers[1].name).toBe('ActivePlayer2');
    });
  });

  describe('XP History', () => {
    it('should add and retrieve XP history', () => {
      const now = Date.now();
      const playerId = db.upsertPlayer({
        name: 'TestPlayer',
        rank: 1,
        level: 2277,
        xp: 1000000,
        firstSeen: now,
        lastSeen: now,
        isActive: true
      });

      db.addXPHistory({
        playerId,
        rank: 1,
        xp: 1000000,
        timestamp: now
      });

      db.addXPHistory({
        playerId,
        rank: 1,
        xp: 1100000,
        timestamp: now + 1000
      });

      const history = db.getPlayerHistory(playerId);
      expect(history).toHaveLength(2);
      expect(history[0].xp).toBe(1100000); // Most recent first
      expect(history[1].xp).toBe(1000000);
    });
  });

  describe('deactivatePlayer', () => {
    it('should deactivate a player', () => {
      const now = Date.now();
      db.upsertPlayer({
        name: 'TestPlayer',
        rank: 1,
        level: 2277,
        xp: 1000000,
        firstSeen: now,
        lastSeen: now,
        isActive: true
      });

      db.deactivatePlayer('TestPlayer');

      const player = db.getPlayer('TestPlayer');
      expect(player?.isActive).toBeFalsy();
    });
  });
});
