// Dev-only fake Bluesky session so the signed-in UI can be previewed locally
// with http://127.0.0.1:5173/?demo&date=2026-12-09 — never included in production builds.
import type { Session } from './auth'

export function demoSession(): Session {
  const records = new Map<string, unknown>()
  const key = (c: string, r: string) => `${c}/${r}`
  const date = new URLSearchParams(location.search).get('date') ?? ''
  const upTo = date.slice(5, 7) === '12' ? Number(date.slice(8)) - 1 : 0
  for (let d = 1; d <= upTo; d++) {
    if (d === 4) continue
    records.set(key('io.github.911idonotcode.runadvent.day', `2026-${String(d).padStart(2, '0')}`), {
      year: 2026, day: d, distanceMeters: 1609 * (1 + (d % 4)), durationSeconds: 600 * (1 + (d % 4)), completedAt: new Date().toISOString(),
    })
  }
  const repo = {
    getRecord: async ({ collection, rkey }: any) => {
      const v = records.get(key(collection, rkey))
      if (!v) throw new Error('not found')
      return { data: { value: v } }
    },
    putRecord: async ({ collection, rkey, record }: any) => void records.set(key(collection, rkey), record),
    deleteRecord: async ({ collection, rkey }: any) => void records.delete(key(collection, rkey)),
    listRecords: async ({ collection }: any) => ({
      data: {
        records: [...records].filter(([k]) => k.startsWith(collection + '/')).map(([k, value]) => ({ uri: `at://did:plc:demo/${k}`, value })),
      },
    }),
    applyWrites: async ({ writes }: any) => writes.forEach((w: any) => records.delete(key(w.collection, w.rkey))),
  }
  const agent = {
    com: { atproto: { repo, identity: { resolveHandle: async () => ({ data: { did: 'did:plc:host' } }) } } },
    getProfile: async () => ({ data: { displayName: 'Andres Castañeda', handle: 'demo.bsky.social' } }),
    uploadBlob: async () => ({ data: { blob: {} } }),
    post: async () => ({ uri: 'at://did:plc:demo/app.bsky.feed.post/3demo' }),
  }
  return { did: 'did:plc:demo', agent: agent as any, oauth: { signOut: async () => {} } as any }
}
