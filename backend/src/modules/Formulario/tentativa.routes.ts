import { Router } from "express";
import { FormularioController } from "./formulario.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { rolesMiddleware } from "../../middlewares/roles.middleware";

const router = Router();
const controller = new FormularioController();

router.get("/", authMiddleware, controller.listarTentativas.bind(controller));
router.get(
  "/supervisor",
  authMiddleware,
  rolesMiddleware("ADMIN"),
  controller.listarTentativasSupervisor.bind(controller)
);
router.get("/:id", authMiddleware, controller.buscarTentativa.bind(controller));

router.post(
  "/",
  authMiddleware,
  rolesMiddleware("ALUNO"),
  controller.criarTentativa.bind(controller)
);

router.put("/:id", authMiddleware, controller.atualizarTentativa.bind(controller));
router.delete("/:id", authMiddleware, controller.deletarTentativa.bind(controller));

export default router;
