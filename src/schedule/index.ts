import { scheduleJob } from 'node-schedule'
import { botManager } from '../core/BotManager'
import { updateAllPriceBots } from '../discord/setup/assetBot'
import { postLeaderboardToChannel } from '../discord/handlers/leaderboard'
import { LEADERBOARD_UPDATE_HOURS, PRICE_UPDATE_INTERVAL } from '../config'

export function startScheduledJobs(): void {
  // Price update job - runs every minute by default
  startPriceUpdateJob()

  // Leaderboard channel post job - runs every 3 hours by default
  startLeaderboardPostJob()

  console.log('Scheduled jobs started')
}

function startPriceUpdateJob(): void {
  const cronExpression = `*/${PRICE_UPDATE_INTERVAL} * * * *`

  scheduleJob(cronExpression, async () => {
    console.log(`[Schedule] Running price update job at ${new Date().toISOString()}`)

    try {
      const priceBots = botManager.getPriceBots().filter((bot) => bot.isOnline())

      if (priceBots.length > 0) {
        await updateAllPriceBots(priceBots)
        console.log(`[Schedule] Updated ${priceBots.length} price bots`)
      }
    } catch (error) {
      console.error('[Schedule] Price update job failed:', error)
    }
  })

  console.log(`[Schedule] Price update job scheduled (every ${PRICE_UPDATE_INTERVAL} minute(s))`)
}

function startLeaderboardPostJob(): void {
  const cronExpression = `0 */${LEADERBOARD_UPDATE_HOURS} * * *`

  scheduleJob(cronExpression, async () => {
    console.log(`[Schedule] Running leaderboard post job at ${new Date().toISOString()}`)

    try {
      const mainBot = botManager.getMainBot()

      if (mainBot && mainBot.isOnline()) {
        await postLeaderboardToChannel(mainBot.getClient())
        console.log('[Schedule] Leaderboard posted to channel')
      } else {
        console.log('[Schedule] Main bot not online, skipping leaderboard post')
      }
    } catch (error) {
      console.error('[Schedule] Leaderboard post job failed:', error)
    }
  })

  console.log(`[Schedule] Leaderboard post job scheduled (every ${LEADERBOARD_UPDATE_HOURS} hour(s))`)
}

export { startPriceUpdateJob, startLeaderboardPostJob }
