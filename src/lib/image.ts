/** Resize remote covers for list/detail; local uploads left as-is. */
export function imageUrl(src: string, width: number, quality = 65) {
  if (!src) return src;
  if (src.startsWith("/uploads/") || src.startsWith("blob:") || src.startsWith("data:")) {
    return src;
  }
  if (src.includes("images.unsplash.com")) {
    const u = new URL(src);
    u.searchParams.set("auto", "format");
    u.searchParams.set("fit", "crop");
    u.searchParams.set("w", String(width));
    u.searchParams.set("q", String(quality));
    return u.toString();
  }
  return src;
}
