import { Router } from "express"
import { ReviewController } from "../controllers/review.controller.js"

const router = Router()

router.post("/reviews/run", ReviewController.runReview)

router.get("/reviews", ReviewController.getAllReviews)

router.get("/reviews/:id", ReviewController.getReviewById)

export default router