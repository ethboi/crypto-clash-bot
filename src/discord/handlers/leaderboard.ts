import { ChatInputCommandInteraction, Client, TextChannel } from 'discord.js'
import { leaderboardService } from '../../services/LeaderboardService'
import { TopTradersEmbed, BottomTradersEmbed, LeaderboardEntry } from '../../templates/leaderboard'
import { LEADERBOARD_CHANNEL } from '../../config'

export async function handleLeaderboardCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply()

  try {
    const type = interaction.options.getString('type') || 'top'
    const limit = interaction.options.getInteger('limit') || 25

    let entries: LeaderboardEntry[]
    let embeds

    if (type === 'bottom' || type === 'losers') {
      entries = await leaderboardService.getBottomTraders(limit)
      if (entries.length === 0) {
        entries = leaderboardService.getMockLeaderboard(limit, false)
      }
      embeds = BottomTradersEmbed(entries)
    } else {
      entries = await leaderboardService.getTopTraders(limit)
      if (entries.length === 0) {
        entries = leaderboardService.getMockLeaderboard(limit, true)
      }
      embeds = TopTradersEmbed(entries)
    }

    await interaction.editReply({ embeds })
  } catch (error) {
    console.error('Error handling leaderboard command:', error)
    await interaction.editReply('Failed to fetch leaderboard data. Please try again later.')
  }
}

export async function handleWinnersCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply()

  try {
    let entries = await leaderboardService.getTopTraders(25)
    if (entries.length === 0) {
      entries = leaderboardService.getMockLeaderboard(25, true)
    }
    const embeds = TopTradersEmbed(entries)
    await interaction.editReply({ embeds })
  } catch (error) {
    console.error('Error handling winners command:', error)
    await interaction.editReply('Failed to fetch leaderboard data. Please try again later.')
  }
}

export async function handleLosersCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply()

  try {
    let entries = await leaderboardService.getBottomTraders(25)
    if (entries.length === 0) {
      entries = leaderboardService.getMockLeaderboard(25, false)
    }
    const embeds = BottomTradersEmbed(entries)
    await interaction.editReply({ embeds })
  } catch (error) {
    console.error('Error handling losers command:', error)
    await interaction.editReply('Failed to fetch leaderboard data. Please try again later.')
  }
}

export async function postLeaderboardToChannel(client: Client): Promise<void> {
  try {
    let entries = await leaderboardService.getTopTraders(25)
    if (entries.length === 0) {
      entries = leaderboardService.getMockLeaderboard(25, true)
    }
    const embeds = TopTradersEmbed(entries)

    // Find the leaderboard channel in all guilds
    for (const guild of client.guilds.cache.values()) {
      const channel = guild.channels.cache.find(
        (ch) => ch.name === LEADERBOARD_CHANNEL && ch.isTextBased()
      ) as TextChannel | undefined

      if (channel) {
        await channel.send({ embeds })
        console.log(`Posted leaderboard to ${guild.name}#${channel.name}`)
      }
    }
  } catch (error) {
    console.error('Error posting leaderboard to channel:', error)
  }
}
