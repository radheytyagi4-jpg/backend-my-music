import { Router } from "express";
import {
  createPlaylist,
  getMyPlaylists,
  browsePlaylists,
  getPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  followPlaylist,
  unfollowPlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.post("/", createPlaylist);
router.get("/mine", getMyPlaylists);
router.get("/browse", browsePlaylists);

router.get("/:id", getPlaylist);
router.patch("/:id", updatePlaylist);
router.delete("/:id", deletePlaylist);

router.post("/:id/songs", addSongToPlaylist);
router.delete("/:id/songs/:songId", removeSongFromPlaylist);

router.post("/:id/follow", followPlaylist);
router.delete("/:id/follow", unfollowPlaylist);

export default router;
