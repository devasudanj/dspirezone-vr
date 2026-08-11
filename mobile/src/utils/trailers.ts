export function getYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)?([\w-]{11})(?:[?&]|$)/,
  );
  return match ? match[1] : null;
}
