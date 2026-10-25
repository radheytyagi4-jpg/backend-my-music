import asyncHandler from "../utilis/asyncHandler.js";
import ApiError from "../utilis/apiError.js";
import ApiResponse from "../utilis/apiResponse.js";

export const songSearch = asyncHandler(async (req, res) => {
  const q = req.query.q?.trim();

  if (!q) {
    throw new ApiError(400, "query is required");
  }

  const r = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=20`
  );
  const data = await r.json();

  const songs = data.results
    .filter((s) => s.previewUrl)
    .map((s) => ({
      id: String(s.trackId),
      tittle: s.trackName,
      artist: s.artistName,
      img: s.artworkUrl100.replace("100x100", "600x600"),
      audioUrl: s.previewUrl,
    }));

  return res.status(200).json(new ApiResponse(200, songs, "Songs fetched"));
}); 


const ARTISTS = [
  "The Weeknd", "Ed Sheeran", "Adele", "Imagine Dragons", "Dua Lipa", "Harry Styles",
  "Taylor Swift", "Billie Eilish", "Coldplay", "Bruno Mars", "Post Malone", "Rihanna",
  "Drake", "Ariana Grande", "Maroon 5", "Linkin Park", "Queen", "Eminem", "Sia",
  "Shawn Mendes", "Charlie Puth", "Lana Del Rey", "Arctic Monkeys", "Olivia Rodrigo",
  "Sam Smith", "Justin Bieber", "Selena Gomez", "Katy Perry", "Lady Gaga",
  "Kendrick Lamar", "The Chainsmokers", "Calvin Harris", "Avicii", "Alan Walker",
  "Doja Cat", "SZA", "Travis Scott", "Khalid", "Lewis Capaldi", "Camila Cabello",
];

export const discoverSongs = asyncHandler(async (req, res) => {
  const count = Math.min(Number(req.query.count) || 12, 20);
  const picked = [...ARTISTS].sort(() => Math.random() - 0.5).slice(0, count);

  const results = await Promise.all(
    picked.map(async (artist) => {
      try {
        const r = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&attribute=artistTerm&limit=10`
        );
        const data = await r.json();
        const options = data.results.filter((s) => s.previewUrl);
        return options[Math.floor(Math.random() * options.length)];
      } catch {
        return null;
      }
    })
  );

  const songs = results.filter(Boolean).map((s) => ({
    id: String(s.trackId),
    tittle: s.trackName,
    artist: s.artistName,
    img: s.artworkUrl100.replace("100x100", "600x600"),
    audioUrl: s.previewUrl,
  }));

  return res.status(200).json(new ApiResponse(200, songs, "Songs discovered"));
});