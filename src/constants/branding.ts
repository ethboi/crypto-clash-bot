// Crypto Clash Branding Constants

export const BRAND = {
  NAME: 'Crypto Clash',
  SHORT_NAME: 'CC',
  TAGLINE: 'Trade. Compete. Win.',
} as const

export const COLORS = {
  PRIMARY: '#FF6B35',      // Orange - main brand color
  SECONDARY: '#1A1A2E',    // Dark blue/purple background
  ACCENT: '#FFD700',       // Gold for highlights
  SUCCESS: '#00FF88',      // Green for profits
  DANGER: '#FF4444',       // Red for losses
  NEUTRAL: '#FFFFFF',      // White
  MUTED: '#808080',        // Gray
} as const

export const ASSET_COLORS: Record<string, string> = {
  btc: '#F7931A',
  eth: '#627EEA',
  sol: '#14F195',
  link: '#2A5ADA',
  hype: '#FF6B35',
} as const

export const URLS = {
  WEBSITE: 'https://cryptoclash.io',
  DISCORD: 'https://discord.gg/cryptoclash',
  TWITTER: 'https://twitter.com/cryptoclash',
  LOGO: 'https://raw.githubusercontent.com/cryptoclash/assets/main/logo.png',
  ICON: 'https://raw.githubusercontent.com/cryptoclash/assets/main/icon.png',
  FOOTER_IMAGE: 'https://raw.githubusercontent.com/cryptoclash/assets/main/footer.png',
  SPACER: 'https://raw.githubusercontent.com/cryptoclash/assets/main/spacer.png',
} as const

export const EMOJIS = {
  GOLD: '🥇',
  SILVER: '🥈',
  BRONZE: '🥉',
  MEDAL: '🏅',
  TROPHY: '🏆',
  ROCKET: '🚀',
  FIRE: '🔥',
  CHART_UP: '📈',
  CHART_DOWN: '📉',
  MONEY: '💰',
  SKULL: '💀',
  CROWN: '👑',
  SWORD: '⚔️',
  LIGHTNING: '⚡',
} as const

export function getMedalEmoji(position: number): string {
  switch (position) {
    case 1:
      return EMOJIS.GOLD
    case 2:
      return EMOJIS.SILVER
    case 3:
      return EMOJIS.BRONZE
    default:
      return EMOJIS.MEDAL
  }
}

export function getAssetColor(asset: string): string {
  return ASSET_COLORS[asset.toLowerCase()] || COLORS.PRIMARY
}
