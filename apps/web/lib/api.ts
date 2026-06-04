let rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
if (rawApiUrl && !rawApiUrl.endsWith("/api/v1") && !rawApiUrl.endsWith("/api/v1/")) {
  rawApiUrl = rawApiUrl.replace(/\/+$/, "") + "/api/v1";
}
const API_URL = rawApiUrl;

// Helper to determine if Clerk is configured
export const isClerkActive = (): boolean => {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return !!(
    key &&
    key !== "pk_test_placeholder" &&
    key !== "pk_test_dGVzdC1jbGVyay1zdGFydHVwLWFwcC0xMC5jbGVyay5hY2NvdW50cy5kZXYk"
  );
};

// Get active mock user ID for local development
export const getActiveMockUser = (): string => {
  if (typeof window === "undefined") return "user_demo_1";
  return localStorage.getItem("skillswap_mock_user") || "user_demo_1";
};

// Set active mock user ID for local development
export const setActiveMockUser = (userId: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("skillswap_mock_user", userId);
    window.location.reload(); // Reload to refresh contexts
  }
};

interface FetchOptions extends RequestInit {
  clerkToken?: string | null;
}

export const apiFetch = async (endpoint: string, options: FetchOptions = {}) => {
  const { clerkToken, headers: customHeaders, ...rest } = options;
  const headers = new Headers(customHeaders);

  // Set Content-Type by default if not present
  if (!headers.has("Content-Type") && !(rest.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Handle Authentication
  if (isClerkActive()) {
    if (clerkToken) {
      headers.set("Authorization", `Bearer ${clerkToken}`);
    }
  } else {
    // Inject mock user ID header for Express fallback auth
    headers.set("x-mock-user-id", getActiveMockUser());
  }

  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...rest,
      headers,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`API Fetch Error [${endpoint}]:`, error.message);
    throw error;
  }
};
