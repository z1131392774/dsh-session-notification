// @vitest-environment jsdom
/**
 * dsh 0.2.3-alpha.1 packaging contract.
 *
 * dsh 0.2.2-rc.2 split the session-status table out of ui-session into its own
 * client package `@deepseek-ai/dsh-client-ui-session-status`. A reader now
 * injects the dotted service property `uiSession.sessionStatus` *in addition
 * to* the parent `uiSession` service: `ctx.uiSession.sessionStatus` first
 * reads `ctx.uiSession` and only then resolves the dotted child through the
 * service's traceable proxy. Injecting the dotted name alone (or the bare
 * name alone) makes Cordis 4.x reject the whole plugin at activation with:
 *
 *   cannot get property "uiSession" without inject
 *
 * These assertions pin the three places that must agree: the client entry's
 * `inject` export, the bundle's `dsh.client.inject` list, and `engines.dsh`
 * (which alone decides the supported host range).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

// The shell provides the client store at runtime and the repo installs only
// its types; its lib entry imports zustand, which is not installed here, so
// shim the factory to keep this spec on the entry's pure `inject` export.
vi.mock('@deepseek-ai/dsh-client-store', () => ({ defineStore: () => ({}) }))

import { inject } from '../src/client/index.ts'

interface PackageManifest {
  engines?: { dsh?: string }
  dsh?: { client?: { inject?: string[]; platform?: string } }
}

const manifest = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
) as PackageManifest

describe('client inject contract', () => {
  it('declares both the parent ui-session service and the split session-status service', () => {
    expect(inject).toContain('uiSession')
    expect(inject).toContain('uiSession.sessionStatus')
  })

  it('loads the session-status client bundle before this plugin', () => {
    expect(manifest.dsh?.client?.inject).toContain('@deepseek-ai/dsh-client-ui-session-status')
    expect(manifest.dsh?.client?.platform).toBe('web')
  })

  it('declares the adapted dsh release as the supported engines range', () => {
    expect(manifest.engines?.dsh).toBe('^0.2.3-alpha.1')
  })
})
