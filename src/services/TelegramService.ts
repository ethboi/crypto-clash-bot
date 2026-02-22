const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

// Channel/group ID to post to — set via TELEGRAM_CHANNEL_ID env var
// For now, falls back to sending to all subscribers
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID

interface TournamentInfo {
  name: string
  startDate?: string | Date
  endDate?: string | Date
  lockDate?: string | Date
  prizes?: any
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

async function sendMessage(chatId: string, text: string, parseMode: string = 'HTML'): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('[Telegram] No bot token configured, skipping')
    return false
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: false,
      }),
    })

    const data = (await res.json()) as { ok: boolean; description?: string }
    if (!data.ok) {
      console.error('[Telegram] Failed to send message:', data.description)
      return false
    }

    console.log(`[Telegram] Message sent to ${chatId}`)
    return true
  } catch (error) {
    console.error('[Telegram] Error sending message:', error)
    return false
  }
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export async function telegramNewTournament(tournament: TournamentInfo): Promise<void> {
  if (!TELEGRAM_CHANNEL_ID) return

  const start = tournament.startDate ? formatDate(tournament.startDate) : 'TBA'
  const end = tournament.endDate ? formatDate(tournament.endDate) : 'TBA'
  const lock = tournament.lockDate ? formatDate(tournament.lockDate) : 'TBA'

  const text = `🏆 <b>New Tournament: ${escapeHtml(tournament.name)}</b>

📅 ${start} — ${end}
🔒 Cards lock: ${lock}

🎁 Patron NFTs for top 3 | $CLASH for top 50

Build your deck and compete 👉 <a href="https://www.cryptoclash.ink">cryptoclash.ink</a>`

  await sendMessage(TELEGRAM_CHANNEL_ID, text)
}

export async function telegramTournamentLocked(tournament: TournamentInfo, participantCount: number): Promise<void> {
  if (!TELEGRAM_CHANNEL_ID) return

  const end = tournament.endDate ? formatDate(tournament.endDate) : 'TBA'

  const text = `🔒 <b>${escapeHtml(tournament.name)} — Cards Locked!</b>

${participantCount} players are in. No more card changes.

⚔️ Battle runs until ${end}. May the best deck win!

Check standings 👉 <a href="https://www.cryptoclash.ink">cryptoclash.ink</a>`

  await sendMessage(TELEGRAM_CHANNEL_ID, text)
}

export async function telegramTournamentResults(
  tournament: TournamentInfo,
  topPlayers: Array<{ name: string; score: number }>
): Promise<void> {
  if (!TELEGRAM_CHANNEL_ID) return

  const medals = ['🥇', '🥈', '🥉']
  const podium = topPlayers
    .slice(0, 3)
    .map((p, i) => `${medals[i]} ${escapeHtml(p.name)} — ${p.score.toLocaleString()} pts`)
    .join('\n')

  const text = `🏁 <b>${escapeHtml(tournament.name)} — Results!</b>

${podium}

🎁 Prizes being distributed. GG everyone!

Full results 👉 <a href="https://www.cryptoclash.ink">cryptoclash.ink</a>`

  await sendMessage(TELEGRAM_CHANNEL_ID, text)
}
