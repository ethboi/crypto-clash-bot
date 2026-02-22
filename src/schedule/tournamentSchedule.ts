import { scheduleJob } from 'node-schedule'
import { Client, TextChannel, Message } from 'discord.js'
import { tournamentReportService, Tournament } from '../services/TournamentReportService'
import {
  DailyStandingsEmbed,
  TournamentResultsEmbed,
  TournamentFinalizedEmbed,
  TournamentCreatedEmbed,
  TournamentLockedEmbed,
} from '../templates/tournamentReport'
import {
  TOURNAMENT_STANDINGS_CHANNEL_ID,
  TOURNAMENT_RESULTS_CHANNEL_ID,
  TOURNAMENT_ANNOUNCE_CHANNEL_ID,
  PINNED_LEADERBOARD_UPDATE_MINUTES,
} from '../config'
import { tweetNewTournament, tweetTournamentLocked, tweetTournamentResults } from '../services/PopchingService'
import { telegramNewTournament, telegramTournamentLocked, telegramTournamentResults } from '../services/TelegramService'

// Track which tournaments we've already posted results for (in-memory, acceptable for results)
const postedResults = new Set<string>()

// Track pinned leaderboard message ID per channel
let pinnedMessageId: string | null = null

export function startTournamentSchedule(client: Client): void {
  // Daily standings at 00:30 UTC
  scheduleJob('30 0 * * *', async () => {
    console.log(`[TournamentSchedule] Running daily standings at ${new Date().toISOString()}`)
    await postDailyStandings(client)
  })

  // Check for new tournaments & lifecycle events every 15 minutes
  scheduleJob('*/15 * * * *', async () => {
    await checkForNewTournaments(client)
    await checkForLockedTournaments(client)
    await checkForFinalizedResults(client)
  })

  // Pinned leaderboard update
  const interval = PINNED_LEADERBOARD_UPDATE_MINUTES
  scheduleJob(`*/${interval} * * * *`, async () => {
    await updatePinnedLeaderboard(client)
  })

  // Initial pinned leaderboard on startup (after 10s delay for bot to be ready)
  setTimeout(async () => {
    await updatePinnedLeaderboard(client)
  }, 10000)

  console.log('[TournamentSchedule] Tournament schedule started')
  console.log('[TournamentSchedule]   - Daily standings: 00:30 UTC')
  console.log('[TournamentSchedule]   - Finalization check: every 15 min')
  console.log(`[TournamentSchedule]   - Pinned leaderboard: every ${interval} min`)
}

async function updatePinnedLeaderboard(client: Client): Promise<void> {
  if (!TOURNAMENT_STANDINGS_CHANNEL_ID) return

  try {
    const tournament = await tournamentReportService.getActiveTournament()
    if (!tournament) {
      return
    }

    const day = tournamentReportService.getTournamentDay(tournament)
    const leaderboard = await tournamentReportService.getLeaderboard(tournament._id!.toString(), 25)
    const participantCount = await tournamentReportService.getParticipantCount(tournament._id!.toString())

    const embeds = DailyStandingsEmbed(tournament, day, leaderboard, participantCount)

    const channel = await client.channels.fetch(TOURNAMENT_STANDINGS_CHANNEL_ID) as TextChannel
    if (!channel) return

    // Try to edit existing pinned message
    if (pinnedMessageId) {
      try {
        const msg = await channel.messages.fetch(pinnedMessageId)
        await msg.edit({ embeds })
        console.log(`[TournamentSchedule] Updated pinned leaderboard for ${tournament.name}`)
        return
      } catch {
        // Message was deleted or not found, will create new one
        pinnedMessageId = null
      }
    }

    // Check if we already have a pinned message from this bot
    if (!pinnedMessageId) {
      try {
        const pinnedMessages = await channel.messages.fetchPinned()
        const botMessage = pinnedMessages.find(
          (m: Message) => m.author.id === client.user?.id && m.embeds.length > 0
        )
        if (botMessage) {
          pinnedMessageId = botMessage.id
          await botMessage.edit({ embeds })
          console.log(`[TournamentSchedule] Found & updated existing pinned leaderboard`)
          return
        }
      } catch {
        // Failed to fetch pins, will create new
      }
    }

    // Create new message and pin it
    const newMsg = await channel.send({ embeds })
    try {
      await newMsg.pin()
    } catch (e) {
      console.error('[TournamentSchedule] Failed to pin leaderboard message:', e)
    }
    pinnedMessageId = newMsg.id
    console.log(`[TournamentSchedule] Created & pinned new leaderboard for ${tournament.name}`)
  } catch (error) {
    console.error('[TournamentSchedule] Error updating pinned leaderboard:', error)
  }
}

