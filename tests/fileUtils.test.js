import { describe, expect, it } from "vitest"
import { bytesToReadable, sortFiles, visibleFiles } from "../src/renderer/src/utils/fileUtils.js"

describe("bytesToReadable", () => {
  it("keeps bytes as whole numbers", () => {
    expect(bytesToReadable(0)).toBe("0 Bytes")
    expect(bytesToReadable(999)).toBe("999 Bytes")
  })

  it("uses decimal units with one decimal", () => {
    expect(bytesToReadable(1000)).toBe("1.0 KB")
    expect(bytesToReadable(1_500_000)).toBe("1.5 MB")
    expect(bytesToReadable(2_000_000_000)).toBe("2.0 GB")
  })

  it("stops at TB", () => {
    expect(bytesToReadable(1e15)).toBe("1000.0 TB")
  })
})

describe("sortFiles", () => {
  const files = [
    { name: "file10.txt", isDirectory: false, size: 5, lastModified: new Date(3) },
    { name: "b", isDirectory: true, size: 1, lastModified: new Date(1) },
    { name: "file2.txt", isDirectory: false, size: 50, lastModified: new Date(2) },
    { name: "a", isDirectory: true, size: 100, lastModified: new Date(4) }
  ]
  const names = (list) => list.map((f) => f.name)

  it("sorts names naturally", () => {
    expect(names(sortFiles(files, { key: "name", desc: false }, false))).toEqual([
      "a",
      "b",
      "file2.txt",
      "file10.txt"
    ])
  })

  it("puts folders on top", () => {
    expect(names(sortFiles(files, { key: "name", desc: true }, true))).toEqual([
      "b",
      "a",
      "file10.txt",
      "file2.txt"
    ])
  })

  it("sorts by size and modified date", () => {
    expect(names(sortFiles(files, { key: "size", desc: false }, false))).toEqual([
      "b",
      "file10.txt",
      "file2.txt",
      "a"
    ])
    expect(names(sortFiles(files, { key: "modified", desc: true }, false))).toEqual([
      "a",
      "file10.txt",
      "file2.txt",
      "b"
    ])
  })

  it("does not mutate the input", () => {
    const before = names(files)
    sortFiles(files, { key: "size", desc: true }, true)
    expect(names(files)).toEqual(before)
  })
})

describe("visibleFiles", () => {
  const files = [{ name: ".config" }, { name: "docs" }]

  it("hides dot files unless enabled", () => {
    expect(visibleFiles(files, false)).toEqual([{ name: "docs" }])
    expect(visibleFiles(files, true)).toBe(files)
  })
})
