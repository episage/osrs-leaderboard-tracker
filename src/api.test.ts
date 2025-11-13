import request from 'supertest';
import { createApiServer } from './api';
import { DatabaseService } from './database';
import fs from 'fs';
import path from 'path';
import { Express } from 'express';

describe('API Server', () => {
  let app: Express;
  let db: DatabaseService;
  const testDbPath = path.join(__dirname, 'test-api.db');

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = new DatabaseService(testDbPath);
    app = createApiServer(testDbPath);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('GET /health', () => {
    it('should return ok status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('GET /api/players', () => {
    it('should return empty list when no players', async () => {
      const response = await request(app).get('/api/players');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toEqual([]);
    });

    it('should return active players', async () => {
      const now = Date.now();
      db.upsertPlayer({
        name: 'Player1',
        rank: 1,
        level: 2277,
        xp: 1000000,
        firstSeen: now,
        lastSeen: now,
        isActive: true
      });

      db.upsertPlayer({
        name: 'Player2',
        rank: 2,
        level: 2277,
        xp: 900000,
        firstSeen: now,
        lastSeen: now,
        isActive: true
      });

      const response = await request(app).get('/api/players');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/players/:name', () => {
    it('should return 404 for non-existent player', async () => {
      const response = await request(app).get('/api/players/NonExistent');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return player data', async () => {
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

      const response = await request(app).get('/api/players/TestPlayer');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('TestPlayer');
      expect(response.body.data.xp).toBe(1000000);
    });
  });

  describe('GET /api/players/:name/history', () => {
    it('should return 404 for non-existent player', async () => {
      const response = await request(app).get('/api/players/NonExistent/history');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return player history', async () => {
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

      const response = await request(app).get('/api/players/TestPlayer/history');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.player.name).toBe('TestPlayer');
    });
  });
});
