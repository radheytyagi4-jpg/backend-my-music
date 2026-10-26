import asyncHandler from "../utilis/asyncHandler.js";
import ApiError from "../utilis/apiError.js";
import ApiResponse from "../utilis/apiResponse.js";
import { pool } from "../db/index.js";

export const addRecent = asyncHandler(async (req, res) => {
  const { userId, song } = req.body;
  if (!userId || !song?.id || !song?.audioUrl) {
    throw new ApiError(400, "userId and song are required");
  }

  await pool.query(
    `INSERT INTO public.recent_songs (user_id, song_id, title, artist, img, audio_url, played_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     ON CONFLICT (user_id, song_id) DO UPDATE SET played_at = now()`,
    [userId, song.id, song.tittle, song.artist, song.img, song.audioUrl]
  );

  await pool.query(
    `DELETE FROM public.recent_songs
     WHERE user_id = $1 AND id NOT IN (
       SELECT id FROM public.recent_songs
       WHERE user_id = $1 ORDER BY played_at DESC LIMIT 20
     )`,
    [userId]
  );

  return res.status(201).json(new ApiResponse(201, null, "Saved to recent"));
});

export const getRecent = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  if (!userId) throw new ApiError(400, "userId is required");

  const result = await pool.query(
    `SELECT song_id AS id, title AS tittle, artist, img, audio_url AS "audioUrl"
     FROM public.recent_songs
     WHERE user_id = $1
     ORDER BY played_at DESC
     LIMIT 20`,
    [userId]
  );

  return res.status(200).json(new ApiResponse(200, result.rows, "Recent songs"));
});