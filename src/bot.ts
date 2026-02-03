import { botManager } from './core/BotManager'
import { BOT_CONFIGS } from './config/bots'
import { setupAllBots } from './discord'
import { startScheduledJobs } from './schedule'

export async function Run(): Promise<void> {
  try {
    console.log('Starting Crypto Clash Bot System...')

    // Register all bots
    console.log('Registering bots...')
    for (const config of BOT_CONFIGS) {
      botManager.registerBot(config)
    }

    // Start all bots
    console.log('Starting bots...')
    await botManager.startAll()

    // Setup bot-specific functionality
    console.log('Setting up bot functionality...')
    await setupAllBots(botManager.getAllBots())

    // Start scheduled jobs
    console.log('Starting scheduled jobs...')
    startScheduledJobs()

    // Log status
    const status = botManager.getStatus()
    console.log(`Crypto Clash Bot System Started`)
    console.log(`Total bots: ${status.total}, Online: ${status.online}, Offline: ${status.offline}`)

    // List online bots
    const onlineBots = botManager.getOnlineBots()
    onlineBots.forEach((bot) => {
      console.log(`  - ${bot.name} (${bot.type})`)
    })
  } catch (error) {
    console.error('Failed to start bot system:', error)
    throw error
  }
}
