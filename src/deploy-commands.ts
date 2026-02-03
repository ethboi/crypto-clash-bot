import { REST, Routes, SlashCommandBuilder } from 'discord.js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const commands = [
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the trading leaderboard')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Leaderboard type')
        .setRequired(false)
        .addChoices(
          { name: 'Top Traders', value: 'top' },
          { name: 'Bottom Traders', value: 'bottom' }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName('limit')
        .setDescription('Number of traders to show (default: 25)')
        .setRequired(false)
        .setMinValue(5)
        .setMaxValue(50)
    ),

  new SlashCommandBuilder()
    .setName('winners')
    .setDescription('View top profitable traders'),

  new SlashCommandBuilder()
    .setName('losers')
    .setDescription('View bottom traders (rekt board)'),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help information'),
].map((command) => command.toJSON())

async function deployCommands() {
  const token = process.env.DISCORD_TOKEN_CLASH

  if (!token) {
    console.error('Error: DISCORD_TOKEN_CLASH not set in .env')
    process.exit(1)
  }

  const rest = new REST({ version: '10' }).setToken(token)

  try {
    console.log('Started refreshing application (/) commands...')

    // Get the bot's application ID
    const currentUser = (await rest.get(Routes.user())) as { id: string }
    const clientId = currentUser.id

    console.log(`Bot ID: ${clientId}`)

    // Register commands globally
    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    })

    console.log(`Successfully registered ${(data as unknown[]).length} commands globally.`)
    console.log('Commands:')
    commands.forEach((cmd) => {
      console.log(`  /${cmd.name} - ${cmd.description}`)
    })
  } catch (error) {
    console.error('Error deploying commands:', error)
    process.exit(1)
  }
}

deployCommands()
