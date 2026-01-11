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

async function refreshAccessToken() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  
  const data = await response.json();
  return data.data.accessToken; // Adjust based on your ApiResponse structure
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // let accessToken = localStorage.getItem('accessToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    // 'Authorization': `Bearer ${accessToken}`,
  };
  
  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
  
  // If token expired, refresh and retry
  if (response.status === 401) {
    try {
      const errorData = await response.json();
      
      if (errorData.message?.includes('expired')) {
        // const newAccessToken = await refreshAccessToken();
        // localStorage.setItem('accessToken', newAccessToken);
        
        // Retry with new token
        response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
            // 'Authorization': `Bearer ${newAccessToken}`,
          },
          credentials: 'include',
        });
      }
    } catch (error) {
      throw error;
    }
  }
  
  return response;
}