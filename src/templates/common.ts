import { EmbedBuilder } from 'discord.js'
import { BRAND, COLORS, ASSET_COLORS, URLS, EMOJIS, getMedalEmoji, getAssetColor } from '../constants/branding'

export function Footer(embed: EmbedBuilder): EmbedBuilder {
  return embed
    .setFooter({
      iconURL: URLS.ICON,
      text: BRAND.NAME,
    })
    .setTimestamp()
}

export function FooterWithImage(embed: EmbedBuilder): EmbedBuilder {
  return Footer(embed).setImage(URLS.FOOTER_IMAGE)
}

export function AssetColor(asset: string): string {
  return getAssetColor(asset)
}

export function DefaultColor(): string {
  return COLORS.PRIMARY
}

export function SuccessColor(): string {
  return COLORS.SUCCESS
}

export function DangerColor(): string {
  return COLORS.DANGER
}

export function Medal(position: number): string {
  return getMedalEmoji(position)
}

export function ProfitEmoji(pnl: number): string {
  return pnl >= 0 ? EMOJIS.CHART_UP : EMOJIS.CHART_DOWN
}

export function DirectionArrow(change: number): string {
  return change >= 0 ? '↗' : '↘'
}

export function formatPnL(pnl: number): string {
  const sign = pnl >= 0 ? '+' : ''
  return `${sign}$${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatPercent(value: number, showSign = true): string {
  const sign = showSign && value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export { BRAND, COLORS, URLS, EMOJIS }
