import { Client } from 'discord.js'
import { ManagedBot } from '../../core/ManagedBot'

export async function setupTournamentBot(bot: ManagedBot): Promise<void> {
  if (bot.type !== 'tournament') {
    console.log(`[${bot.name}] Not a tournament bot, skipping tournament setup`)
    return
  }

  const client = bot.getClient()
  setupTournamentCommands(client, bot.name)
  console.log(`[${bot.name}] Tournament bot setup complete`)
}

export function setupTournamentCommands(client: Client, botName: string): void {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) {
      return
    }

    const { commandName } = interaction

    try {
      switch (commandName) {
        case 'tournament':
          // TODO: Implement tournament command
          await interaction.reply('Tournament functionality coming soon!')
          break
        case 'register':
          // TODO: Implement registration command
          await interaction.reply('Tournament registration coming soon!')
          break
        case 'standings':
          // TODO: Implement standings command
          await interaction.reply('Tournament standings coming soon!')
          break
        default:
          // Ignore other commands - they may be for other bots
          break
      }
    } catch (error) {
      console.error(`[${botName}] Error handling command ${commandName}:`, error)
    }
  })
}
