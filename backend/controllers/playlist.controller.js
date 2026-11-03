import mongoose from "mongoose";
import asyncHandler from "../utilis/asyncHandler.js";
import ApiError from "../utilis/apiError.js";
import ApiResponse from "../utilis/apiResponse.js";
import { pool } from "../db/index.js";
import { Playlist } from "../models/playlist.model.js";

const MAX_PLAYLISTS_PER_USER = 50;
const MAX_SONGS_PER_PLAYLIST = 500;
const VISIBILITIES = ["private", "unlisted", "public"];

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getUserId = (req) => {
  const raw = req.body?.userId ?? req.query?.userId;
  const userId = raw === undefined || raw === null ? "" : String(raw).trim();

  if (!userId) {
    throw new ApiError(400, "userId is required");
  }

  return userId;
};

const getPlaylistId = (req) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(404, "Playlist not found");
  }

  return id;
};

const findUserName = async (userId) => {
  try {
    const result = await pool.query(
      "SELECT name FROM public.users WHERE id = $1 LIMIT 1",
      [userId]
    );

    return result.rows[0]?.name ?? null;
  } catch (error) {
    return null;
  }
};

const summaryFields = (songId) => ({
  name: 1,
  description: 1,
  visibility: 1,
  ownerId: 1,
  ownerName: 1,
  followerCount: 1,
  updatedAt: 1,
  songCount: { $size: "$songs" },
  cover: { $arrayElemAt: ["$songs.img", 0] },
  ...(songId ? { hasSong: { $in: [songId, "$songs.songId"] } } : {}),
});

const canView = (playlist, userId) =>
  playlist.visibility !== "private" || playlist.ownerId === userId;

const loadOwned = async (req) => {
  const userId = getUserId(req);
  const playlist = await Playlist.findById(getPlaylistId(req));

  if (!playlist || playlist.ownerId !== userId) {
    throw new ApiError(
      playlist ? 403 : 404,
      playlist ? "Only the owner can do that" : "Playlist not found"
    );
  }

  return { playlist, userId };
};

const cleanSong = (song) => {
  if (!song?.id || !song?.audioUrl) {
    throw new ApiError(400, "song with id and audioUrl is required");
  }

  return {
    songId: String(song.id),
    tittle: String(song.tittle || song.title || "Unknown Song").slice(0, 200),
    artist: String(song.artist || "Unknown Artist").slice(0, 200),
    img: song.img ? String(song.img) : null,
    audioUrl: String(song.audioUrl),
  };
};

export const createPlaylist = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const name = String(req.body?.name ?? "").trim();
  const description = String(req.body?.description ?? "").trim();
  const visibility = req.body?.visibility ?? "private";

  if (!name) throw new ApiError(400, "Playlist name is required");
  if (name.length > 60) throw new ApiError(400, "Name is too long");
  if (description.length > 200) throw new ApiError(400, "Description is too long");
  if (!VISIBILITIES.includes(visibility)) {
    throw new ApiError(400, "Invalid visibility");
  }

  const ownerName = await findUserName(userId);

  if (ownerName === null) {
    throw new ApiError(404, "User not found");
  }

  const owned = await Playlist.countDocuments({ ownerId: userId });

  if (owned >= MAX_PLAYLISTS_PER_USER) {
    throw new ApiError(400, "Playlist limit reached");
  }

  const playlist = await Playlist.create({
    ownerId: userId,
    ownerName,
    name,
    description,
    visibility,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created"));
});

export const getMyPlaylists = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const songId = req.query.songId ? String(req.query.songId) : null;

  const [owned, followed] = await Promise.all([
    Playlist.aggregate([
      { $match: { ownerId: userId } },
      { $sort: { updatedAt: -1 } },
      { $project: summaryFields(songId) },
    ]),
    Playlist.aggregate([
      { $match: { followers: userId, visibility: { $ne: "private" } } },
      { $sort: { updatedAt: -1 } },
      { $project: summaryFields(null) },
    ]),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { owned, followed }, "My playlists"));
});

