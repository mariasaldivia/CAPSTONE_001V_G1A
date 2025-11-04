import { Router } from "express";
import { login, chooseRole, register } from "../controllers/authController.js";

const router = Router();

router.post("/login", login);
router.post("/choose-role", chooseRole);

router.post("/register", register);

export default router;
