import { Tournament } from './TournamentReportService'
import { Client, TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import { TWEET_MIRROR_CHANNEL_ID } from '../config'

const POPCHING_URL = process.env.POPCHING_URL || 'http://localhost:3001'
const POPCHING_SECRET = process.env.POPCHING_SECRET || 'popching-cron-2026'
const PROJECT = 'cryptoclash'
const TWITTER_HANDLE = 'CryptoClash_ink'

interface PopchingPost {
  _id: string
}

interface PublishResult {
  tweetId: string
  url: string
}

let discordClient: Client | null = null

export function setDiscordClient(client: Client): void {
  discordClient = client
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

async function publishPost(postId: string): Promise<PublishResult | null> {
  try {
    const res = await fetch(`${POPCHING_URL}/api/posts/${postId}/publish?secret=${POPCHING_SECRET}`, {
      method: 'POST',
    })
    const data = await res.json() as { tweetId?: string; url?: string; error?: string }
    if (data.tweetId) {
      const url = data.url || `https://x.com/${TWITTER_HANDLE}/status/${data.tweetId}`
      console.log(`[Popching] Published tweet: ${url}`)
      return { tweetId: data.tweetId, url }
    }
    console.error('[Popching] Publish failed:', data.error)
    return null
  } catch (error) {
    console.error('[Popching] Failed to publish:', error)
    return null
  }
}

async function mirrorToDiscord(tweetText: string, tweetUrl: string): Promise<void> {
  if (!discordClient || !TWEET_MIRROR_CHANNEL_ID) return

  try {
    const channel = await discordClient.channels.fetch(TWEET_MIRROR_CHANNEL_ID) as TextChannel
    if (!channel) return

    const embed = new EmbedBuilder()
      .setAuthor({ name: `@${TWITTER_HANDLE}`, url: `https://x.com/${TWITTER_HANDLE}` })
      .setDescription(tweetText)
      .setColor(0x7B2FBE)
      .setTimestamp()
      .setFooter({ text: 'Help us grow — like & retweet!' })

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('❤️ Like')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://x.com/intent/like?tweet_id=${tweetUrl.split('/').pop()}`),
      new ButtonBuilder()
        .setLabel('🔁 Retweet')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://x.com/intent/retweet?tweet_id=${tweetUrl.split('/').pop()}`),
      new ButtonBuilder()
        .setLabel('💬 Reply')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://x.com/intent/tweet?in_reply_to=${tweetUrl.split('/').pop()}`),
      new ButtonBuilder()
        .setLabel('🔗 View Tweet')
        .setStyle(ButtonStyle.Link)
        .setURL(tweetUrl),
    )

    await channel.send({ embeds: [embed], components: [row] })
    console.log(`[Popching] Mirrored tweet to Discord channel ${TWEET_MIRROR_CHANNEL_ID}`)
  } catch (error) {
    console.error('[Popching] Failed to mirror to Discord:', error)
  }
}

async function postAndMirror(text: string, imageUrl?: string): Promise<void> {
  const postId = await createPost(text, imageUrl)
  if (!postId) return
  const result = await publishPost(postId)
  if (result) {
    await mirrorToDiscord(text, result.url)
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

  await postAndMirror(text, imageUrl)
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
    title: '🔒 Cards Locked!',
    subtitle: 'THE BATTLE BEGINS',
    s1l: 'PLAYERS', s1v: String(participantCount),
    s2l: 'TOURNAMENT', s2v: `Week ${weekNum}`,
    s3l: 'DURATION', s3v: `${days} Days`,
    p1: 'AI Agent Players Coming Soon',
    p1i: '🤖',
    footer: 'CRYPTOCLASH.INK',
  })

  await postAndMirror(text, imageUrl)
}

export async function tweetTournamentResults(tournament: Tournament, topPlayers: { name: string; score: number }[]): Promise<void> {
  const weekNum = tournament.weekNumber || '?'
  const prizes = tournament.prizes || []

  const getPrize = (pos: number) => prizes.find(p => p.position === pos)

  let resultsText = ''
  if (topPlayers.length >= 3) {
    const p1 = getPrize(1)
    const p2 = getPrize(2)
    const p3 = getPrize(3)
    resultsText = `\n\n🥇 ${topPlayers[0].name}${p1 ? ` — ${p1.patronNFTs} NFTs + ${(p1.clashTokens/1000).toFixed(0)}K $CLASH` : ''}`
    resultsText += `\n🥈 ${topPlayers[1].name}${p2 ? ` — ${p2.patronNFTs} NFTs + ${(p2.clashTokens/1000).toFixed(0)}K $CLASH` : ''}`
    resultsText += `\n🥉 ${topPlayers[2].name}${p3 ? ` — ${p3.patronNFTs} NFT + ${(p3.clashTokens/1000).toFixed(0)}K $CLASH` : ''}`
  }

  const text = `🏆 Weekly Tournament #${weekNum} is over!${resultsText}

4th-50th also received $CLASH 🎁

Next tournament coming soon. Build your deck 👉 cryptoclash.ink`

  const imageParams: Record<string, string> = {
    title: `Tournament #${weekNum} Results 🏆`,
    subtitle: 'FINAL STANDINGS',
    footer: 'CRYPTOCLASH.INK',
  }

  if (topPlayers.length >= 1) { imageParams.s1l = '🥇 1ST'; imageParams.s1v = topPlayers[0].name }
  if (topPlayers.length >= 2) { imageParams.s2l = '🥈 2ND'; imageParams.s2v = topPlayers[1].name }
  if (topPlayers.length >= 3) { imageParams.s3l = '🥉 3RD'; imageParams.s3v = topPlayers[2].name }
  imageParams.p1 = getPrize(1) ? `${getPrize(1)!.patronNFTs} NFTs + ${(getPrize(1)!.clashTokens/1000).toFixed(0)}K $CLASH to 1st` : 'Patron NFTs for Top 3'
  imageParams.p2 = '$CLASH tokens for Top 50'

  const imageUrl = buildCcCardUrl(imageParams)

  await postAndMirror(text, imageUrl)
}
