"use server"

import { signIn } from "@/auth"

export async function googleSignInAction(callbackUrl?: string) {
  await signIn("google", { redirectTo: callbackUrl ?? "/account" })
}
