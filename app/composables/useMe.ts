// useMe — fetch and cache the current user's profile + wallet + projects.
// Backed by /api/me. Single source of truth for dashboard / layout / pricing CTAs.

export interface MeProject {
  id:           string
  title:        string
  roomImageUrl: string | null
  bestScore:    number | null
  createdAt:    string
  updatedAt:    string
}

export interface MeWallet {
  monthlyCreditsRemaining:   number
  monthlyCreditsTotal:       number
  purchasedCreditsRemaining: number
  reservedCredits:           number
  resetDate:                 string | null
  available:                 number
}

export interface Me {
  id:    string
  email: string
  name:  string | null
  role:  'user' | 'admin'
  plan:  'free' | 'starter' | 'plus' | 'studio'
  subscription: {
    status:           string | null
    currentPeriodEnd: string | null
  }
  stripeCustomerId: string | null
  wallet:           MeWallet
  projects:         MeProject[]
}

export function useMe() {
  return useFetch<Me>('/api/me', {
    key: 'me',
    server: false,
    lazy: true,
    default: () => null as unknown as Me,
  })
}
