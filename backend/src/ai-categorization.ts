// Simple AI-powered expense categorization using keyword matching
// In production, this could be enhanced with ML models or NLP libraries

interface CategoryKeywords {
  [category: string]: string[]
}

const categoryKeywords: CategoryKeywords = {
  housing: ['rent', 'mortgage', 'property', 'apartment', 'house', 'lease', 'landlord'],
  transport: ['uber', 'lyft', 'taxi', 'bus', 'train', 'metro', 'gas', 'fuel', 'parking', 'car', 'vehicle'],
  food: ['restaurant', 'cafe', 'coffee', 'lunch', 'dinner', 'breakfast', 'food', 'grocery', 'supermarket', 'starbucks', 'mcdonalds'],
  utilities: ['electric', 'water', 'gas', 'internet', 'phone', 'cable', 'utility'],
  healthcare: ['doctor', 'hospital', 'pharmacy', 'medicine', 'medical', 'health', 'dental', 'insurance'],
  entertainment: ['movie', 'cinema', 'netflix', 'spotify', 'game', 'concert', 'show', 'ticket', 'entertainment'],
  shopping: ['amazon', 'shop', 'store', 'retail', 'clothing', 'clothes', 'shoes', 'mall'],
  education: ['school', 'university', 'course', 'book', 'tuition', 'education', 'learning'],
  subscriptions: ['subscription', 'monthly', 'annual', 'membership', 'premium'],
}

export function categorizeExpense(description: string): string {
  const lowerDescription = description.toLowerCase()

  // Check each category's keywords
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerDescription.includes(keyword)) {
        return category
      }
    }
  }

  // Default category if no match found
  return 'other'
}

export function suggestCategory(description: string): { category: string; confidence: number } {
  const lowerDescription = description.toLowerCase()
  const scores: { [category: string]: number } = {}

  // Calculate scores for each category
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let score = 0
    for (const keyword of keywords) {
      if (lowerDescription.includes(keyword)) {
        score += 1
      }
    }
    if (score > 0) {
      scores[category] = score
    }
  }

  // Find category with highest score
  const entries = Object.entries(scores)
  if (entries.length === 0) {
    return { category: 'other', confidence: 0 }
  }

  const [category, score] = entries.reduce((max, curr) =>
    curr[1] > max[1] ? curr : max
  )

  const confidence = Math.min(score / 3, 1) // Normalize to 0-1

  return { category, confidence }
}


