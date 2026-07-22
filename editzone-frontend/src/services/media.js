import { API_BASE_URL } from "./api";

export function resolveMediaUrl(value) {
  if (!value || /^(https?:|blob:|data:)/i.test(value)) return value || "";
  const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin;
  return value.startsWith("/") ? `${apiOrigin}${value}` : `${API_BASE_URL}/${value}`;
}

export function isVideoMedia(value) {
  return /\.(mp4|webm|mov|mkv|avi)(?:\?|$)/i.test(value || "");
}
