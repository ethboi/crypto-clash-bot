import { ObjectId } from 'mongodb'
import { getDb } from './db'

// ==================== INTERFACES ====================

export interface Tournament {
  _id?: ObjectId
  seasonId: ObjectId
  name: string
  description?: string
  startDate: Date
  endDate: Date
  lockDate: Date
  status: 'upcoming' | 'active' | 'ended'
  weekNumber: number
  leagueCategory: string
  prizes?: TournamentPrize[]
  createdAt: Date
  updatedAt: Date
}

export interface TournamentPrize {
  position: number
  patronNFTs: number
  clashTokens: number
}

export interface TournamentResult {
  _id?: ObjectId
  tournamentId: ObjectId
  seasonId: ObjectId
  tournamentName: string
  leagueCategory: string
  weekNumber: number
  userId: string
  playerName?: string
  finalRank: number
  totalParticipants: number
  finalScore: number
  selectedCrypto: string
  direction: 'up' | 'down'
  prizeAwarded?: {
    patronNFTs: number
    clashTokens: number
  }
  startDate: Date
  endDate: Date
  completedAt: Date
  createdAt: Date
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  playerName?: string
  totalScore: number
  selectedCrypto?: string
  direction?: 'up' | 'down'
}

export interface PriceChanges {
  [symbol: string]: number // percentage change
}

// ==================== SERVICE ====================

class TournamentReportService {
  /**
   * Get the currently active tournament
   */
  async getActiveTournament(): Promise<Tournament | null> {
    const db = await getDb()
    const tournament = await db
      .collection('tournaments')
      .findOne({ status: 'active' }) as Tournament | null
    return tournament
  }

  /**
   * Get upcoming tournaments
   */
  async getUpcomingTournaments(): Promise<Tournament[]> {
    const db = await getDb()
    const tournaments = await db
      .collection('tournaments')
      .find({ status: 'upcoming' })
      .sort({ startDate: 1 })
      .toArray() as Tournament[]
    return tournaments
  }

  /**
   * Get tournament by ID
   */
  async getTournament(tournamentId: string): Promise<Tournament | null> {
    const db = await getDb()
    return await db
      .collection('tournaments')
      .findOne({ _id: new ObjectId(tournamentId) }) as Tournament | null
  }

  /**
   * Get tournaments that were recently finalized (have results, ended in last 24h)
   */
  async getRecentlyFinalized(): Promise<Tournament[]> {
    const db = await getDb()
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Find ended tournaments
    const endedTournaments = await db
      .collection('tournaments')
      .find({ status: 'ended', endDate: { $gte: cutoff } })
      .toArray() as Tournament[]

    // Check which ones have results
    const finalized: Tournament[] = []
    for (const t of endedTournaments) {
      const resultCount = await db
        .collection('tournamentResults')
        .countDocuments({ tournamentId: t._id })
      if (resultCount > 0) {
        finalized.push(t)
      }
    }

    return finalized
  }

  /**
   * Get leaderboard for a tournament using hourly scores aggregation
   */
  async getLeaderboard(tournamentId: string, limit = 50): Promise<LeaderboardEntry[]> {
    const db = await getDb()
    const tournamentObjectId = new ObjectId(tournamentId)

    // Aggregate hourly scores → daily → cumulative per user
    const scoreAggregation = await db
      .collection('tournamentHourlyScores')
      .aggregate([
        { $match: { tournamentId: tournamentObjectId } },
        {
          $addFields: {
            dateKey: { $dateToString: { format: '%Y-%m-%d', date: '$hour' } },
          },
        },
        { $sort: { hour: 1 } },
        {
          $group: {
            _id: { userId: { $toLower: '$userId' }, dateKey: '$dateKey' },
            dailyScore: { $last: '$score' },
          },
        },
        {
          $group: {
            _id: '$_id.userId',
            cumulativeScore: { $sum: '$dailyScore' },
          },
        },
      ])
      .toArray()

    const participantScores = new Map<string, number>()
    scoreAggregation.forEach((r: any) => {
      participantScores.set(r._id, r.cumulativeScore || 0)
    })

    // Get participants
    const participants = await db
      .collection('tournamentParticipants')
      .find({ tournamentId: tournamentObjectId })
      .toArray()

    // Get player names
    const userIds = participants.map((p: any) => p.userId.toLowerCase())
    const players = await db
      .collection('players')
      .aggregate([
        { $addFields: { userIdLower: { $toLower: '$userId' } } },
        { $match: { userIdLower: { $in: userIds } } },
        { $project: { userId: 1, playerName: 1 } },
      ])
      .toArray()

    const playerNames = new Map<string, string>()
    players.forEach((p: any) => {
      if (p.playerName) playerNames.set(p.userId.toLowerCase(), p.playerName)
    })

    // Sort by score desc
    const sorted = participants.sort((a: any, b: any) => {
      const scoreA = participantScores.get(a.userId.toLowerCase()) || 0
      const scoreB = participantScores.get(b.userId.toLowerCase()) || 0
      return scoreB - scoreA
    })

    return sorted.slice(0, limit).map((p: any, i: number) => ({
      rank: i + 1,
      userId: p.userId,
      playerName: playerNames.get(p.userId.toLowerCase()),
      totalScore: participantScores.get(p.userId.toLowerCase()) || 0,
      selectedCrypto: p.selectedCrypto,
      direction: p.direction,
    }))
  }

