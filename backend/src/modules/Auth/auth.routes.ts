import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { rolesMiddleware } from "../../middlewares/roles.middleware";

const router = Router();
const controller = new AuthController();

// Rotas públicas
router.post("/cadastro", controller.cadastro.bind(controller));
router.post("/login", controller.login.bind(controller));
router.post("/forgot-password", controller.forgotPassword.bind(controller));
router.post("/reset-password", controller.resetPassword.bind(controller));

// Rotas públicas do sistema de convites
router.get("/convite/:token", controller.validarConvite.bind(controller));
router.post("/registrar", controller.registrarComConvite.bind(controller));

// Rota autenticada
router.get("/me", authMiddleware, controller.me.bind(controller));

// Rota exclusiva para ADMIN: gerar link de convite
router.post(
  "/convite",
  authMiddleware,
  rolesMiddleware("ADMIN"),
  controller.criarConvite.bind(controller)
);

export default router;
