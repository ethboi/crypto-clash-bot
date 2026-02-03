import { ChatInputCommandInteraction, Client } from 'discord.js'
import { ManagedBot } from '../../core/ManagedBot'
import {
  handleLeaderboardCommand,
  handleWinnersCommand,
  handleLosersCommand,
  handleHelpCommand,
} from '../handlers'

export async function setupMainBot(bot: ManagedBot): Promise<void> {
  if (bot.type !== 'main') {
    console.log(`[${bot.name}] Not a main bot, skipping main setup`)
    return
  }

  const client = bot.getClient()
  setupMainBotCommands(client, bot.name)
  console.log(`[${bot.name}] Main bot setup complete`)
}

export function setupMainBotCommands(client: Client, botName: string): void {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) {
      return
    }

    const { commandName } = interaction

    try {
      switch (commandName) {
        case 'leaderboard':
          await handleLeaderboardCommand(interaction as ChatInputCommandInteraction)
          break
        case 'winners':
          await handleWinnersCommand(interaction as ChatInputCommandInteraction)
          break
        case 'losers':
          await handleLosersCommand(interaction as ChatInputCommandInteraction)
          break
        case 'help':
          await handleHelpCommand(interaction as ChatInputCommandInteraction)
          break
        default:
          console.log(`[${botName}] Unknown command: ${commandName}`)
      }
    } catch (error) {
      console.error(`[${botName}] Error handling command ${commandName}:`, error)
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply('An error occurred while processing your command.')
      } else {
        await interaction.reply({
          content: 'An error occurred while processing your command.',
          ephemeral: true,
        })
      }
    }
  })
}
