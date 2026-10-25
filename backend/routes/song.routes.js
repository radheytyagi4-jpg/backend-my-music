import { Router } from "express";
import { discoverSongs, songSearch } from "../controllers/song.controller.js";

const router = Router();

router.get('/search', songSearch);
router.get('/discover', discoverSongs);

export default router;
