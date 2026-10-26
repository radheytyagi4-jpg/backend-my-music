import { Router } from "express";
import { addRecent, getRecent } from "../controllers/recent.controller.js";

const router = Router();
router.post("/", addRecent);
router.get("/", getRecent);

export default router;