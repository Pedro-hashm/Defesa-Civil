// src/modules/Usuario/usuario.routes.ts
import { Router } from "express";
import { UsuarioController } from "./usuario.controller";

const router = Router();
const controller = new UsuarioController();

// CRUD completo
router.post("/", controller.criar.bind(controller));      // Create
router.get("/", controller.listar.bind(controller));      // Read All
router.get("/:id", controller.buscar.bind(controller));   // Read One
router.put("/:id", controller.atualizar.bind(controller));// Update
router.delete("/:id", controller.deletar.bind(controller));// Delete

export default router;