async function postDailyStandings(client: Client): Promise<void> {
  if (!TOURNAMENT_STANDINGS_CHANNEL_ID) {
    console.log('[TournamentSchedule] No standings channel configured, skipping')
    return
  }

  try {
    const tournament = await tournamentReportService.getActiveTournament()
    if (!tournament) {
      console.log('[TournamentSchedule] No active tournament, skipping standings')
      return
    }

    const day = tournamentReportService.getTournamentDay(tournament)
    const leaderboard = await tournamentReportService.getLeaderboard(tournament._id!.toString(), 25)
    const participantCount = await tournamentReportService.getParticipantCount(tournament._id!.toString())

    const embeds = DailyStandingsEmbed(tournament, day, leaderboard, participantCount)

    const channel = await client.channels.fetch(TOURNAMENT_STANDINGS_CHANNEL_ID) as TextChannel
    if (channel) {
      await channel.send({ embeds })
      console.log(`[TournamentSchedule] Posted day ${day} standings for ${tournament.name}`)
    }
  } catch (error) {
    console.error('[TournamentSchedule] Error posting daily standings:', error)
  }
}

async function checkForNewTournaments(client: Client): Promise<void> {
  if (!TOURNAMENT_ANNOUNCE_CHANNEL_ID) return

  try {
    const { getDb } = await import('../services/db')
    const db = await getDb()
    const tournaments = await tournamentReportService.getUpcomingTournaments()

    for (const tournament of tournaments) {
      const tid = tournament._id!.toString()

      // Check DB flag to survive restarts
      if ((tournament as any).announcedCreation) continue

      const participantCount = await tournamentReportService.getParticipantCount(tid)
      const embed = TournamentCreatedEmbed(tournament, participantCount)

      const channel = await client.channels.fetch(TOURNAMENT_ANNOUNCE_CHANNEL_ID) as TextChannel
      if (channel) {
        await channel.send({ content: '@everyone', embeds: [embed] })
        console.log(`[TournamentSchedule] Announced new tournament: ${tournament.name}`)
      }

      // Tweet via Popching
      try {
        await tweetNewTournament(tournament)
        console.log(`[TournamentSchedule] Tweeted new tournament: ${tournament.name}`)
      } catch (e) {
        console.error('[TournamentSchedule] Failed to tweet new tournament:', e)
      }

      // Telegram
      try {
        await telegramNewTournament(tournament)
      } catch (e) {
        console.error('[TournamentSchedule] Failed to send Telegram new tournament:', e)
      }

      // Mark as announced in DB
      const { ObjectId } = await import('mongodb')
      await db.collection('tournaments').updateOne(
        { _id: new ObjectId(tid) },
        { $set: { announcedCreation: true } }
      )
    }
  } catch (error) {
    console.error('[TournamentSchedule] Error checking new tournaments:', error)
  }
}

