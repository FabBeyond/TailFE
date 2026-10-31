import { afterEach } from "vitest"

if (typeof window !== "undefined") {
  const { cleanup } = await import("@testing-library/react")
  const { mockApi } = await import("./helpers.js")
  mockApi()
  afterEach(cleanup)
}
