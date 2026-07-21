export function formatYoutubeUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  let processUrl = trimmed;
  // If it contains an iframe, extract the src URL
  if (trimmed.includes('<iframe')) {
    const srcMatch = trimmed.match(/src="([^"]+)"/);
    if (srcMatch) {
      processUrl = srcMatch[1];
    }
  }

  // If it's just an 11-char ID (e.g. dQw4w9WgXcQ)
  if (/^[\w-]{11}$/.test(processUrl)) {
    return `https://www.youtube.com/watch?v=${processUrl}`;
  }

  // Extract ID using standard youtube URL regex
  const youtubeRegex = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|v=))([\w-]{11})/;
  const match = processUrl.match(youtubeRegex);
  
  if (match && match[1] && match[1].length === 11) {
    return `https://www.youtube.com/watch?v=${match[1]}`;
  }

  // Fallback: return the original string if we can't extract a YouTube ID
  return trimmed;
}
