import { Client, ChatInputCommandInteraction } from 'discord.js'
import { ManagedBot } from '../../core/ManagedBot'
import {
  handleStandings,
  handleTournament,
  handleResults,
  handlePrizes,
  handleMyStats,
} from '../handlers/tournament'
import { startTournamentSchedule } from '../../schedule/tournamentSchedule'
import { connectDb } from '../../services/db'

export async function setupTournamentBot(bot: ManagedBot): Promise<void> {
  if (bot.type !== 'tournament') {
    console.log(`[${bot.name}] Not a tournament bot, skipping tournament setup`)
    return
  }

  const client = bot.getClient()

  // Connect to MongoDB
  try {
    await connectDb()
    console.log(`[${bot.name}] MongoDB connected for tournament reports`)
  } catch (error) {
    console.error(`[${bot.name}] Failed to connect to MongoDB:`, error)
    return
  }

  // Setup slash command handlers
  setupTournamentCommands(client, bot.name)

  // Start scheduled posts
  startTournamentSchedule(client)

  console.log(`[${bot.name}] Tournament bot setup complete`)
}

export function setupTournamentCommands(client: Client, botName: string): void {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return
    }

    const { commandName } = interaction

    try {
      switch (commandName) {
        case 'tournament':
          await handleTournament(interaction)
          break
        case 'standings':
          await handleStandings(interaction)
          break
        case 'results':
          await handleResults(interaction)
          break
        case 'prizes':
          await handlePrizes(interaction)
          break
        case 'mystats':
          await handleMyStats(interaction)
          break
        default:
          break
      }
    } catch (error) {
      console.error(`[${botName}] Error handling command ${commandName}:`, error)
    }
  })
}
