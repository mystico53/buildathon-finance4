export interface TransactionCategory {
  name: string;
  keywords: string[];
  color: string;
  emoji: string;
}

export const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  {
    name: "Food & Dining",
    keywords: [
      "restaurant", "cafe", "coffee", "starbucks", "mcdonald", "kfc", "pizza", 
      "grocery", "supermarket", "food", "dining", "lunch", "dinner", "breakfast",
      "dominos", "subway", "burger", "taco", "chipotle", "wendy", "dunkin",
      "walmart", "target", "kroger", "safeway", "whole foods", "trader joe"
    ],
    color: "#ef4444",
    emoji: "🍽️"
  },
  {
    name: "Transportation",
    keywords: [
      "gas", "fuel", "shell", "exxon", "bp", "chevron", "uber", "lyft", 
      "taxi", "metro", "bus", "train", "parking", "toll", "car wash",
      "vehicle", "automotive", "repair", "maintenance", "insurance",
      "dmv", "registration", "license"
    ],
    color: "#3b82f6",
    emoji: "🚗"
  },
  {
    name: "Entertainment",
    keywords: [
      "netflix", "spotify", "apple music", "hulu", "disney", "amazon prime",
      "movie", "cinema", "theater", "concert", "ticket", "event", "game",
      "steam", "playstation", "xbox", "nintendo", "entertainment", "streaming",
      "cable", "satellite", "youtube", "twitch"
    ],
    color: "#8b5cf6",
    emoji: "🎬"
  },
  {
    name: "Bills & Utilities",
    keywords: [
      "electric", "electricity", "gas bill", "water", "sewer", "internet",
      "phone", "mobile", "verizon", "att", "sprint", "tmobile", "comcast",
      "utility", "bill", "insurance", "rent", "mortgage", "loan", "credit card",
      "payment", "bank fee", "overdraft"
    ],
    color: "#f59e0b",
    emoji: "🧾"
  },
  {
    name: "Shopping",
    keywords: [
      "amazon", "target", "walmart", "costco", "home depot", "lowes", "best buy",
      "apple store", "clothing", "shoes", "electronics", "furniture", "decor",
      "shopping", "retail", "store", "mall", "outlet", "online", "ebay",
      "etsy", "shopify"
    ],
    color: "#10b981",
    emoji: "🛍️"
  },
  {
    name: "Healthcare",
    keywords: [
      "pharmacy", "cvs", "walgreens", "rite aid", "doctor", "hospital", 
      "medical", "dental", "dentist", "clinic", "health", "prescription",
      "medicine", "treatment", "therapy", "specialist", "urgent care",
      "emergency", "lab", "x-ray", "mri"
    ],
    color: "#06b6d4",
    emoji: "🏥"
  },
  {
    name: "Income",
    keywords: [
      "salary", "paycheck", "deposit", "direct deposit", "income", "wage",
      "freelance", "consulting", "contract", "bonus", "commission", "refund",
      "reimbursement", "cashback", "dividend", "interest", "transfer in",
      "payment received"
    ],
    color: "#22c55e",
    emoji: "💰"
  },
  {
    name: "Personal Care",
    keywords: [
      "salon", "barbershop", "spa", "massage", "beauty", "cosmetics", "skincare",
      "haircut", "manicure", "pedicure", "gym", "fitness", "yoga", "pilates",
      "personal trainer", "subscription", "membership"
    ],
    color: "#f472b6",
    emoji: "💅"
  },
  {
    name: "Education",
    keywords: [
      "school", "university", "college", "tuition", "books", "education",
      "course", "training", "certification", "workshop", "seminar", "learning",
      "udemy", "coursera", "masterclass"
    ],
    color: "#a855f7",
    emoji: "📚"
  },
  {
    name: "Other",
    keywords: [],
    color: "#6b7280",
    emoji: "📝"
  }
];

export function categorizeTransaction(description: string): TransactionCategory {
  const lowerDescription = description.toLowerCase();
  
  for (const category of TRANSACTION_CATEGORIES) {
    if (category.name === "Other") continue; // Skip "Other" category in main loop
    
    for (const keyword of category.keywords) {
      if (lowerDescription.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  
  // Return "Other" if no matches found
  return TRANSACTION_CATEGORIES.find(cat => cat.name === "Other")!;
}

export function isIncomeTransaction(description: string, amount: number): boolean {
  // Positive amounts are typically income
  if (amount > 0) return true;
  
  // Check for income keywords even in negative amounts (some banks show deposits as negative)
  const lowerDescription = description.toLowerCase();
  const incomeKeywords = TRANSACTION_CATEGORIES.find(cat => cat.name === "Income")?.keywords || [];
  
  return incomeKeywords.some(keyword => lowerDescription.includes(keyword.toLowerCase()));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Math.abs(amount));
}

export function getUserColor(userSession: string): string {
  // Generate consistent color based on user session
  const colors = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", 
    "#06b6d4", "#f472b6", "#a855f7", "#22c55e", "#f97316"
  ];
  
  let hash = 0;
  for (let i = 0; i < userSession.length; i++) {
    hash = userSession.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}