/**
 * Optimized tag mappings for various artist styles to use with HeartMuLa.
 */
export interface ArtistStyle {
  name: string;
  tags: string;
  description: string;
}

export const ARTIST_STYLES: Record<string, ArtistStyle> = {
  zhu: {
    name: 'Zhu',
    tags: 'Deep House, Dark Atmosphere, Sexy R&B Vocals, Male Falsetto, Minimalist Techno, 122 BPM, Sophisticated, Mysterious',
    description: 'Sexy, techno-infused R&B/Deep House with falsetto vocals.',
  },
  'daft-punk': {
    name: 'Daft Punk',
    tags: 'French House, Disco, Vocoder, Funk Bassline, 128 BPM, Retro-futuristic, Robotic',
    description: 'Classic French House and Nu-Disco with funk elements.',
  },
  'rufus-du-sol': {
    name: 'Rüfüs Du Sol',
    tags: 'Melodic Techno, Ethereal Atmosphere, Soulful Vocals, Deep Bass, 124 BPM, Emotional, Cinematic',
    description: 'Emotional, atmospheric melodic techno.',
  },
  'the-weeknd': {
    name: 'The Weeknd',
    tags: 'Synthwave, Dark R&B, 80s Synths, Cinematic, Moody, High Energy, Male Lead',
    description: 'Dark, cinematic synthwave and alternative R&B.',
  },
  'generic-techno': {
    name: 'Pure Techno',
    tags: 'Techno, Acid Bass, Industrial Percussion, Dark, Heavy, 130 BPM, Driving',
    description: 'Heavy, driving industrial techno.',
  },
};

export function getTagsForArtist(artistName: string): string {
  const normalized = artistName.toLowerCase().trim();
  return ARTIST_STYLES[normalized]?.tags || artistName;
}
