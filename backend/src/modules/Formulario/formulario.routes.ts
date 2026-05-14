import { Router } from "express";
import { FormularioController } from "./formulario.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { rolesMiddleware } from "../../middlewares/roles.middleware";

const router = Router();
const controller = new FormularioController();

router.get("/", authMiddleware, controller.listarFormularios.bind(controller));
router.get("/:id", authMiddleware, controller.buscarFormulario.bind(controller));

export default router;
