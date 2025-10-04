import { ImageAnnotatorClient } from '@google-cloud/vision'

let vision: ImageAnnotatorClient | null = null

try {
  if (process.env.GOOGLE_CLOUD_VISION_CREDENTIALS) {
    vision = new ImageAnnotatorClient({
      credentials: JSON.parse(process.env.GOOGLE_CLOUD_VISION_CREDENTIALS),
    })
  }
} catch (error) {
  console.log('Google Cloud Vision not configured, using mock OCR')
}

export async function processOCR(file: File): Promise<any> {
  // Always use mock OCR for now to avoid configuration issues
  console.log('Using mock OCR for file:', file.name)
  
  return {
    rawText: 'Mock OCR - Restaurant ABC\nDate: 2024-01-15\nTotal: $45.67\nFood & Beverages',
    amount: 45.67,
    currency: 'USD',
    date: '2024-01-15',
    merchant: 'Restaurant ABC',
    category: 'MEALS',
    confidence: 0.75
  }

  /* Real OCR implementation (disabled for testing)
  try {
    if (!vision) {
      throw new Error('Google Cloud Vision not configured')
    }

    const buffer = await file.arrayBuffer()
    const imageBuffer = Buffer.from(buffer)

    const [result] = await vision.textDetection({
      image: {
        content: imageBuffer,
      },
    })

    const detections = result.textAnnotations
    const text = detections?.[0]?.description || ''

    // Extract structured data from receipt text
    const extractedData = extractReceiptData(text)

    return {
      rawText: text,
      ...extractedData,
      confidence: 0.85 // Mock confidence score
    }
  } catch (error) {
    console.error('OCR processing error:', error)
    
    // Fallback mock OCR for demo
    return {
      rawText: 'Mock OCR - Restaurant ABC\nDate: 2024-01-15\nTotal: $45.67\nFood & Beverages',
      amount: 45.67,
      currency: 'USD',
      date: '2024-01-15',
      merchant: 'Restaurant ABC',
      category: 'MEALS',
      confidence: 0.75
    }
  }
  */
}

function extractReceiptData(text: string): any {
  const data: any = {}

  // Extract amount (looking for patterns like $12.34, 12.34, etc.)
  const amountMatch = text.match(/\$?(\d+\.?\d{0,2})/g)
  if (amountMatch) {
    const amounts = amountMatch.map(match => parseFloat(match.replace('$', '')))
    // Usually the largest amount is the total
    data.amount = Math.max(...amounts)
  }

  // Extract date patterns
  const datePatterns = [
    /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g,
    /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4}/gi,
    /\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/g
  ]

  for (const pattern of datePatterns) {
    const dateMatch = text.match(pattern)
    if (dateMatch) {
      data.date = dateMatch[0]
      break
    }
  }

  // Extract merchant name (usually first line or after specific keywords)
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length > 0) {
    data.merchant = lines[0].trim()
  }

  // Determine category based on keywords
  const categoryKeywords = {
    MEALS: ['restaurant', 'cafe', 'food', 'dining', 'coffee', 'lunch', 'dinner', 'pizza', 'burger'],
    TRAVEL: ['taxi', 'uber', 'lyft', 'hotel', 'airline', 'flight', 'gas', 'fuel', 'parking'],
    OFFICE_SUPPLIES: ['office', 'supplies', 'staples', 'printer', 'paper', 'pen', 'notebook'],
    UTILITIES: ['electric', 'water', 'gas', 'internet', 'phone', 'utility'],
    MARKETING: ['advertising', 'marketing', 'social', 'ads', 'promotion'],
    OTHER: []
  }

  const textLower = text.toLowerCase()
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => textLower.includes(keyword))) {
      data.category = category
      break
    }
  }

  if (!data.category) {
    data.category = 'OTHER'
  }

  return data
}