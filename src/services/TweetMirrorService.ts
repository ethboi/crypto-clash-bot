import { Client, TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import { TWEET_MIRROR_CHANNEL_ID } from '../config'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

const API_KEY = process.env.TWITTER_API_KEY || ''
const API_SECRET = process.env.TWITTER_API_SECRET || ''
const ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN || ''
const ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET || ''
const TWITTER_USER_ID = process.env.TWITTER_USER_ID || ''
const TWITTER_HANDLE = 'CryptoClash_ink'
const POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

let lastTweetId: string | null = null

function getOAuth(): OAuth {
  return new OAuth({
    consumer: { key: API_KEY, secret: API_SECRET },
    signature_method: 'HMAC-SHA1',
    hash_function(baseString, key) {
      return crypto.createHmac('sha1', key).update(baseString).digest('base64')
    },
  })
}

async function fetchWithOAuth(url: string): Promise<any> {
  const oauth = getOAuth()
  const requestData = { url, method: 'GET' }
  const token = { key: ACCESS_TOKEN, secret: ACCESS_SECRET }
  const headers = oauth.toHeader(oauth.authorize(requestData, token))

  const res = await fetch(url, {
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
  return res.json()
}

async function getLatestTweets(sinceId?: string): Promise<any[]> {
  if (!TWITTER_USER_ID) return []

  let url = `https://api.twitter.com/2/users/${TWITTER_USER_ID}/tweets?max_results=5&tweet.fields=created_at,text`
  if (sinceId) {
    url += `&since_id=${sinceId}`
  }

  try {
    const data = await fetchWithOAuth(url)
    return data.data || []
  } catch (error) {
    console.error('[TweetMirror] Failed to fetch tweets:', error)
    return []
  }
}

async function mirrorTweet(client: Client, tweet: { id: string; text: string }): Promise<void> {
  if (!TWEET_MIRROR_CHANNEL_ID) return

  try {
    const channel = await client.channels.fetch(TWEET_MIRROR_CHANNEL_ID) as TextChannel
    if (!channel) return

    const tweetUrl = `https://x.com/${TWITTER_HANDLE}/status/${tweet.id}`

    const embed = new EmbedBuilder()
      .setAuthor({ name: `@${TWITTER_HANDLE}`, url: `https://x.com/${TWITTER_HANDLE}` })
      .setDescription(tweet.text)
      .setColor(0x7B2FBE)
      .setTimestamp()
      .setFooter({ text: 'Help us grow — like & retweet!' })

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('❤️ Like')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://x.com/intent/like?tweet_id=${tweet.id}`),
      new ButtonBuilder()
        .setLabel('🔁 Retweet')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://x.com/intent/retweet?tweet_id=${tweet.id}`),
      new ButtonBuilder()
        .setLabel('💬 Reply')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://x.com/intent/tweet?in_reply_to=${tweet.id}`),
      new ButtonBuilder()
        .setLabel('🔗 View Tweet')
        .setStyle(ButtonStyle.Link)
        .setURL(tweetUrl),
    )

    await channel.send({ embeds: [embed], components: [row] })
    console.log(`[TweetMirror] Mirrored tweet ${tweet.id} to Discord`)
  } catch (error) {
    console.error('[TweetMirror] Failed to mirror tweet:', error)
  }
}

export function startTweetMirror(client: Client): void {
  if (!API_KEY || !TWITTER_USER_ID || !TWEET_MIRROR_CHANNEL_ID) {
    console.log('[TweetMirror] Missing config, skipping tweet mirror')
    return
  }

  console.log(`[TweetMirror] Starting tweet mirror for @${TWITTER_HANDLE} (polling every ${POLL_INTERVAL_MS / 1000}s)`)

  // Initial fetch to set baseline (don't mirror old tweets)
  getLatestTweets().then(tweets => {
    if (tweets.length > 0) {
      lastTweetId = tweets[0].id
      console.log(`[TweetMirror] Baseline set at tweet ${lastTweetId}`)
    }
  })

  // Poll for new tweets
  setInterval(async () => {
    try {
      const tweets = await getLatestTweets(lastTweetId || undefined)
      if (tweets.length === 0) return

      // Post in chronological order (oldest first)
      const sorted = tweets.reverse()
      for (const tweet of sorted) {
        await mirrorTweet(client, tweet)
      }

      // Update last seen
      lastTweetId = tweets[tweets.length - 1].id || lastTweetId
    } catch (error) {
      console.error('[TweetMirror] Poll error:', error)
    }
  }, POLL_INTERVAL_MS)
}
