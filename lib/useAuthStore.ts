import { create } from "zustand";
import { persist } from "zustand/middleware";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: string;
  locale: string;
  created_at?: string;
};

export type AuthStore = {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    company: {
      name: string;
      description: string;
      logo_url?: string;
      location: string;
      company_type: "supplier" | "consumer";
    };
    user: {
      first_name: string;
      last_name: string;
      phone_number: string;
      email: string;
      password: string;
      role: "owner";
      locale: string;
    };
  }) => Promise<void>;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
      loading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            let errorMessage = "Login failed";
            try {
              const errorData = await response.json();
              errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch (e) {
              errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const data = await response.json();
          set({
            isAuthenticated: true,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            user: data.user,
            loading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error instanceof TypeError
            ? "Failed to connect to server. Make sure the API server is running at http://127.0.0.1:8000"
            : error.message;
          set({
            error: errorMessage,
            loading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (registrationData) => {
        set({ loading: true, error: null });
        console.log("Sending registration data:", JSON.stringify(registrationData, null, 2));
        try {
          const response = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(registrationData),
          });

          if (!response.ok) {
            let errorMessage = "Registration failed";
            let responseText = "";
            try {
              responseText = await response.text();
              console.log("Response status:", response.status);
              console.log("Response body:", responseText);

              const errorData = JSON.parse(responseText);
              errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
            } catch (e) {
              errorMessage = `Server error: ${response.status} ${response.statusText} - ${responseText}`;
            }
            throw new Error(errorMessage);
          }

          const data = await response.json();
          set({
            isAuthenticated: true,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            user: data.user,
            loading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error instanceof TypeError
            ? "Failed to connect to server. Make sure the API server is running at http://127.0.0.1:8000"
            : error.message;
          set({
            error: errorMessage,
            loading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          user: null,
          error: null,
        });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
