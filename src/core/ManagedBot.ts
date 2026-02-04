import { Client, GatewayIntentBits, Partials, ActivityType } from 'discord.js'

export type BotType = 'price' | 'main' | 'tournament'

export interface ManagedBotConfig {
  name: string
  token: string
  type: BotType
  asset?: string
  coinGeckoId?: string
  dexScreenerChain?: string
  dexScreenerPair?: string
  openSeaCollection?: string
}

export class ManagedBot {
  public readonly name: string
  public readonly type: BotType
  public readonly asset?: string
  public readonly coinGeckoId?: string
  public readonly dexScreenerChain?: string
  public readonly dexScreenerPair?: string
  public readonly openSeaCollection?: string

  private readonly token: string
  private client: Client | null = null
  private isReady = false

  constructor(config: ManagedBotConfig) {
    this.name = config.name
    this.token = config.token
    this.type = config.type
    this.asset = config.asset
    this.coinGeckoId = config.coinGeckoId
    this.dexScreenerChain = config.dexScreenerChain
    this.dexScreenerPair = config.dexScreenerPair
    this.openSeaCollection = config.openSeaCollection
  }

  public getClient(): Client {
    if (!this.client) {
      this.client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
        partials: [Partials.User, Partials.Message],
      })
    }
    return this.client
  }

  public async start(): Promise<void> {
    if (!this.token) {
      console.log(`Skipping ${this.name} bot - no token provided`)
      return
    }

    const client = this.getClient()

    return new Promise((resolve, reject) => {
      client.on('ready', () => {
        console.log(`[${this.name}] Bot is online!`)
        this.isReady = true
        resolve()
      })

      client.on('error', (error) => {
        console.error(`[${this.name}] Bot error:`, error)
        reject(error)
      })

      client.login(this.token).catch(reject)
    })
  }

  public async stop(): Promise<void> {
    if (this.client) {
      await this.client.destroy()
      this.client = null
      this.isReady = false
      console.log(`[${this.name}] Bot stopped`)
    }
  }

  public async setNickname(nickname: string): Promise<void> {
    if (!this.client || !this.isReady) return

    try {
      for (const guild of this.client.guilds.cache.values()) {
        const member = guild.members.cache.find(m => m.id === this.client?.user?.id)
        if (member) {
          await member.setNickname(nickname)
        }
      }
    } catch (error) {
      console.error(`[${this.name}] Failed to set nickname:`, error)
    }
  }

  public setActivity(activity: string): void {
    if (!this.client?.user || !this.isReady) return

    try {
      this.client.user.setActivity(activity, {
        type: ActivityType.Watching,
      })
    } catch (error) {
      console.error(`[${this.name}] Failed to set activity:`, error)
    }
  }

  public async updatePriceDisplay(price: string, change24h: number): Promise<void> {
    if (this.type !== 'price' || !this.asset) return

    const direction = change24h >= 0 ? '↗' : '↘'
    const nickname = `${this.asset.toUpperCase()} $${price} (${direction})`
    const activity = `24h: ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`

    await this.setNickname(nickname)
    this.setActivity(activity)
  }

  public async updateFloorPriceDisplay(floorPrice: number): Promise<void> {
    if (this.type !== 'price' || !this.asset) return

    const nickname = `${this.asset.toUpperCase()} ${floorPrice} ETH`
    const activity = `NFT Floor Price`

    await this.setNickname(nickname)
    this.setActivity(activity)
  }

  public isOnline(): boolean {
    return this.isReady && this.client !== null
  }

  public hasToken(): boolean {
    return Boolean(this.token)
  }
}
