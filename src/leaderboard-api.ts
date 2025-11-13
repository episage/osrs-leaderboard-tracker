export interface LeaderboardEntry {
  rank: number;
  name: string;
  level: number;
  xp: number;
}

interface ApiResponse {
  name: string;
  score: string;
  rank: string;
}

export class LeaderboardApi {
  private readonly apiUrl = 'https://secure.runescape.com/m=hiscore_oldschool_ultimate/ranking.json';

  async fetchTop50(): Promise<LeaderboardEntry[]> {
    try {
      const url = `${this.apiUrl}?table=0&category=0&size=50`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json() as ApiResponse[];
      return this.parseApiResponse(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  private parseApiResponse(data: ApiResponse[]): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [];

    for (const item of data) {
      const rank = parseInt(item.rank);
      const xp = parseInt(item.score.replace(/,/g, ''));
      
      if (isNaN(rank) || isNaN(xp)) continue;

      const level = 2277; // Top 50 players are maxed

      entries.push({
        rank,
        name: item.name,
        level,
        xp
      });
    }

    return entries.slice(0, 50);
  }
}
