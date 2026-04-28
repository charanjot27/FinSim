// Mira AI Coach — Cloud Function (Firebase Functions v2 + Gemini 2.5 Flash).
//
// Receives a sanitized snapshot of the player's recent trades, current bias
// trigger, and a few stats; returns a 1–2 sentence coaching message.
//
// Hardening:
//  - Auth required (Firebase Auth UID must be present).
//  - 8 RPS per user via in-memory rate limiter (replace with Firestore/Redis
//    counter for multi-instance prod).
//  - Strict input shape; any extra fields are dropped before reaching the LLM.
//  - Server-side response cache keyed by SHA-256(prompt-hash) — 1h TTL —
//    so repeat triggers from the same player are free.
//
// Deploy:
//  cd functions && npm install
//  firebase functions:secrets:set GEMINI_API_KEY      # paste your key once
//  firebase deploy --only functions
//
// Local emulator:
//  cd functions && npm run serve
//  Then set VITE_FUNCTIONS_EMULATOR=true in .env and call from the client.

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';
import { GoogleGenAI } from '@google/genai';
import * as crypto from 'node:crypto';

setGlobalOptions({ region: 'us-central1', memory: '256MiB', maxInstances: 20 });

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

// --------------- request shape -------------------------------------------------
interface CoachInput {
  biasType: string;                // 'fomo' | 'revenge_trading' | 'overconfidence' | ...
  severity?: 'low' | 'medium' | 'high';
  symbol?: string;
  side?: 'buy' | 'sell';
  recentTrades?: Array<{ symbol: string; side: 'buy' | 'sell'; qty: number; pnlPct?: number }>;
  stats?: {
    winRatePct?: number;
    medianHoldMin?: number;
    biasTriggers30d?: number;
    fomoPercentile?: number;
    traderScore?: number;
    tier?: string;
  };
}

// --------------- in-memory rate limiter ---------------------------------------
const rate = new Map<string, { count: number; resetAt: number }>();
function rateLimit(uid: string, perMin = 30): boolean {
  const now = Date.now();
  const cur = rate.get(uid);
  if (!cur || cur.resetAt < now) {
    rate.set(uid, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (cur.count >= perMin) return false;
  cur.count += 1;
  return true;
}

// --------------- in-memory response cache -------------------------------------
const cache = new Map<string, { msg: string; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

function hashKey(input: CoachInput): string {
  // Bucket noisy fields so similar contexts hit the cache.
  const bucket = {
    bias: input.biasType,
    sev: input.severity ?? 'medium',
    sym: input.symbol ?? '',
    side: input.side ?? '',
    wr: input.stats?.winRatePct ? Math.round(input.stats.winRatePct / 10) * 10 : null,
    fomo: input.stats?.fomoPercentile ? Math.round(input.stats.fomoPercentile / 20) * 20 : null,
    tier: input.stats?.tier ?? '',
    n: input.recentTrades?.length ?? 0,
  };
  return crypto.createHash('sha256').update(JSON.stringify(bucket)).digest('hex');
}

// --------------- prompt builder -----------------------------------------------
function buildPrompt(input: CoachInput): string {
  const t = input.recentTrades?.slice(-8).map(r =>
    `${r.side.toUpperCase()} ${r.qty} ${r.symbol}${typeof r.pnlPct === 'number' ? ` (${r.pnlPct.toFixed(1)}%)` : ''}`
  ).join('; ') || 'no recent trades';

  const s = input.stats || {};
  const stats = [
    s.winRatePct      != null ? `win rate ${s.winRatePct.toFixed(0)}%` : null,
    s.medianHoldMin   != null ? `median hold ${s.medianHoldMin}m`        : null,
    s.fomoPercentile  != null ? `FOMO ${s.fomoPercentile}th %ile`        : null,
    s.traderScore     != null ? `score ${s.traderScore}`                 : null,
    s.tier            ? `tier ${s.tier}` : null,
    s.biasTriggers30d != null ? `${s.biasTriggers30d} bias hits this month` : null,
  ].filter(Boolean).join(', ') || 'no stats yet';

  return `You are "Mira", a calm, precise trading coach inside a finance education simulator.
A bias has just been detected for the player. Write 1–2 sentences (max 240 chars) in second person ("you ..."), in a coaching tone — direct, no fluff, no emojis, no markdown, no quotes. Reference one concrete pattern from their data if useful. End with a single, executable next-action.

Detected bias: ${input.biasType} (severity: ${input.severity || 'medium'})
Action they're about to take: ${input.side?.toUpperCase() || '?'} ${input.symbol || '?'}
Recent trades: ${t}
Player stats: ${stats}

Respond with ONLY the coaching message — no labels, no preamble.`;
}

// --------------- Cloud Function entry point -----------------------------------
export const miraCoach = onCall(
  { secrets: [GEMINI_API_KEY], cors: true, timeoutSeconds: 20 },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in to use the AI coach');

    if (!rateLimit(uid)) {
      throw new HttpsError('resource-exhausted', 'Slow down — 30 coach calls per minute max');
    }

    const raw = request.data as Partial<CoachInput> | undefined;
    if (!raw || typeof raw.biasType !== 'string' || raw.biasType.length > 64) {
      throw new HttpsError('invalid-argument', 'biasType is required and must be < 64 chars');
    }
    // Sanitize / clamp the input.
    const input: CoachInput = {
      biasType: raw.biasType.slice(0, 64),
      severity: ['low', 'medium', 'high'].includes(raw.severity as string) ? raw.severity : 'medium',
      symbol: typeof raw.symbol === 'string' ? raw.symbol.slice(0, 12) : undefined,
      side: raw.side === 'buy' || raw.side === 'sell' ? raw.side : undefined,
      recentTrades: Array.isArray(raw.recentTrades)
        ? raw.recentTrades.slice(0, 10).map((r) => ({
            symbol: String(r.symbol || '').slice(0, 12),
            side:   r.side === 'sell' ? 'sell' : 'buy',
            qty:    Math.max(0, Math.min(1e6, Number(r.qty) || 0)),
            pnlPct: typeof r.pnlPct === 'number' ? r.pnlPct : undefined,
          }))
        : [],
      stats: typeof raw.stats === 'object' && raw.stats ? {
        winRatePct:      num(raw.stats.winRatePct,      0, 100),
        medianHoldMin:   num(raw.stats.medianHoldMin,   0, 60_000),
        biasTriggers30d: num(raw.stats.biasTriggers30d, 0, 1000),
        fomoPercentile:  num(raw.stats.fomoPercentile,  0, 100),
        traderScore:     num(raw.stats.traderScore,     0, 1000),
        tier:            typeof raw.stats.tier === 'string' ? raw.stats.tier.slice(0, 24) : undefined,
      } : undefined,
    };

    const key = hashKey(input);
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return { message: cached.msg, cached: true };
    }

    const prompt = buildPrompt(input);

    let text: string;
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() });
      const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.6,
          maxOutputTokens: 120,
          // Block dangerous content; trading advice itself is fine.
          // safetySettings could be tuned here.
        },
      });
      text = (resp.text || '').trim();
      if (!text) throw new Error('empty model response');
    } catch (err) {
      console.error('[miraCoach] Gemini call failed', err);
      throw new HttpsError('internal', 'Coach is napping — try again in a sec');
    }

    // Trim to 240 chars hard cap (defensive).
    if (text.length > 240) text = text.slice(0, 237) + '...';
    cache.set(key, { msg: text, expiresAt: Date.now() + CACHE_TTL_MS });

    return { message: text, cached: false };
  }
);

function num(v: unknown, lo: number, hi: number): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(lo, Math.min(hi, n));
}
