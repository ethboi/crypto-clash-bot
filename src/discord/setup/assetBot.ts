import { ManagedBot } from '../../core/ManagedBot'
import { priceService } from '../../services/PriceService'
import { COINGECKO_IDS } from '../../config/bots'

export async function setupAssetBot(bot: ManagedBot): Promise<void> {
  if (bot.type !== 'price' || !bot.asset) {
    console.log(`[${bot.name}] Not a price bot, skipping asset setup`)
    return
  }

  console.log(`[${bot.name}] Setting up asset bot for ${bot.asset}`)

  // Initial price update
  await updateBotPrice(bot)
}

export async function updateBotPrice(bot: ManagedBot): Promise<void> {
  if (bot.type !== 'price' || !bot.asset) {
    return
  }

  try {
    let priceData = null

    if (bot.openSeaCollection) {
      priceData = await priceService.fetchOpenSeaFloorPrice(bot.openSeaCollection, bot.asset)
    } else if (bot.dexScreenerChain && bot.dexScreenerPair) {
      priceData = await priceService.fetchDexScreenerPrice(bot.dexScreenerChain, bot.dexScreenerPair, bot.asset)
    } else if (bot.coinGeckoId) {
      priceData = await priceService.fetchPrice(bot.coinGeckoId, bot.asset)
    }

    if (priceData) {
      // OpenSea floor prices are in ETH, not USD
      if (bot.openSeaCollection) {
        await bot.updateFloorPriceDisplay(priceData.price)
        console.log(`[${bot.name}] Updated floor: ${priceData.price} ETH`)
      } else {
        const formattedPrice = priceService.formatPrice(priceData.price, priceData.symbol)
        await bot.updatePriceDisplay(formattedPrice, priceData.change24h)
        console.log(`[${bot.name}] Updated price: $${formattedPrice} (${priceData.change24h.toFixed(2)}%)`)
      }
    }
  } catch (error) {
    console.error(`[${bot.name}] Failed to update price:`, error)
  }
}

export async function updateAllPriceBots(bots: ManagedBot[]): Promise<void> {
  // Fetch CoinGecko prices in one request
  const prices = await priceService.fetchAllPrices()

  // Update each bot with its price
  for (const bot of bots) {
    if (bot.type !== 'price' || !bot.asset || !bot.isOnline()) {
      continue
    }

    // OpenSea and DexScreener bots need individual fetches
    if (bot.openSeaCollection || (bot.dexScreenerChain && bot.dexScreenerPair)) {
      await updateBotPrice(bot)
      continue
    }

    // CoinGecko bots use the batched prices
    const priceData = prices.get(bot.asset.toUpperCase())
    if (priceData) {
      const formattedPrice = priceService.formatPrice(priceData.price, priceData.symbol)
      await bot.updatePriceDisplay(formattedPrice, priceData.change24h)
      console.log(`[${bot.name}] Updated price: $${formattedPrice} (${priceData.change24h.toFixed(2)}%)`)
    }
  }
}
