interface CurrencyRates {
  [key: string]: number
}

const CACHE_DURATION = 60 * 60 * 1000 // 1 hour
let ratesCache: { [key: string]: { rates: CurrencyRates; timestamp: number } } = {}

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount
  }

  try {
    const rates = await getCurrencyRates(fromCurrency)
    const rate = rates[toCurrency]
    
    if (!rate) {
      throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`)
    }

    return amount * rate
  } catch (error) {
    console.error('Currency conversion error:', error)
    // Return original amount if conversion fails
    return amount
  }
}

export async function getCurrencyRates(baseCurrency: string): Promise<CurrencyRates> {
  const cacheKey = baseCurrency
  const now = Date.now()

  // Check cache first
  if (ratesCache[cacheKey] && (now - ratesCache[cacheKey].timestamp) < CACHE_DURATION) {
    return ratesCache[cacheKey].rates
  }

  try {
    const response = await fetch(
      `${process.env.EXCHANGE_RATE_API_URL}/${baseCurrency}`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch rates: ${response.statusText}`)
    }

    const data = await response.json()
    const rates = data.rates

    // Cache the results
    ratesCache[cacheKey] = {
      rates,
      timestamp: now
    }

    return rates
  } catch (error) {
    console.error('Error fetching currency rates:', error)
    
    // Return mock rates for demo purposes
    return getMockRates(baseCurrency)
  }
}

function getMockRates(baseCurrency: string): CurrencyRates {
  const mockRates: { [key: string]: CurrencyRates } = {
    USD: {
      USD: 1,
      EUR: 0.85,
      GBP: 0.73,
      INR: 83.12,
      JPY: 110.0,
      CAD: 1.25,
      AUD: 1.35
    },
    EUR: {
      USD: 1.18,
      EUR: 1,
      GBP: 0.86,
      INR: 97.8,
      JPY: 129.5,
      CAD: 1.47,
      AUD: 1.59
    },
    GBP: {
      USD: 1.37,
      EUR: 1.16,
      GBP: 1,
      INR: 113.8,
      JPY: 150.7,
      CAD: 1.71,
      AUD: 1.85
    },
    INR: {
      USD: 0.012,
      EUR: 0.010,
      GBP: 0.0088,
      INR: 1,
      JPY: 1.32,
      CAD: 0.015,
      AUD: 0.016
    }
  }

  return mockRates[baseCurrency] || mockRates.USD
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch (error) {
    // Fallback formatting
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function getSupportedCurrencies(): Array<{ code: string; name: string; symbol: string }> {
  return [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
  ]
}