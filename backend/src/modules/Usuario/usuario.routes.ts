// src/modules/Usuario/usuario.routes.ts
import { Router } from "express";
import { UsuarioController } from "./usuario.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { rolesMiddleware } from "../../middlewares/roles.middleware";

const router = Router();
const controller = new UsuarioController();

// Todas as rotas de usuário exigem autenticação + cargo ADMIN
router.use(authMiddleware, rolesMiddleware("ADMIN"));

// CRUD completo
router.post("/", controller.criar.bind(controller));
router.get("/", controller.listar.bind(controller));
router.get("/:id", controller.buscar.bind(controller));
router.patch("/:id/ativar", controller.ativar.bind(controller));
router.patch("/:id/desativar", controller.desativar.bind(controller));
router.put("/:id", controller.atualizar.bind(controller));
router.delete("/:id", controller.deletar.bind(controller));

// Admin gera link de reset de senha para um usuário específico
router.post("/:id/gerar-link-reset", controller.gerarLinkReset.bind(controller));

// Admin desbloqueia conta bloqueada por tentativas de login
router.patch("/:id/desbloquear", controller.desbloquear.bind(controller));

export default router;
