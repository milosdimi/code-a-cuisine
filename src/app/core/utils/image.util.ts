/**
 * Returns the WebP counterpart for a PNG asset path.
 * @param pngPath - Asset path ending in `.png`.
 */
export function webpSrc(pngPath: string): string {
  return pngPath.replace(/\.png$/i, '.webp');
}