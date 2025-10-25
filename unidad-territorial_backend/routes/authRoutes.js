import { Router } from "express";
import { login, chooseRole } from "../controllers/authController.js";

const router = Router();

router.post("/login", login);
router.post("/choose-role", chooseRole);

export default router;
