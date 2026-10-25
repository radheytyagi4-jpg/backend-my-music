import asyncHandler from "../routes/utilis/asyncHandler.js";
import ApiError from "../routes/utilis/apiError.js";
import ApiResponse from "../routes/utilis/apiResponse.js";

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