import { Client } from 'discord.js'
import { ManagedBot, ManagedBotConfig, BotType } from './ManagedBot'

export class BotManager {
  private bots: Map<string, ManagedBot> = new Map()
  private static instance: BotManager | null = null

  private constructor() {}

  public static getInstance(): BotManager {
    if (!BotManager.instance) {
      BotManager.instance = new BotManager()
    }
    return BotManager.instance
  }

  public registerBot(config: ManagedBotConfig): ManagedBot {
    if (this.bots.has(config.name)) {
      throw new Error(`Bot with name "${config.name}" is already registered`)
    }

    const bot = new ManagedBot(config)
    this.bots.set(config.name, bot)
    console.log(`Registered bot: ${config.name}`)
    return bot
  }

  public getBot(name: string): ManagedBot | undefined {
    return this.bots.get(name)
  }

  public getClient(name: string): Client | undefined {
    return this.bots.get(name)?.getClient()
  }

  public getBotsByType(type: BotType): ManagedBot[] {
    return Array.from(this.bots.values()).filter(bot => bot.type === type)
  }

  public getPriceBots(): ManagedBot[] {
    return this.getBotsByType('price')
  }

  public getMainBot(): ManagedBot | undefined {
    const mainBots = this.getBotsByType('main')
    return mainBots.length > 0 ? mainBots[0] : undefined
  }

  public getTournamentBot(): ManagedBot | undefined {
    const tournamentBots = this.getBotsByType('tournament')
    return tournamentBots.length > 0 ? tournamentBots[0] : undefined
  }

  public async startAll(): Promise<void> {
    console.log('Starting all bots...')
    const results: { name: string; success: boolean; error?: Error }[] = []

    for (const bot of this.bots.values()) {
      if (!bot.hasToken()) {
        console.log(`Skipping ${bot.name} bot - no token provided`)
        results.push({ name: bot.name, success: false })
        continue
      }

      try {
        await bot.start()
        results.push({ name: bot.name, success: true })
      } catch (error) {
        console.error(`Failed to start ${bot.name} bot:`, error instanceof Error ? error.message : error)
        results.push({ name: bot.name, success: false, error: error instanceof Error ? error : new Error(String(error)) })
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    console.log(`Bot startup complete: ${successful} started, ${failed} skipped/failed`)
  }

  public async startBot(name: string): Promise<void> {
    const bot = this.bots.get(name)
    if (!bot) {
      throw new Error(`Bot "${name}" not found`)
    }
    await bot.start()
  }

  public async stopAll(): Promise<void> {
    console.log('Stopping all bots...')
    const stopPromises: Promise<void>[] = []

    for (const bot of this.bots.values()) {
      stopPromises.push(bot.stop())
    }

    await Promise.all(stopPromises)
    console.log('All bots stopped')
  }

  public async stopBot(name: string): Promise<void> {
    const bot = this.bots.get(name)
    if (!bot) {
      throw new Error(`Bot "${name}" not found`)
    }
    await bot.stop()
  }

  public getAllBots(): ManagedBot[] {
    return Array.from(this.bots.values())
  }

  public getOnlineBots(): ManagedBot[] {
    return this.getAllBots().filter(bot => bot.isOnline())
  }

  public getStatus(): { total: number; online: number; offline: number } {
    const all = this.getAllBots()
    const online = all.filter(bot => bot.isOnline())
    return {
      total: all.length,
      online: online.length,
      offline: all.length - online.length,
    }
  }
}

export const botManager = BotManager.getInstance()
