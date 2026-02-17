import * as dotenv from 'dotenv'
import * as _ from 'lodash'
import { convertToBoolean } from '../utils/utils'

dotenv.config({ path: '.env' })

// Price Display Bots
export const DISCORD_TOKEN_BTC = _.defaultTo(process.env.DISCORD_TOKEN_BTC, '')
export const DISCORD_TOKEN_ETH = _.defaultTo(process.env.DISCORD_TOKEN_ETH, '')
export const DISCORD_TOKEN_SOL = _.defaultTo(process.env.DISCORD_TOKEN_SOL, '')
export const DISCORD_TOKEN_LINK = _.defaultTo(process.env.DISCORD_TOKEN_LINK, '')
export const DISCORD_TOKEN_HYPE = _.defaultTo(process.env.DISCORD_TOKEN_HYPE, '')

// Main Bots
export const DISCORD_TOKEN_CLASH = _.defaultTo(process.env.DISCORD_TOKEN_CLASH, '')
export const DISCORD_TOKEN_TOURNAMENT = _.defaultTo(process.env.DISCORD_TOKEN_TOURNAMENT, '')
export const DISCORD_TOKEN_PATRON = _.defaultTo(process.env.DISCORD_TOKEN_PATRON, '')

// API Keys
export const OPENSEA_API_KEY = _.defaultTo(process.env.OPENSEA_API_KEY, '')

// Leaderboard Configuration
export const LEADERBOARD_CHANNEL = _.defaultTo(process.env.LEADERBOARD_CHANNEL, 'leaderboard')
export const LEADERBOARD_UPDATE_HOURS = Number(_.defaultTo(process.env.LEADERBOARD_UPDATE_HOURS, '3'))

// Database
export const DATABASE_URL = _.defaultTo(process.env.DATABASE_URL, '')

// MongoDB (for tournament reports)
export const MONGO_USER = _.defaultTo(process.env.MONGO_USER, '')
export const MONGO_SECRET = _.defaultTo(process.env.MONGO_SECRET, '')
export const MONGO_URL = _.defaultTo(process.env.MONGO_URL, '')
export const MONGO_DB = _.defaultTo(process.env.MONGO_DB, '')

// Tournament Report Channels
export const TOURNAMENT_STANDINGS_CHANNEL_ID = _.defaultTo(process.env.TOURNAMENT_STANDINGS_CHANNEL_ID, '')
export const TOURNAMENT_RESULTS_CHANNEL_ID = _.defaultTo(process.env.TOURNAMENT_RESULTS_CHANNEL_ID, '')
export const TOURNAMENT_ANNOUNCE_CHANNEL_ID = _.defaultTo(process.env.TOURNAMENT_ANNOUNCE_CHANNEL_ID, '')
export const CRYPTO_CLASH_URL = _.defaultTo(process.env.CRYPTO_CLASH_URL, 'https://cryptoclash.me')

// Pinned Leaderboard
export const PINNED_LEADERBOARD_UPDATE_MINUTES = Number(_.defaultTo(process.env.PINNED_LEADERBOARD_UPDATE_MINUTES, '60'))

// Feature Flags
export const DISCORD_ENABLED: boolean = _.defaultTo(
  convertToBoolean(process.env.DISCORD_ENABLED as string),
  true,
) as boolean

// Price Update Interval (in minutes)
export const PRICE_UPDATE_INTERVAL = Number(_.defaultTo(process.env.PRICE_UPDATE_INTERVAL, '1'))
