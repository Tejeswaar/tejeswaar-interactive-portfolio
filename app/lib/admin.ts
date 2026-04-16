import { createServerClient } from "@supabase/ssr";
import crypto from "crypto";

// Admin-only Supabase client using service role key
// NEVER expose this on the client side
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );
}

// Validate admin password
export function validateAdminPassword(password: string): boolean {
  return password === process.env.ADMIN_PASSWORD;
}

// Simple token — HMAC-based (no JWT dependency needed)
// Token format: timestamp:hash
export function generateAdminToken(): string {
  const timestamp = Date.now().toString();
  const hash = crypto
    .createHmac("sha256", process.env.ADMIN_PASSWORD!)
    .update(timestamp)
    .digest("hex");
  return `${timestamp}:${hash}`;
}

export function validateAdminToken(token: string): boolean {
  if (!token) return false;
  const [timestamp, hash] = token.split(":");
  if (!timestamp || !hash) return false;

  // Token expires after 2 hours
  const age = Date.now() - parseInt(timestamp, 10);
  if (age > 2 * 60 * 60 * 1000) return false;

  const expectedHash = crypto
    .createHmac("sha256", process.env.ADMIN_PASSWORD!)
    .update(timestamp)
    .digest("hex");

  return hash === expectedHash;
}

// Rate limiting store (in-memory, resets on restart — fine for portfolio)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return { allowed: true };
  }

  // Reset after 15 minutes
  if (now - entry.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return { allowed: true };
  }

  if (entry.count >= 5) {
    const retryAfter = Math.ceil((15 * 60 * 1000 - (now - entry.lastAttempt)) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  entry.lastAttempt = now;
  return { allowed: true };
}

// Fun display name generator
const adjectives = [
  "Shadow", "Cyber", "Neon", "Pixel", "Rogue", "Silent", "Swift", "Dark",
  "Arcane", "Cosmic", "Crystal", "Ember", "Frost", "Iron", "Storm", "Void",
  "Mystic", "Stealth", "Thunder", "Phantom", "Nova", "Venom", "Blaze", "Drift",
];
const nouns = [
  "Walker", "Runner", "Seeker", "Drifter", "Wanderer", "Hunter", "Caster",
  "Weaver", "Knight", "Sage", "Hawk", "Wolf", "Fox", "Raven", "Serpent",
  "Blade", "Forge", "Spark", "Ghost", "Shade", "Pilot", "Scout", "Viper",
];

export function generateDisplayName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}${noun}_${num}`;
}
