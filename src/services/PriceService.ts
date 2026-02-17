import axios from 'axios'
import { COINGECKO_IDS } from '../config/bots'
import { OPENSEA_API_KEY } from '../config'

export interface PriceData {
  symbol: string
  price: number
  change24h: number
  lastUpdated: Date
}

export interface CoinGeckoPrice {
  usd: number
  usd_24h_change: number
}

export interface CoinGeckoPriceResponse {
  [key: string]: CoinGeckoPrice
}

export interface DexScreenerPair {
  priceUsd: string
  priceChange: {
    h24: number
  }
  baseToken: {
    symbol: string
  }
}

export interface DexScreenerResponse {
  pairs: DexScreenerPair[] | null
}

export interface OpenSeaCollectionStats {
  total: {
    floor_price: number
    floor_price_symbol: string
  }
}

class PriceService {
  private cache: Map<string, PriceData> = new Map()
  private readonly CACHE_TTL_MS = 30000 // 30 seconds

  private readonly coinGeckoUrl = 'https://api.coingecko.com/api/v3/simple/price'
  private readonly dexScreenerUrl = 'https://api.dexscreener.com/latest/dex/pairs'
  private readonly openSeaUrl = 'https://api.opensea.io/api/v2/collections'

  async fetchPrice(coinGeckoId: string, symbol: string): Promise<PriceData | null> {
    try {
      const response = await axios.get<CoinGeckoPriceResponse>(this.coinGeckoUrl, {
        params: {
          ids: coinGeckoId,
          vs_currencies: 'usd',
          include_24hr_change: 'true',
        },
      })

      const data = response.data[coinGeckoId]
      if (!data) {
        console.error(`No price data for ${coinGeckoId}`)
        return null
      }

      const priceData: PriceData = {
        symbol: symbol.toUpperCase(),
        price: data.usd,
        change24h: data.usd_24h_change || 0,
        lastUpdated: new Date(),
      }

      this.cache.set(symbol.toUpperCase(), priceData)
      return priceData
    } catch (error) {
      console.error(`Error fetching price for ${coinGeckoId}:`, error)
      return this.cache.get(symbol.toUpperCase()) || null
    }
  }

  async fetchAllPrices(): Promise<Map<string, PriceData>> {
    const ids = Object.values(COINGECKO_IDS)
    const symbols = Object.keys(COINGECKO_IDS)

    try {
      const response = await axios.get<CoinGeckoPriceResponse>(this.coinGeckoUrl, {
        params: {
          ids: ids.join(','),
          vs_currencies: 'usd',
          include_24hr_change: 'true',
        },
      })

      const results = new Map<string, PriceData>()

      for (let i = 0; i < ids.length; i++) {
        const id = ids[i]
        const symbol = symbols[i]
        const data = response.data[id]

        if (data) {
          const priceData: PriceData = {
            symbol: symbol.toUpperCase(),
            price: data.usd,
            change24h: data.usd_24h_change || 0,
            lastUpdated: new Date(),
          }
          results.set(symbol.toUpperCase(), priceData)
          this.cache.set(symbol.toUpperCase(), priceData)
        }
      }

      return results
    } catch (error) {
      console.error('Error fetching all prices:', error)
      return this.cache
    }
  }

  async fetchDexScreenerPrice(chain: string, pairAddress: string, symbol: string): Promise<PriceData | null> {
    try {
      const response = await axios.get<DexScreenerResponse>(`${this.dexScreenerUrl}/${chain}/${pairAddress}`)

      const pair = response.data.pairs?.[0]
      if (!pair) {
        return null
      }

      const priceData: PriceData = {
        symbol: symbol.toUpperCase(),
        price: parseFloat(pair.priceUsd),
        change24h: pair.priceChange?.h24 || 0,
        lastUpdated: new Date(),
      }

      this.cache.set(symbol.toUpperCase(), priceData)
      return priceData
    } catch (error) {
      console.error(`Error fetching DexScreener price for ${symbol}:`, error instanceof Error ? error.message : error)
      return this.cache.get(symbol.toUpperCase()) || null
    }
  }

  async fetchOpenSeaFloorPrice(collectionSlug: string, symbol: string): Promise<PriceData | null> {
    if (!OPENSEA_API_KEY) {
      console.error(`No OpenSea API key configured`)
      return this.cache.get(symbol.toUpperCase()) || null
    }

    try {
      const response = await axios.get<OpenSeaCollectionStats>(`${this.openSeaUrl}/${collectionSlug}/stats`, {
        headers: {
          'x-api-key': OPENSEA_API_KEY,
        },
      })

      const floorPrice = response.data.total?.floor_price
      if (floorPrice === undefined) {
        console.error(`No floor price for collection ${collectionSlug}`)
        return null
      }

      const priceData: PriceData = {
        symbol: symbol.toUpperCase(),
        price: floorPrice,
        change24h: 0, // OpenSea doesn't provide 24h change for floor price
        lastUpdated: new Date(),
      }

      this.cache.set(symbol.toUpperCase(), priceData)
      return priceData
    } catch (error) {
      console.error(`Error fetching OpenSea floor price for ${symbol}:`, error instanceof Error ? error.message : error)
      return this.cache.get(symbol.toUpperCase()) || null
    }
  }

  getCachedPrice(symbol: string): PriceData | undefined {
    return this.cache.get(symbol.toUpperCase())
  }

  formatPrice(price: number, symbol: string): string {
    // BTC typically shows no decimals for large prices
    if (symbol.toUpperCase() === 'BTC') {
      if (price >= 1000) {
        return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      }
    }

    // Most assets show 2 decimals
    if (price >= 1) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    // Small prices show more decimals
    if (price >= 0.01) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
    }

    return price.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })
  }
}

export const priceService = new PriceService()
