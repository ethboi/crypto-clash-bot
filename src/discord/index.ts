import { ManagedBot } from '../core/ManagedBot'
import { setupAssetBot } from './setup/assetBot'
import { setupMainBot } from './setup/mainBot'
import { setupTournamentBot } from './setup/tournamentBot'

export async function setupBot(bot: ManagedBot): Promise<void> {
  switch (bot.type) {
    case 'price':
      await setupAssetBot(bot)
      break
    case 'main':
      await setupMainBot(bot)
      break
    case 'tournament':
      await setupTournamentBot(bot)
      break
    default:
      console.log(`[${bot.name}] Unknown bot type: ${bot.type}`)
  }
}

export async function setupAllBots(bots: ManagedBot[]): Promise<void> {
  for (const bot of bots) {
    if (bot.isOnline()) {
      await setupBot(bot)
    }
  }
}

export { postLeaderboardToChannel } from './handlers/leaderboard'
