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
router.post("/", controller.criar.bind(controller));      // Create
router.get("/", controller.listar.bind(controller));      // Read All
router.get("/:id", controller.buscar.bind(controller));   // Read One
router.put("/:id", controller.atualizar.bind(controller));// Update
router.delete("/:id", controller.deletar.bind(controller));// Delete

export default router;