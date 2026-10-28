import { Router } from "express"
import { DiffController } from "../controllers/diff.controller.js"

const router = Router()

router.post("/diff/parse", DiffController.parseDiff)

export default router