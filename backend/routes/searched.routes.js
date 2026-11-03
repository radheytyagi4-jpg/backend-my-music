import Router from 'express'
import { addSearched, getSearched} from '../controllers/searched.controllers.js'

const router = Router();
router.post("/", addSearched);
router.get("/", getSearched);

export default router;