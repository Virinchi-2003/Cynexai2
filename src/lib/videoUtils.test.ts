import { expect, test, describe } from 'vitest';
import { formatYoutubeUrl } from './videoUtils';

describe('formatYoutubeUrl', () => {
  test('formats raw YouTube ID into full watch URL', () => {
    expect(formatYoutubeUrl('dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  test('extracts ID from standard watch URL and formats it', () => {
    expect(formatYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  test('extracts ID from short youtu.be URL and formats it', () => {
    expect(formatYoutubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  test('handles URLs without https://', () => {
    expect(formatYoutubeUrl('youtube.com/watch?v=dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(formatYoutubeUrl('youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  test('extracts ID from iframe embed code', () => {
    expect(formatYoutubeUrl('<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>'))
      .toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  test('extracts ID from embed URL', () => {
    expect(formatYoutubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  test('handles empty or whitespace strings', () => {
    expect(formatYoutubeUrl('   ')).toBe('');
    expect(formatYoutubeUrl('')).toBe('');
  });

  test('falls back to returning the original string if it is not a recognizable youtube format (e.g. native mp4)', () => {
    expect(formatYoutubeUrl('https://example.com/video.mp4')).toBe('https://example.com/video.mp4');
  });
});
