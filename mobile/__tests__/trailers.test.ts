import { getYouTubeVideoId } from '../src/utils/trailers';

describe('getYouTubeVideoId', () => {
  it('extracts ids from standard YouTube watch URLs', () => {
    expect(getYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ids from short URLs and embed URLs', () => {
    expect(getYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(getYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for non-YouTube or malformed trailers', () => {
    expect(getYouTubeVideoId('https://example.com/trailer.mp4')).toBeNull();
    expect(getYouTubeVideoId('')).toBeNull();
  });
});
