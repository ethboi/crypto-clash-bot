import { Tournament } from './TournamentReportService'

const POPCHING_URL = process.env.POPCHING_URL || 'http://localhost:3001'
const POPCHING_SECRET = process.env.POPCHING_SECRET || 'popching-cron-2026'
const PROJECT = 'cryptoclash'

interface PopchingPost {
  _id: string
}

async function createPost(text: string, imageUrl?: string): Promise<string | null> {
  try {
    const res = await fetch(`${POPCHING_URL}/api/posts?secret=${POPCHING_SECRET}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: PROJECT, text, platform: 'twitter' }),
    })
    const data = await res.json() as { item: PopchingPost }
    const postId = data.item._id

    if (imageUrl) {
      await fetch(`${POPCHING_URL}/api/posts/${postId}?secret=${POPCHING_SECRET}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { imageUrl } }),
      })
    }

    return postId
  } catch (error) {
    console.error('[Popching] Failed to create post:', error)
    return null
  }
}

async function publishPost(postId: string): Promise<string | null> {
  try {
    const res = await fetch(`${POPCHING_URL}/api/posts/${postId}/publish?secret=${POPCHING_SECRET}`, {
      method: 'POST',
    })
    const data = await res.json() as { tweetId?: string; error?: string }
    if (data.tweetId) {
      console.log(`[Popching] Published tweet: ${data.tweetId}`)
      return data.tweetId
    }
    console.error('[Popching] Publish failed:', data.error)
    return null
  } catch (error) {
    console.error('[Popching] Failed to publish:', error)
    return null
  }
}

function buildCcCardUrl(params: Record<string, string>): string {
  const qs = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')
  return `/api/og/cc-card?${qs}`
}

function formatDate(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`
}

export async function tweetNewTournament(tournament: Tournament): Promise<void> {
  const start = new Date(tournament.startDate)
  const end = new Date(tournament.endDate)
  const lock = new Date(tournament.lockDate)
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const weekNum = tournament.weekNumber || '?'

  const text = `🃏 Pick your heroes, choose your strategy, and let the market decide who wins. Best rank after ${days} days, better prizes.

⚔️ Weekly Tournament #${weekNum} starts ${formatDate(start)}

🔒 Lock your cards by ${formatDate(lock)}
🏆 Patron NFTs for top 3
💰 $CLASH for top 50

Built on @inkonchain

Join now 👉 cryptoclash.ink`

  const imageUrl = buildCcCardUrl({
    title: `Weekly Tournament #${weekNum}`,
    subtitle: `LOCK YOUR CARDS BY ${formatDate(lock).toUpperCase()}`,
    s1l: 'STARTS', s1v: formatDate(start),
    s2l: 'ENDS', s2v: formatDate(end),
    s3l: 'DURATION', s3v: `${days} Days`,
    p1: 'Patron NFTs (Top 3)',
    p2: '$CLASH (Top 50)',
    footer: 'CRYPTOCLASH.INK',
  })

  const postId = await createPost(text, imageUrl)
  if (postId) await publishPost(postId)
}

export async function tweetTournamentLocked(tournament: Tournament, participantCount: number): Promise<void> {
  const weekNum = tournament.weekNumber || '?'
  const end = new Date(tournament.endDate)
  const start = new Date(tournament.startDate)
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  const text = `🔒 Cards are locked for Weekly Tournament #${weekNum}!

${participantCount} players have entered. The battle begins now ⚔️

Who will climb the ranks? Follow the action at cryptoclash.ink`

  const imageUrl = buildCcCardUrl({
    title: 'Cards Locked! ⚔️',
    subtitle: 'THE BATTLE BEGINS',
    s1l: 'PLAYERS', s1v: String(participantCount),
    s2l: 'TOURNAMENT', s2v: `Week ${weekNum}`,
    s3l: 'DURATION', s3v: `${days} Days`,
    footer: 'CRYPTOCLASH.INK',
  })

  const postId = await createPost(text, imageUrl)
  if (postId) await publishPost(postId)
}

export async function tweetTournamentResults(tournament: Tournament, topPlayers: { name: string; score: number }[]): Promise<void> {
  const weekNum = tournament.weekNumber || '?'

  let resultsText = ''
  if (topPlayers.length >= 3) {
    resultsText = `\n\n🥇 ${topPlayers[0].name}\n🥈 ${topPlayers[1].name}\n🥉 ${topPlayers[2].name}`
  }

  const text = `🏆 Weekly Tournament #${weekNum} is over!${resultsText}

Congrats to all winners! Prizes incoming 🎁

Next tournament coming soon. Build your deck 👉 cryptoclash.ink`

  const imageParams: Record<string, string> = {
    title: `Tournament #${weekNum} Results 🏆`,
    subtitle: 'FINAL STANDINGS',
    footer: 'CRYPTOCLASH.INK',
  }

  if (topPlayers.length >= 1) { imageParams.s1l = '🥇 1ST'; imageParams.s1v = topPlayers[0].name }
  if (topPlayers.length >= 2) { imageParams.s2l = '🥈 2ND'; imageParams.s2v = topPlayers[1].name }
  if (topPlayers.length >= 3) { imageParams.s3l = '🥉 3RD'; imageParams.s3v = topPlayers[2].name }

  const imageUrl = buildCcCardUrl(imageParams)

  const postId = await createPost(text, imageUrl)
  if (postId) await publishPost(postId)
}
