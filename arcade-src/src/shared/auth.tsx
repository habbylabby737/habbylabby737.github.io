import type { ReactNode } from "react";

export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  isDevFallback: boolean;
};

export type CurrentUserState = {
  user: AppUser | null;
  isPending: boolean;
};

export function SignedIn(_props: { children?: ReactNode }) {
  return null;
}

export function SignedOut({ children }: { children?: ReactNode }) {
  return children ?? null;
}

export function UserButton() {
  return null;
}

export function useCurrentUserState(): CurrentUserState {
  return { user: null, isPending: false };
}

export const authEnabled = false;

export async function signOut() {}

export function AuthProvider({ children }: { children: ReactNode }) {
  return children;
}
