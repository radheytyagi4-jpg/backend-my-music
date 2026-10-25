import { Router } from "express";
import { songSearch } from "../controllers/song.controller.js";

const router = Router();

router.get('/serach', songSearch);

export default router;
