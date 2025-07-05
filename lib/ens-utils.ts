// ENS utility functions for subdomain management

export interface EnsCheckResult {
  available: boolean
  error?: string
}

export async function checkEnsSubdomainAvailability(subdomain: string): Promise<EnsCheckResult> {
  try {
    // Basic validation
    if (!subdomain || subdomain.length < 3) {
      return { available: false, error: "Minimum 3 characters required" }
    }

    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return { available: false, error: "Only lowercase letters, numbers, and hyphens allowed" }
    }

    if (subdomain.startsWith("-") || subdomain.endsWith("-")) {
      return { available: false, error: "Cannot start or end with a hyphen" }
    }

    // Reserved names that should not be available
    const reservedNames = [
      "admin",
      "administrator",
      "root",
      "system",
      "api",
      "www",
      "mail",
      "ftp",
      "test",
      "staging",
      "dev",
      "development",
      "prod",
      "production",
      "user",
      "users",
      "account",
      "accounts",
      "wallet",
      "wallets",
      "romi",
      "toromi",
      "eth",
      "ethereum",
      "crypto",
      "blockchain",
      "support",
      "help",
      "info",
      "contact",
      "about",
      "terms",
      "privacy",
      "security",
      "login",
      "signup",
      "register",
      "auth",
      "oauth",
    ]

    if (reservedNames.includes(subdomain.toLowerCase())) {
      return { available: false, error: "This name is reserved" }
    }

    // TODO: Replace with actual ENS resolver check
    // For now, simulate with random availability
    const isAvailable = Math.random() > 0.3

    return {
      available: isAvailable,
      error: isAvailable ? undefined : "This subdomain is already taken",
    }
  } catch (error) {
    console.error("ENS availability check failed:", error)
    return { available: false, error: "Failed to check availability" }
  }
}

export function generateRandomSubdomain(): string {
  const adjectives = [
    "swift",
    "bright",
    "cool",
    "smart",
    "quick",
    "bold",
    "calm",
    "wise",
    "pure",
    "free",
    "brave",
    "clear",
    "fast",
    "kind",
    "neat",
    "safe",
    "warm",
    "wild",
    "zen",
    "ace",
    "blue",
    "gold",
    "mint",
    "pink",
    "ruby",
    "sage",
    "teal",
    "void",
    "wave",
    "zest",
  ]

  const nouns = [
    "fox",
    "wolf",
    "eagle",
    "lion",
    "bear",
    "hawk",
    "star",
    "moon",
    "sun",
    "wave",
    "fire",
    "wind",
    "rain",
    "snow",
    "leaf",
    "tree",
    "rock",
    "gem",
    "coin",
    "key",
    "bird",
    "fish",
    "cat",
    "dog",
    "owl",
    "bee",
    "ant",
    "ray",
    "sky",
    "sea",
  ]

  const numbers = Math.floor(Math.random() * 999) + 1

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]

  return `${adjective}${noun}${numbers}`
}

export function validateSubdomain(subdomain: string): { valid: boolean; error?: string } {
  if (!subdomain) {
    return { valid: false, error: "Subdomain is required" }
  }

  if (subdomain.length < 3) {
    return { valid: false, error: "Minimum 3 characters required" }
  }

  if (subdomain.length > 30) {
    return { valid: false, error: "Maximum 30 characters allowed" }
  }

  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    return { valid: false, error: "Only lowercase letters, numbers, and hyphens allowed" }
  }

  if (subdomain.startsWith("-") || subdomain.endsWith("-")) {
    return { valid: false, error: "Cannot start or end with a hyphen" }
  }

  if (subdomain.includes("--")) {
    return { valid: false, error: "Cannot contain consecutive hyphens" }
  }

  return { valid: true }
}

export function formatEnsName(subdomain: string): string {
  return `${subdomain}.toromi.eth`
}
