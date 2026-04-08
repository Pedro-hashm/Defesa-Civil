import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router();
const controller = new AuthController();

router.post("/cadastro", controller.cadastro.bind(controller));
router.post("/login", controller.login.bind(controller));

export default router;