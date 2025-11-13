import { DatabaseService } from './database';
import { LeaderboardApi, LeaderboardEntry } from './leaderboard-api';

export class LeaderboardMonitor {
  private db: DatabaseService;
  private scraper: LeaderboardApi;
  private intervalId?: NodeJS.Timeout;

  constructor(dbPath?: string) {
    this.db = new DatabaseService(dbPath);
    this.scraper = new LeaderboardApi();
  }

  async update(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Fetching leaderboard...`);
      const entries = await this.scraper.fetchTop50();
      console.log(`[${new Date().toISOString()}] Fetched ${entries.length} entries`);

      const timestamp = Date.now();
      const currentTop50Names = new Set(entries.map(e => e.name));
      const activePlayers = this.db.getActivePlayers();
      
      for (const player of activePlayers) {
        if (!currentTop50Names.has(player.name)) {
          console.log(`[${new Date().toISOString()}] Player ${player.name} dropped out of top 50`);
          this.db.deactivatePlayer(player.name);
        }
      }

      for (const entry of entries) {
        const existingPlayer = this.db.getPlayer(entry.name);
        
        if (!existingPlayer) {
          console.log(`[${new Date().toISOString()}] New player in top 50: ${entry.name} (Rank: ${entry.rank}, XP: ${entry.xp.toLocaleString()})`);
          const playerId = this.db.upsertPlayer({
            name: entry.name,
            rank: entry.rank,
            level: entry.level,
            xp: entry.xp,
            firstSeen: timestamp,
            lastSeen: timestamp,
            isActive: true
          });
          
          this.db.addXPHistory({
            playerId,
            rank: entry.rank,
            xp: entry.xp,
            timestamp
          });
        } else {
          const playerId = this.db.upsertPlayer({
            name: entry.name,
            rank: entry.rank,
            level: entry.level,
            xp: entry.xp,
            firstSeen: existingPlayer.firstSeen,
            lastSeen: timestamp,
            isActive: true
          });

          if (existingPlayer.xp !== entry.xp) {
            const xpGain = entry.xp - existingPlayer.xp;
            console.log(`[${new Date().toISOString()}] ${entry.name}: XP ${existingPlayer.xp.toLocaleString()} -> ${entry.xp.toLocaleString()} (+${xpGain.toLocaleString()})`);
            
            this.db.addXPHistory({
              playerId,
              rank: entry.rank,
              xp: entry.xp,
              timestamp
            });
          }
        }
      }

      console.log(`[${new Date().toISOString()}] Update complete`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error updating leaderboard:`, error);
    }
  }

  start(intervalMinutes: number = 5): void {
    console.log(`Starting monitor with ${intervalMinutes} minute interval`);
    this.update();
    
    this.intervalId = setInterval(() => {
      this.update();
    }, intervalMinutes * 60 * 1000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.db.close();
  }
}
