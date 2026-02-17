import { EmbedBuilder } from 'discord.js'
import { Footer, FooterWithImage, Medal, formatPercent } from './common'
import { COLORS, EMOJIS, URLS, BRAND } from '../constants/branding'
import {
  Tournament,
  TournamentResult,
  LeaderboardEntry,
  TournamentPrize,
  tournamentReportService,
} from '../services/TournamentReportService'
import { shortAddress } from '../utils/utils'
import { CRYPTO_CLASH_URL } from '../config'

// ==================== HELPERS ====================

function displayName(entry: { userId: string; playerName?: string }): string {
  return entry.playerName || shortAddress(entry.userId)
}

function formatScore(score: number): string {
  return score.toFixed(1)
}

function formatClash(amount: number): string {
  return amount.toLocaleString('en-US')
}

// ==================== DAILY STANDINGS ====================

export function DailyStandingsEmbed(
  tournament: Tournament,
  day: number,
  leaderboard: LeaderboardEntry[],
  participantCount: number,
): EmbedBuilder[] {
  const embeds: EmbedBuilder[] = []
  const timeRemaining = tournamentReportService.getTimeRemaining(tournament)

  const mainEmbed = new EmbedBuilder()
    .setColor(COLORS.ACCENT as any)
    .setTitle(`${EMOJIS.TROPHY} ${tournament.name}`)
    .setURL(`${CRYPTO_CLASH_URL}/play`)
    .setTimestamp()

  // Header info
  const headerLines: string[] = [
    `**Day ${day}/7** · ${participantCount} players · ${timeRemaining} remaining`,
    '',
    '```',
    ' #  Player                Score   Pick',
    '───────────────────────────────────────────',
  ]

  // Build leaderboard as a clean table
  const showCount = Math.min(leaderboard.length, 25)

  for (let i = 0; i < showCount; i++) {
    const entry = leaderboard[i]
    const rank = String(entry.rank).padStart(2, ' ')
    const name = displayName(entry).slice(0, 20).padEnd(20, ' ')
    const score = formatScore(entry.totalScore).padStart(7, ' ')
    const arrow = entry.direction === 'up' ? '▲' : '▼'
    const crypto = entry.selectedCrypto ? `${arrow} ${entry.selectedCrypto}` : ''

    headerLines.push(` ${rank}  ${name} ${score}   ${crypto}`)
  }

  headerLines.push('```')

  if (leaderboard.length > showCount) {
    headerLines.push(`*...and ${leaderboard.length - showCount} more*`)
  }

  mainEmbed.setDescription(headerLines.join('\n'))

  // Prize pool + info as compact inline fields
  mainEmbed.addFields(
    {
      name: `${EMOJIS.GOLD} 1st`,
      value: `3 NFTs\n40K $CLASH`,
      inline: true,
    },
    {
      name: `${EMOJIS.SILVER} 2nd`,
      value: `2 NFTs\n25K $CLASH`,
      inline: true,
    },
    {
      name: `${EMOJIS.BRONZE} 3rd`,
      value: `1 NFT\n15K $CLASH`,
      inline: true,
    },
    {
      name: `${EMOJIS.SWORD} League`,
      value: `${tournament.leagueCategory || 'Alpha'} #${tournament.weekNumber}`,
      inline: true,
    },
    {
      name: `${EMOJIS.MONEY} 4–50th`,
      value: `7.5K→1.5K`,
      inline: true,
    },
    {
      name: `${EMOJIS.LIGHTNING} Play`,
      value: `[Join](${CRYPTO_CLASH_URL}/play)`,
      inline: true,
    },
  )

  Footer(mainEmbed)
  embeds.push(mainEmbed)
  return embeds
}

// ==================== TOURNAMENT RESULTS ====================

