import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();
const controller = new AuthController();

router.post("/cadastro", controller.cadastro.bind(controller));
router.post("/login", controller.login.bind(controller));
router.get("/me", authMiddleware, controller.me.bind(controller));
router.post("/forgot-password", controller.forgotPassword.bind(controller));
router.post("/reset-password", controller.resetPassword.bind(controller));

export default router;