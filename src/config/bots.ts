import { ManagedBotConfig } from '../core/ManagedBot'
import {
  DISCORD_TOKEN_BTC,
  DISCORD_TOKEN_ETH,
  DISCORD_TOKEN_SOL,
  DISCORD_TOKEN_LINK,
  DISCORD_TOKEN_HYPE,
  DISCORD_TOKEN_CLASH,
  DISCORD_TOKEN_TOURNAMENT,
  DISCORD_TOKEN_PATRON,
} from './index'

// CoinGecko IDs for price fetching
export const COINGECKO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  LINK: 'chainlink',
  HYPE: 'hyperliquid',
} as const

// Bot configurations
export const BOT_CONFIGS: ManagedBotConfig[] = [
  // Price Display Bots
  {
    name: 'BTC',
    token: DISCORD_TOKEN_BTC,
    type: 'price',
    asset: 'btc',
    coinGeckoId: COINGECKO_IDS.BTC,
  },
  {
    name: 'ETH',
    token: DISCORD_TOKEN_ETH,
    type: 'price',
    asset: 'eth',
    coinGeckoId: COINGECKO_IDS.ETH,
  },
  {
    name: 'SOL',
    token: DISCORD_TOKEN_SOL,
    type: 'price',
    asset: 'sol',
    coinGeckoId: COINGECKO_IDS.SOL,
  },
  {
    name: 'LINK',
    token: DISCORD_TOKEN_LINK,
    type: 'price',
    asset: 'link',
    coinGeckoId: COINGECKO_IDS.LINK,
  },
  {
    name: 'HYPE',
    token: DISCORD_TOKEN_HYPE,
    type: 'price',
    asset: 'hype',
    coinGeckoId: COINGECKO_IDS.HYPE,
  },

  // CLASH Price Bot (DexScreener)
  {
    name: 'CLASH',
    token: DISCORD_TOKEN_CLASH,
    type: 'price',
    asset: 'clash',
    dexScreenerChain: 'ink',
    dexScreenerPair: '0x4af0ebea525f9006852918d92bf3749ef86cb514',
  },

  // Tournament Bot
  {
    name: 'TOURNAMENT',
    token: DISCORD_TOKEN_TOURNAMENT,
    type: 'tournament',
  },

  // Patron Floor Price Bot (OpenSea)
  {
    name: 'PATRON',
    token: DISCORD_TOKEN_PATRON,
    type: 'price',
    asset: 'patron',
    openSeaCollection: 'crypto-clash-patrons',
  },
]

export const PRICE_BOT_NAMES = ['BTC', 'ETH', 'SOL', 'LINK', 'HYPE'] as const
export type PriceBotName = (typeof PRICE_BOT_NAMES)[number]