export function TournamentResultsEmbed(
  tournament: Tournament,
  results: TournamentResult[],
  prizes: TournamentPrize[],
): EmbedBuilder[] {
  const embeds: EmbedBuilder[] = []

  const mainEmbed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS as any)
    .setTitle(`${EMOJIS.TROPHY} ${tournament.name} — Final Results!`)
    .setURL(`${CRYPTO_CLASH_URL}/play`)
    .setTimestamp()

  const lines: string[] = []

  // Top 3 with prizes
  for (let i = 0; i < Math.min(3, results.length); i++) {
    const r = results[i]
    const medal = Medal(r.finalRank)
    const name = r.playerName || shortAddress(r.userId)
    const prize = r.prizeAwarded

    lines.push(`${medal} **${ordinal(r.finalRank)} Place: ${name}** — ${formatScore(r.finalScore)} pts`)
    if (prize) {
      const parts: string[] = []
      if (prize.patronNFTs > 0) parts.push(`${prize.patronNFTs} Patron NFT${prize.patronNFTs > 1 ? 's' : ''}`)
      if (prize.clashTokens > 0) parts.push(`${formatClash(prize.clashTokens)} $CLASH`)
      lines.push(`   → 🎁 ${parts.join(' + ')}`)
    }
    lines.push('')
  }

  // 4th-5th
  const tier2 = results.filter((r) => r.finalRank >= 4 && r.finalRank <= 5)
  if (tier2.length > 0) {
    lines.push('**4th-5th Place:**')
    tier2.forEach((r) => {
      const name = r.playerName || shortAddress(r.userId)
      const clash = r.prizeAwarded?.clashTokens || 0
      lines.push(`   ${r.finalRank}. ${name} — ${formatScore(r.finalScore)} pts → ${formatClash(clash)} $CLASH`)
    })
    lines.push('')
  }

  // 6th-10th
  const tier3 = results.filter((r) => r.finalRank >= 6 && r.finalRank <= 10)
  if (tier3.length > 0) {
    lines.push('**6th-10th Place:**')
    tier3.forEach((r) => {
      const name = r.playerName || shortAddress(r.userId)
      lines.push(`   ${r.finalRank}. ${name} — ${formatScore(r.finalScore)} pts → 3,000 $CLASH`)
    })
    lines.push('')
  }

  // 11th-50th summary
  const tier4 = results.filter((r) => r.finalRank >= 11 && r.finalRank <= 50)
  if (tier4.length > 0) {
    lines.push(`**11th-50th Place:** ${tier4.length} players → 1,500 $CLASH each`)
    lines.push('')
  }

  mainEmbed.setDescription(lines.join('\n'))

  // Total prize pool
  const totalPool = prizes.reduce(
    (acc, p) => ({
      clash: acc.clash + p.clashTokens,
      nfts: acc.nfts + p.patronNFTs,
    }),
    { clash: 0, nfts: 0 },
  )

  const totalParticipants = results.length > 0 ? results[0].totalParticipants : 0

  mainEmbed.addFields(
    {
      name: '📊 Participants',
      value: `${totalParticipants}`,
      inline: true,
    },
    {
      name: '💰 Prize Pool',
      value: `${formatClash(totalPool.clash)} $CLASH + ${totalPool.nfts} NFTs`,
      inline: true,
    },
  )

  FooterWithImage(mainEmbed)
  embeds.push(mainEmbed)
  return embeds
}

// ==================== LIFECYCLE ALERTS ====================

export function TournamentCreatedEmbed(tournament: Tournament, participantCount: number): EmbedBuilder {
  const lockDate = new Date(tournament.lockDate)
  const startDate = new Date(tournament.startDate)
  const endDate = new Date(tournament.endDate)

  const embed = new EmbedBuilder()
    .setColor('#7B2FBE' as any)
    .setTitle(`⚔️ ${tournament.name}`)
    .setDescription(
      [
        `A new weekly tournament has been created! Build your deck and lock in before the deadline.`,
        '',
        `📅 **Starts:** <t:${Math.floor(startDate.getTime() / 1000)}:F>`,
        `🏁 **Ends:** <t:${Math.floor(endDate.getTime() / 1000)}:F>`,
        `🔒 **Lock Cards By:** <t:${Math.floor(lockDate.getTime() / 1000)}:R>`,
        '',
        `🏆 **Prizes:** Patron NFTs for top 3 | $CLASH for top 50`,
        '',
        `👉 **Play now at [cryptoclash.ink](${CRYPTO_CLASH_URL})**`,
      ].join('\n'),
    )

  Footer(embed)
  return embed
}

