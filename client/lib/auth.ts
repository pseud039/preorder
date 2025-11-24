export const markOnboardingComplete = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('hasSeenOnboarding', 'true')
  }
}

export const hasSeenOnboarding = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('hasSeenOnboarding') === 'true'
  }
  return false
}

export const resetOnboarding = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hasSeenOnboarding')
  }
}