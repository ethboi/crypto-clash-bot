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

// Leaderboard Configuration
export const LEADERBOARD_CHANNEL = _.defaultTo(process.env.LEADERBOARD_CHANNEL, 'leaderboard')
export const LEADERBOARD_UPDATE_HOURS = Number(_.defaultTo(process.env.LEADERBOARD_UPDATE_HOURS, '3'))

// Database
export const DATABASE_URL = _.defaultTo(process.env.DATABASE_URL, '')

// Feature Flags
export const DISCORD_ENABLED: boolean = _.defaultTo(
  convertToBoolean(process.env.DISCORD_ENABLED as string),
  true,
) as boolean

// Price Update Interval (in minutes)
export const PRICE_UPDATE_INTERVAL = Number(_.defaultTo(process.env.PRICE_UPDATE_INTERVAL, '1'))
