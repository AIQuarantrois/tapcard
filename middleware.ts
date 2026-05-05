/**
 * middleware.ts  (à la racine du projet, même niveau que package.json)
 *
 * Rate limiting simple par IP sur toutes les routes /api/*.
 *
 * ── Version actuelle : in-memory (fonctionne en dev et en serverless Vercel) ──
 * Limitation : le store se reset à chaque cold start Vercel (fonction serverless stateless).
 * C'est suffisant pour le lancement. Pour une protection plus robuste,
 * migre vers Upstash Redis + @upstash/ratelimit (plan gratuit : 10 000 req/jour).
 *
 * ── Migration Upstash (optionnelle, ~30 min) ─────────────────────────────────
 *   npm install @upstash/ratelimit @upstash/redis
 *   Puis remplace le bloc "in-memory" par :
 *
 *   import { Ratelimit } from '@upstash/ratelimit'
 *   import { Redis }     from '@upstash/redis'
 *   const ratelimit = new Ratelimit({
 *     redis: Redis.fromEnv(),                         // UPSTASH_REDIS_REST_URL + TOKEN
 *     limiter: Ratelimit.slidingWindow(20, '1 m'),
 *   })
 *   const { success } = await ratelimit.limit(ip)
 *   if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

import { NextRequest, NextResponse } from 'next/server'

const WINDOW_MS = 60_000   // fenêtre de 1 minute
const MAX_REQ   = 30       // max 30 requêtes par minute par IP

// Store in-memory — léger, fonctionne pour les premiers milliers d'utilisateurs
const store = new Map<string, { count: number; windowStart: number }>()

// Nettoyage périodique pour éviter les fuites mémoire
let lastClean = Date.now()
function maybeClean() {
  const now = Date.now()
  if (now - lastClean < 300_000) return  // nettoie toutes les 5 min
  lastClean = now
  store.forEach((rec, key) => {
  if (now - rec.windowStart > WINDOW_MS * 2) store.delete(key)
})
}

export function middleware(req: NextRequest) {
  // Applique uniquement aux routes API (pas aux pages, assets, etc.)
  if (!req.nextUrl.pathname.startsWith('/api/')) return NextResponse.next()

  // Lecture seule (GET) : limite plus souple
  const isWrite  = req.method !== 'GET'
  const limit    = isWrite ? MAX_REQ : MAX_REQ * 3

  const forwarded = req.headers.get('x-forwarded-for')
  const ip        = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  const key       = `${ip}:${isWrite ? 'w' : 'r'}`
  const now       = Date.now()

  maybeClean()

  const rec = store.get(key)
  if (!rec || now - rec.windowStart > WINDOW_MS) {
    store.set(key, { count: 1, windowStart: now })
    return NextResponse.next()
  }

  rec.count++
  if (rec.count > limit) {
    const retryAfter = Math.ceil((rec.windowStart + WINDOW_MS - now) / 1000)
    return NextResponse.json(
      { error: 'Trop de requêtes — réessaie dans quelques secondes.' },
      {
        status: 429,
        headers: {
          'Retry-After':       String(retryAfter),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Reset': String(Math.ceil((rec.windowStart + WINDOW_MS) / 1000)),
        },
      }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}