export function TournamentLockedEmbed(tournament: Tournament, participantCount: number): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS.ACCENT as any)
    .setTitle(`🔒 Cards Locked — ${tournament.name}`)
    .setDescription(
      [
        `The battle begins! **${participantCount}** participants have entered.`,
        '',
        `Good luck to all fighters! ⚔️`,
      ].join('\n'),
    )

  Footer(embed)
  return embed
}

export function TournamentEndedEmbed(tournament: Tournament): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS.MUTED as any)
    .setTitle(`🏁 ${tournament.name} Has Ended!`)
    .setDescription('Results are being finalized... Stay tuned for winners! 🏆')

  Footer(embed)
  return embed
}

export function TournamentFinalizedEmbed(tournament: Tournament): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS as any)
    .setTitle(`🏆 Results Are In!`)
    .setDescription(`**${tournament.name}** results have been finalized! Check the results channel for winners and prizes.`)

  Footer(embed)
  return embed
}

// ==================== SLASH COMMAND RESPONSES ====================

export function TournamentInfoEmbed(
  tournament: Tournament,
  day: number,
  timeRemaining: string,
  participantCount: number,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY as any)
    .setTitle(`⚔️ ${tournament.name}`)
    .addFields(
      { name: 'Status', value: tournament.status.toUpperCase(), inline: true },
      { name: 'Day', value: `${day}/7`, inline: true },
      { name: 'Time Left', value: timeRemaining, inline: true },
      { name: 'Participants', value: `${participantCount}`, inline: true },
      { name: 'League', value: tournament.leagueCategory || 'Alpha', inline: true },
      { name: 'Week', value: `#${tournament.weekNumber}`, inline: true },
    )
    .setURL(`${CRYPTO_CLASH_URL}/play`)

  Footer(embed)
  return embed
}

export function PrizesEmbed(prizes: TournamentPrize[]): EmbedBuilder {
  const lines: string[] = []

  for (const p of prizes.slice(0, 15)) {
    const parts: string[] = []
    if (p.patronNFTs > 0) parts.push(`${p.patronNFTs} NFT${p.patronNFTs > 1 ? 's' : ''}`)
    parts.push(`${formatClash(p.clashTokens)} $CLASH`)
    lines.push(`${Medal(p.position)} **#${p.position}** → ${parts.join(' + ')}`)
  }

  if (prizes.length > 15) {
    const remaining = prizes.slice(15)
    const clashPerPlayer = remaining[0]?.clashTokens || 0
    lines.push(`**#16-#${prizes[prizes.length - 1].position}** → ${formatClash(clashPerPlayer)} $CLASH each`)
  }

  const totalPool = prizes.reduce(
    (acc, p) => ({
      clash: acc.clash + p.clashTokens,
      nfts: acc.nfts + p.patronNFTs,
    }),
    { clash: 0, nfts: 0 },
  )

  const embed = new EmbedBuilder()
    .setColor(COLORS.ACCENT as any)
    .setTitle(`💰 Prize Structure`)
    .setDescription(lines.join('\n'))
    .addFields({
      name: 'Total Pool',
      value: `${formatClash(totalPool.clash)} $CLASH + ${totalPool.nfts} Patron NFTs`,
    })

  Footer(embed)
  return embed
}

export function PlayerStatsEmbed(
  entry: LeaderboardEntry,
  tournamentName: string,
  totalParticipants: number,
): EmbedBuilder {
  const name = displayName(entry)

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY as any)
    .setTitle(`📊 ${name} — ${tournamentName}`)
    .addFields(
      { name: 'Rank', value: `#${entry.rank} / ${totalParticipants}`, inline: true },
      { name: 'Score', value: formatScore(entry.totalScore), inline: true },
      { name: 'Strategy', value: `${entry.selectedCrypto || '?'} ${entry.direction === 'up' ? '📈' : '📉'}`, inline: true },
    )

  Footer(embed)
  return embed
}

// ==================== UTILS ====================

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