  /**
   * Get finalized results for a tournament
   */
  async getTournamentResults(tournamentId: string, limit = 50): Promise<TournamentResult[]> {
    const db = await getDb()
    return await db
      .collection('tournamentResults')
      .find({ tournamentId: new ObjectId(tournamentId) })
      .sort({ finalRank: 1 })
      .limit(limit)
      .toArray() as TournamentResult[]
  }

  /**
   * Get participant count for a tournament
   */
  async getParticipantCount(tournamentId: string): Promise<number> {
    const db = await getDb()
    return await db
      .collection('tournamentParticipants')
      .countDocuments({ tournamentId: new ObjectId(tournamentId) })
  }

  /**
   * Check if a tournament has been finalized (has results)
   */
  async isFinalized(tournamentId: string): Promise<boolean> {
    const db = await getDb()
    const count = await db
      .collection('tournamentResults')
      .countDocuments({ tournamentId: new ObjectId(tournamentId) })
    return count > 0
  }

  /**
   * Get the current tournament day (1-7)
   */
  getTournamentDay(tournament: Tournament): number {
    const now = new Date()
    const start = new Date(tournament.startDate)
    const diffMs = now.getTime() - start.getTime()
    const day = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1
    return Math.max(1, Math.min(day, 7))
  }

  /**
   * Get time remaining in tournament as a human string
   */
  getTimeRemaining(tournament: Tournament): string {
    const now = new Date()
    const end = new Date(tournament.endDate)
    const diffMs = end.getTime() - now.getTime()

    if (diffMs <= 0) return 'Ended'

    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))

    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  /**
   * Get a player's position in the current tournament
   */
  async getPlayerStats(
    tournamentId: string,
    walletAddress: string,
  ): Promise<LeaderboardEntry | null> {
    const leaderboard = await this.getLeaderboard(tournamentId, 999)
    return leaderboard.find((e) => e.userId.toLowerCase() === walletAddress.toLowerCase()) || null
  }

  /**
   * Get default prize structure
   */
  getDefaultPrizes(): TournamentPrize[] {
    const prizes: TournamentPrize[] = []
    prizes.push({ position: 1, patronNFTs: 3, clashTokens: 40000 })
    prizes.push({ position: 2, patronNFTs: 2, clashTokens: 25000 })
    prizes.push({ position: 3, patronNFTs: 1, clashTokens: 15000 })
    for (let i = 4; i <= 5; i++) prizes.push({ position: i, patronNFTs: 0, clashTokens: 7500 })
    for (let i = 6; i <= 10; i++) prizes.push({ position: i, patronNFTs: 0, clashTokens: 3000 })
    for (let i = 11; i <= 50; i++) prizes.push({ position: i, patronNFTs: 0, clashTokens: 1500 })
    return prizes
  }

  /**
   * Calculate total prize pool for a tournament
   */
  getTotalPrizePool(prizes: TournamentPrize[]): { totalClash: number; totalNFTs: number } {
    return prizes.reduce(
      (acc, p) => ({
        totalClash: acc.totalClash + p.clashTokens,
        totalNFTs: acc.totalNFTs + p.patronNFTs,
      }),
      { totalClash: 0, totalNFTs: 0 },
    )
  }
}

export const tournamentReportService = new TournamentReportService()
