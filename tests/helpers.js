import { vi } from "vitest"

// Stand-in for the preload bridge. paths.js reads platform on import,
// so tests that need another platform reset modules and re-import.
export function mockApi(overrides = {}) {
  window.api = {
    platform: "linux",
    readDir: vi.fn(async () => []),
    deleteFile: vi.fn(async () => ({ success: true })),
    createFolder: vi.fn(async (dir) => ({ path: `${dir}/New Folder` })),
    rename: vi.fn(async () => ({ success: true })),
    openFile: vi.fn(async () => ({ success: true })),
    getPath: vi.fn(async (name) => ({ path: `/home/user/${name}` })),
    move: vi.fn(async () => ({ success: true })),
    ...overrides
  }
  return window.api
}

export async function importForPlatform(platform, modulePath) {
  vi.resetModules()
  window.api = { ...window.api, platform }
  return import(modulePath)
}

export function deferred() {
  let resolve
  const promise = new Promise((r) => (resolve = r))
  return { promise, resolve }
}

export const dir = (name) => ({ name, isDirectory: true, size: 4096, lastModified: new Date(0) })
export const file = (name, size = 10) => ({
  name,
  isDirectory: false,
  size,
  lastModified: new Date(0)
})
