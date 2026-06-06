export const RESOLUTIONS = ["244p", "480p", "720p", "1080p", "2k", "4k"] as const;
export type Resolution = (typeof RESOLUTIONS)[number];

export const RES_RANK: Record<Resolution, number> = {
  "244p": 1, "480p": 2, "720p": 3, "1080p": 4, "2k": 5, "4k": 6,
};

// Pixel ratio for html-to-image. 244p ~ tier 1.
export const RES_PIXEL_RATIO: Record<Resolution, number> = {
  "244p": 0.6, "480p": 1, "720p": 1.5, "1080p": 2, "2k": 3, "4k": 4,
};

export const RES_LABEL: Record<Resolution, string> = {
  "244p": "244p · Basic", "480p": "480p · SD", "720p": "720p · HD",
  "1080p": "1080p · Full HD", "2k": "2K · Quad HD", "4k": "4K · Ultra HD",
};

export function isUnlocked(target: Resolution, userMax: Resolution): boolean {
  return RES_RANK[target] <= RES_RANK[userMax];
}