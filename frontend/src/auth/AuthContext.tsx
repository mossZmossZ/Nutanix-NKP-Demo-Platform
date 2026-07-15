import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type User } from "@/lib/api";
import { useHeartbeat } from "./useHeartbeat";

// Fallbacks until /me/settings loads (and for logged-out surfaces). Mirror the
// backend Settings defaults so the header/lab render sensibly before the fetch.
const DEFAULT_PLATFORM_NAME = "NKP Workshop";
const DEFAULT_DOC_FONT_SIZE = 16;

interface AuthState {
  user: User | null;
  loading: boolean;
  // Resolved platform settings for the current user (platform name + effective
  // lab-guide font size, i.e. this user's preference or the platform default).
  platformName: string;
  docFontSize: number;
  updateDocFontSize: (size: number) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [platformName, setPlatformName] = useState(DEFAULT_PLATFORM_NAME);
  const [docFontSize, setDocFontSize] = useState(DEFAULT_DOC_FONT_SIZE);

  // On load, ask the server who we are (valid cookie -> user, else 401).
  useEffect(() => {
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Load resolved settings whenever we become authenticated (covers both fresh
  // login and reload); reset to defaults on logout.
  useEffect(() => {
    if (!user) {
      setPlatformName(DEFAULT_PLATFORM_NAME);
      setDocFontSize(DEFAULT_DOC_FONT_SIZE);
      return;
    }
    api<{ platformName: string; docFontSize: number }>("/me/settings")
      .then((s) => {
        setPlatformName(s.platformName);
        setDocFontSize(s.docFontSize);
      })
      .catch(() => {
        // keep defaults on failure — settings are non-critical chrome
      });
  }, [user]);

  // Presence heartbeat runs whenever we have an authenticated user.
  useHeartbeat(!!user);

  async function updateDocFontSize(size: number) {
    const { docFontSize: saved } = await api<{ docFontSize: number }>("/me/preferences", {
      method: "PATCH",
      body: JSON.stringify({ docFontSize: size }),
    });
    setDocFontSize(saved);
  }

  async function login(username: string, password: string) {
    const u = await api<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setUser(u);
  }

  async function logout() {
    await api<void>("/auth/logout", { method: "POST" });
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, platformName, docFontSize, updateDocFontSize, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
