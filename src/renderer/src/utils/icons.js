const iconModules = import.meta.glob("../assets/resources/*.{png,svg,jpg}", {
  eager: true,
  import: "default"
})
export const icons = Object.fromEntries(
  Object.entries(iconModules).map(([path, url]) => [path.split("/").pop(), url])
)
