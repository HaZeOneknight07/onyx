import { createAuthClient } from "better-auth/react";

const baseURL =
  import.meta.env.VITE_AUTH_BASE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:8088");

export const authClient = createAuthClient({
  baseURL,
});

export const { useSession, signIn, signUp, signOut } = authClient;
