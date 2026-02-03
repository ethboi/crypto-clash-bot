import { ChatInputCommandInteraction } from 'discord.js'
import { BRAND, COLORS } from '../../constants/branding'

export async function handleHelpCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const helpText = `
**${BRAND.NAME}** - ${BRAND.TAGLINE}

**Commands:**
\`/leaderboard\` - View the trading leaderboard
\`/winners\` - View top profitable traders
\`/losers\` - View bottom traders (rekt board)
\`/help\` - Show this help message

**Price Bots:**
Our price bots show real-time prices for BTC, ETH, SOL, LINK, and HYPE in their nicknames.

**Leaderboard Updates:**
The leaderboard is automatically posted to the designated channel every 3 hours.

**Need Help?**
Contact the server admins for support.
`

  await interaction.reply({
    content: helpText,
    ephemeral: true,
  })
}
