import {
  AppWindowIcon,
  BookOpenIcon,
  CaptionsIcon,
  DatabaseIcon,
  Disc3Icon,
  ExternalLinkIcon,
  FileArchiveIcon,
  FileAxis3dIcon,
  FileBracesIcon,
  FileCodeIcon,
  FileCogIcon,
  FileIcon,
  FileImageIcon,
  FileKeyIcon,
  FileMusicIcon,
  FileSlidersIcon,
  FileSpreadsheetIcon,
  FileTerminalIcon,
  FileTextIcon,
  FileTypeIcon,
  FileVideoCameraIcon,
  MailIcon,
  PackageIcon,
  PresentationIcon
} from "lucide-react"
import { getFileExtension } from "./fileUtils"

const iconGroups = [
  [FileTextIcon, ["txt", "md", "rtf", "log", "doc", "docx", "odt"]],
  [BookOpenIcon, ["pdf", "epub", "mobi"]],
  [FileSpreadsheetIcon, ["xls", "xlsx", "ods", "csv", "tsv"]],
  [PresentationIcon, ["ppt", "pptx", "odp"]],
  [
    FileImageIcon,
    ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "tiff", "heic", "avif"]
  ],
  [FileVideoCameraIcon, ["mp4", "mkv", "webm", "avi", "mov", "wmv", "flv"]],
  [FileMusicIcon, ["mp3", "flac", "wav", "ogg", "opus", "m4a", "aac"]],
  [FileArchiveIcon, ["zip", "tar", "gz", "bz2", "xz", "7z", "rar", "zst"]],
  [Disc3Icon, ["iso", "img", "dmg"]],
  [FileCodeIcon, ["js", "jsx", "ts", "tsx", "html", "css", "php"]],
  [FileCodeIcon, ["py", "rs", "go", "c", "h", "cpp", "java", "rb", "lua"]],
  [FileBracesIcon, ["json", "jsonc", "xml"]],
  [FileSlidersIcon, ["yml", "yaml", "toml", "ini", "conf", "cfg", "env"]],
  [DatabaseIcon, ["db", "sqlite", "sqlite3", "sql"]],
  [FileTypeIcon, ["ttf", "otf", "woff", "woff2"]],
  [FileKeyIcon, ["pem", "key", "crt", "cer", "p12", "gpg"]],
  [FileAxis3dIcon, ["obj", "fbx", "stl", "glb", "gltf", "blend"]],
  [CaptionsIcon, ["srt", "vtt", "ass"]],
  [MailIcon, ["eml", "msg", "mbox"]],
  [AppWindowIcon, ["exe", "com", "scr", "pif", "appimage", "run", "jar"]],
  [
    FileTerminalIcon,
    ["sh", "bat", "cmd", "ps1", "vbs", "jse", "wsf", "wsh", "hta", "command", "tool", "terminal"]
  ],
  [PackageIcon, ["msi", "pkg", "mpkg"]],
  [ExternalLinkIcon, ["lnk", "url", "desktop", "webloc", "inetloc", "fileloc"]],
  [FileCogIcon, ["reg", "cpl"]]
]

const extensionToIcon = new Map()
for (const [icon, extensions] of iconGroups) {
  for (const extension of extensions) {
    extensionToIcon.set(extension, icon)
  }
}

export function getFileIcon(name) {
  return extensionToIcon.get(getFileExtension(name)) ?? FileIcon
}
