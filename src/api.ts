import express, { Request, Response } from 'express';
import { DatabaseService } from './database';

export function createApiServer(dbPath?: string) {
  const app = express();
  const db = new DatabaseService(dbPath);

  app.use(express.json());

  app.get('/api/players', (req: Request, res: Response) => {
    try {
      const players = db.getActivePlayers();
      res.json({
        success: true,
        count: players.length,
        data: players
      });
    } catch (error) {
      console.error('Error fetching players:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  app.get('/api/players/:name', (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const player = db.getPlayer(name);
      
      if (!player) {
        res.status(404).json({
          success: false,
          error: 'Player not found'
        });
        return;
      }

      res.json({
        success: true,
        data: player
      });
    } catch (error) {
      console.error('Error fetching player:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  app.get('/api/players/:name/history', (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const player = db.getPlayer(name);
      if (!player || !player.id) {
        res.status(404).json({
          success: false,
          error: 'Player not found'
        });
        return;
      }

      const history = db.getPlayerHistory(player.id, limit);
      res.json({
        success: true,
        player: {
          name: player.name,
          currentRank: player.rank,
          currentXp: player.xp
        },
        count: history.length,
        data: history
      });
    } catch (error) {
      console.error('Error fetching player history:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  return app;
}
