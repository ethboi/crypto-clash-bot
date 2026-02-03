import { LeaderboardEntry } from '../templates/leaderboard'

// Leaderboard data interface matching expected database structure
export interface LeaderboardData {
  id: string
  address: string
  displayName?: string
  pnl: number
  trades: number
  wins: number
  losses: number
  volume: number
  lastUpdated: Date
}

class LeaderboardService {
  // In production, this would connect to your database
  // For now, we provide the interface and mock data capability

  async getTopTraders(limit = 25): Promise<LeaderboardEntry[]> {
    const data = await this.fetchLeaderboardData('desc', limit)
    return this.mapToLeaderboardEntries(data)
  }

  async getBottomTraders(limit = 25): Promise<LeaderboardEntry[]> {
    const data = await this.fetchLeaderboardData('asc', limit)
    return this.mapToLeaderboardEntries(data)
  }

  async getDailyLeaderboard(date: Date, limit = 25): Promise<LeaderboardEntry[]> {
    // TODO: Implement daily filtering when database is connected
    const data = await this.fetchLeaderboardData('desc', limit)
    return this.mapToLeaderboardEntries(data)
  }

  async getWeeklyLeaderboard(startDate: Date, endDate: Date, limit = 25): Promise<LeaderboardEntry[]> {
    // TODO: Implement weekly filtering when database is connected
    const data = await this.fetchLeaderboardData('desc', limit)
    return this.mapToLeaderboardEntries(data)
  }

  private async fetchLeaderboardData(
    orderDirection: 'asc' | 'desc',
    limit: number,
  ): Promise<LeaderboardData[]> {
    // TODO: Replace with actual database query
    // Example with Prisma:
    // return await prisma.leaderboard.findMany({
    //   orderBy: { pnl: orderDirection },
    //   take: limit,
    // })

    // For now, return empty array - will be populated when DB is connected
    console.log(`Fetching leaderboard data: order=${orderDirection}, limit=${limit}`)
    return []
  }

  private mapToLeaderboardEntries(data: LeaderboardData[]): LeaderboardEntry[] {
    return data.map((item, index) => ({
      rank: index + 1,
      address: item.address,
      displayName: item.displayName,
      pnl: item.pnl,
      trades: item.trades,
      winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0,
      volume: item.volume,
    }))
  }

  // Helper to create mock data for testing
  createMockEntry(rank: number, overrides?: Partial<LeaderboardEntry>): LeaderboardEntry {
    return {
      rank,
      address: `0x${rank.toString().padStart(40, '0')}`,
      pnl: Math.random() * 100000 - 50000,
      trades: Math.floor(Math.random() * 1000),
      winRate: Math.random() * 100,
      volume: Math.random() * 1000000,
      ...overrides,
    }
  }

  // Generate mock data for testing
  getMockLeaderboard(count = 25, isTop = true): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = []
    for (let i = 1; i <= count; i++) {
      const pnl = isTop
        ? Math.random() * 100000 + 10000 // Positive for top
        : -(Math.random() * 100000 + 10000) // Negative for bottom

      entries.push(this.createMockEntry(i, { pnl }))
    }
    return entries
  }
}

export const leaderboardService = new LeaderboardService()
