import { EmbedBuilder } from 'discord.js'
import { DefaultColor, FooterWithImage, Medal, formatPnL, COLORS, EMOJIS } from './common'
import { shortAddress } from '../utils/utils'
import formatUSD from '../utils/formatUSD'

export interface LeaderboardEntry {
  rank: number
  address: string
  displayName?: string
  pnl: number
  trades: number
  winRate?: number
  volume?: number
}

export function LeaderboardEmbed(
  entries: LeaderboardEntry[],
  title: string,
  isTop = true,
): EmbedBuilder[] {
  const messageEmbeds: EmbedBuilder[] = []
  const color = isTop ? COLORS.SUCCESS : COLORS.DANGER
  const icon = isTop ? EMOJIS.TROPHY : EMOJIS.SKULL

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${icon} ${title}`)
    .addFields(
      { name: 'Trader', value: '─────────', inline: true },
      { name: 'Stats', value: '─────────', inline: true },
      { name: isTop ? '💰 Profit' : '💸 Loss', value: '─────────', inline: true },
    )

  // First 5 entries on the first embed
  entries.slice(0, 5).forEach((entry) => {
    addLeaderboardRow(embed, entry)
  })

  messageEmbeds.push(embed)

  // Remaining entries in groups of 5
  let currentIndex = 5
  const remaining = entries.slice(5)

  for (let i = 0; i < remaining.length; i += 5) {
    const chunk = remaining.slice(i, i + 5)
    const chunkEmbed = new EmbedBuilder().setColor(color)

    chunk.forEach((entry) => {
      addLeaderboardRow(chunkEmbed, entry)
    })

    messageEmbeds.push(chunkEmbed)
    currentIndex += chunk.length
  }

  // Add footer to the last embed
  if (messageEmbeds.length > 0) {
    const lastEmbed = messageEmbeds[messageEmbeds.length - 1]
    FooterWithImage(lastEmbed)
  }

  return messageEmbeds
}

function addLeaderboardRow(embed: EmbedBuilder, entry: LeaderboardEntry): void {
  const medal = Medal(entry.rank)
  const displayName = entry.displayName || shortAddress(entry.address)
  const pnlFormatted = formatPnL(entry.pnl)
  const winRateStr = entry.winRate !== undefined ? `${entry.winRate.toFixed(1)}%` : 'N/A'

  embed.addFields(
    {
      name: `${medal} #${entry.rank}`,
      value: `\`${displayName}\``,
      inline: true,
    },
    {
      name: `${EMOJIS.SWORD} ${entry.trades} trades`,
      value: `Win: ${winRateStr}`,
      inline: true,
    },
    {
      name: pnlFormatted,
      value: entry.volume ? `Vol: ${formatUSD(entry.volume)}` : '\u200b',
      inline: true,
    },
  )
}

export function TopTradersEmbed(entries: LeaderboardEntry[]): EmbedBuilder[] {
  return LeaderboardEmbed(entries, 'Top Traders - Leaderboard', true)
}

export function BottomTradersEmbed(entries: LeaderboardEntry[]): EmbedBuilder[] {
  return LeaderboardEmbed(entries, 'Bottom Traders - Rekt Board', false)
}

export function DailyLeaderboardEmbed(entries: LeaderboardEntry[], date: string): EmbedBuilder[] {
  return LeaderboardEmbed(entries, `Daily Leaderboard - ${date}`, true)
}

export function WeeklyLeaderboardEmbed(entries: LeaderboardEntry[], weekRange: string): EmbedBuilder[] {
  return LeaderboardEmbed(entries, `Weekly Leaderboard - ${weekRange}`, true)
}