async function checkForLockedTournaments(client: Client): Promise<void> {
  if (!TOURNAMENT_ANNOUNCE_CHANNEL_ID) return

  try {
    const { getDb } = await import('../services/db')
    const db = await getDb()
    const tournament = await tournamentReportService.getActiveTournament()
    if (!tournament) return

    const tid = tournament._id!.toString()

    // Check DB flag to survive restarts
    if ((tournament as any).announcedLock) return

    const now = new Date()
    const lockDate = new Date(tournament.lockDate)
    if (now < lockDate) return // Not locked yet

    const participantCount = await tournamentReportService.getParticipantCount(tid)
    const embed = TournamentLockedEmbed(tournament, participantCount)

    const channel = await client.channels.fetch(TOURNAMENT_ANNOUNCE_CHANNEL_ID) as TextChannel
    if (channel) {
      await channel.send({ embeds: [embed] })
      console.log(`[TournamentSchedule] Announced lock for: ${tournament.name}`)
    }

    // Tweet via Popching
    try {
      await tweetTournamentLocked(tournament, participantCount)
      console.log(`[TournamentSchedule] Tweeted lock for: ${tournament.name}`)
    } catch (e) {
      console.error('[TournamentSchedule] Failed to tweet lock:', e)
    }

    // Telegram
    try {
      await telegramTournamentLocked(tournament, participantCount)
    } catch (e) {
      console.error('[TournamentSchedule] Failed to send Telegram lock:', e)
    }

    // Mark as announced in DB
    const { ObjectId } = await import('mongodb')
    await db.collection('tournaments').updateOne(
      { _id: new ObjectId(tid) },
      { $set: { announcedLock: true } }
    )
  } catch (error) {
    console.error('[TournamentSchedule] Error checking locked tournaments:', error)
  }
}

async function checkForFinalizedResults(client: Client): Promise<void> {
  if (!TOURNAMENT_RESULTS_CHANNEL_ID) return

  try {
    const finalized = await tournamentReportService.getRecentlyFinalized()

    for (const tournament of finalized) {
      const tid = tournament._id!.toString()
      if (postedResults.has(tid)) continue

      // Post results
      const results = await tournamentReportService.getTournamentResults(tid, 50)
      const prizes = tournament.prizes || tournamentReportService.getDefaultPrizes()

      const embeds = TournamentResultsEmbed(tournament, results, prizes)

      const resultsChannel = await client.channels.fetch(TOURNAMENT_RESULTS_CHANNEL_ID) as TextChannel
      if (resultsChannel) {
        await resultsChannel.send({ embeds })
        console.log(`[TournamentSchedule] Posted results for ${tournament.name}`)
      }

      // Post announcement
      if (TOURNAMENT_ANNOUNCE_CHANNEL_ID) {
        const announceChannel = await client.channels.fetch(TOURNAMENT_ANNOUNCE_CHANNEL_ID) as TextChannel
        if (announceChannel) {
          const announceEmbed = TournamentFinalizedEmbed(tournament)
          await announceChannel.send({ embeds: [announceEmbed] })
        }
      }

      // Tweet results via Popching
      const topPlayers = results.slice(0, 3).map(r => ({
        name: r.playerName || r.userId?.slice(0, 8) || 'Unknown',
        score: r.finalScore || 0,
      }))
      try {
        await tweetTournamentResults(tournament, topPlayers)
        console.log(`[TournamentSchedule] Tweeted results for: ${tournament.name}`)
      } catch (e) {
        console.error('[TournamentSchedule] Failed to tweet results:', e)
      }

      // Telegram
      try {
        await telegramTournamentResults(tournament, topPlayers)
      } catch (e) {
        console.error('[TournamentSchedule] Failed to send Telegram results:', e)
      }

      postedResults.add(tid)
    }
  } catch (error) {
    console.error('[TournamentSchedule] Error checking finalized results:', error)
  }
}

/**
 * Manually trigger a standings post (for slash commands or testing)
 */
export async function triggerStandingsPost(client: Client): Promise<boolean> {
  try {
    await postDailyStandings(client)
    return true
  } catch {
    return false
  }
}