export const browsePlaylists = asyncHandler(async (req, res) => {
  const q = String(req.query.q ?? "").trim().slice(0, 60);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const skip = Math.max(Number(req.query.skip) || 0, 0);

  const match = {
    visibility: "public",
    "songs.0": { $exists: true },
  };

  if (q) {
    match.name = { $regex: escapeRegex(q), $options: "i" };
  }

  const playlists = await Playlist.aggregate([
    { $match: match },
    { $sort: { followerCount: -1, updatedAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $project: summaryFields(null) },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Public playlists"));
});

export const getPlaylist = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const playlist = await Playlist.findById(getPlaylistId(req)).lean();

  if (!playlist || !canView(playlist, userId)) {
    throw new ApiError(404, "Playlist not found");
  }

  const { followers, ...rest } = playlist;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...rest,
        isOwner: playlist.ownerId === userId,
        isFollowing: followers.includes(userId),
      },
      "Playlist fetched"
    )
  );
});

export const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlist } = await loadOwned(req);
  const { name, description, visibility } = req.body ?? {};

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (!trimmed || trimmed.length > 60) {
      throw new ApiError(400, "Name must be 1-60 characters");
    }
    playlist.name = trimmed;
  }

  if (description !== undefined) {
    const trimmed = String(description).trim();
    if (trimmed.length > 200) {
      throw new ApiError(400, "Description is too long");
    }
    playlist.description = trimmed;
  }

  if (visibility !== undefined) {
    if (!VISIBILITIES.includes(visibility)) {
      throw new ApiError(400, "Invalid visibility");
    }

    if (visibility === "private" && playlist.visibility !== "private") {
      playlist.followers = [];
      playlist.followerCount = 0;
    }

    playlist.visibility = visibility;
  }

  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated"));
});

export const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlist } = await loadOwned(req);

  await playlist.deleteOne();

  return res.status(200).json(new ApiResponse(200, null, "Playlist deleted"));
});

export const addSongToPlaylist = asyncHandler(async (req, res) => {
  const { playlist, userId } = await loadOwned(req);
  const song = cleanSong(req.body?.song);

  if (playlist.songs.some((item) => item.songId === song.songId)) {
    return res
      .status(200)
      .json(new ApiResponse(200, { added: false }, "Already in playlist"));
  }

  if (playlist.songs.length >= MAX_SONGS_PER_PLAYLIST) {
    throw new ApiError(400, "Playlist is full");
  }

  const result = await Playlist.updateOne(
    { _id: playlist._id, ownerId: userId, "songs.songId": { $ne: song.songId } },
    { $push: { songs: song } }
  );

  return res
    .status(result.modifiedCount ? 201 : 200)
    .json(
      new ApiResponse(
        result.modifiedCount ? 201 : 200,
        { added: result.modifiedCount > 0 },
        result.modifiedCount ? "Song added" : "Already in playlist"
      )
    );
});

export const removeSongFromPlaylist = asyncHandler(async (req, res) => {
  const { playlist, userId } = await loadOwned(req);

  await Playlist.updateOne(
    { _id: playlist._id, ownerId: userId },
    { $pull: { songs: { songId: String(req.params.songId) } } }
  );

  return res.status(200).json(new ApiResponse(200, null, "Song removed"));
});

export const followPlaylist = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const id = getPlaylistId(req);

  const playlist = await Playlist.findById(id).select("ownerId visibility");

  if (!playlist || !canView(playlist, userId)) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.ownerId === userId) {
    throw new ApiError(400, "You own this playlist");
  }

  if (playlist.visibility === "private") {
    throw new ApiError(403, "This playlist is private");
  }

  await Playlist.updateOne(
    { _id: id, followers: { $ne: userId } },
    { $addToSet: { followers: userId }, $inc: { followerCount: 1 } }
  );

  return res.status(200).json(new ApiResponse(200, null, "Playlist followed"));
});

export const unfollowPlaylist = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const id = getPlaylistId(req);

  await Playlist.updateOne(
    { _id: id, followers: userId },
    { $pull: { followers: userId }, $inc: { followerCount: -1 } }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Playlist unfollowed"));
});
