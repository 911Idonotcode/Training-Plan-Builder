import { BrowserOAuthClient, type OAuthSession } from '@atproto/oauth-client-browser'
import { Agent } from '@atproto/api'

export const SCOPE = 'atproto transition:generic'

const isLoopback = ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname)

function clientId(): string {
  if (isLoopback) {
    // Local development: atproto "loopback" client, no hosted metadata needed.
    const redirect = `http://127.0.0.1:${location.port}${location.pathname}`
    return `http://localhost?redirect_uri=${encodeURIComponent(redirect)}&scope=${encodeURIComponent(SCOPE)}`
  }
  // Production: metadata document published next to index.html at build time.
  return new URL('client-metadata.json', location.origin + import.meta.env.BASE_URL).href
}

let clientPromise: Promise<BrowserOAuthClient> | null = null
function getClient() {
  if (isLoopback && location.hostname !== '127.0.0.1') {
    // Loopback OAuth requires 127.0.0.1, not "localhost".
    location.replace(location.href.replace(location.hostname, '127.0.0.1'))
  }
  clientPromise ??= BrowserOAuthClient.load({
    clientId: clientId(),
    handleResolver: 'https://bsky.social',
  })
  return clientPromise
}

export interface Session {
  did: string
  agent: Agent
  oauth: OAuthSession
}

export async function initSession(): Promise<Session | null> {
  const client = await getClient()
  const result = await client.init()
  if (!result) return null
  return { did: result.session.sub, agent: new Agent(result.session), oauth: result.session }
}

export async function signIn(handle: string): Promise<void> {
  const client = await getClient()
  await client.signIn(handle.trim().replace(/^@/, ''), { scope: SCOPE })
}

export async function signOut(session: Session): Promise<void> {
  try {
    await session.oauth.signOut()
  } catch {
    /* already gone */
  }
}
