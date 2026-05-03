import { Router } from 'express';
import { ComunicadoController } from './comunicado.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rolesMiddleware } from '../../middlewares/roles.middleware';

const router = Router();
const controller = new ComunicadoController();

// Leitura: qualquer usuario autenticado
router.get('/', authMiddleware, controller.listar.bind(controller));
router.get('/:id', authMiddleware, controller.buscar.bind(controller));

// Escrita: somente ADMIN
router.post('/', authMiddleware, rolesMiddleware('ADMIN'), controller.criar.bind(controller));
router.put('/:id', authMiddleware, rolesMiddleware('ADMIN'), controller.atualizar.bind(controller));
router.delete('/:id', authMiddleware, rolesMiddleware('ADMIN'), controller.deletar.bind(controller));

export default router;
