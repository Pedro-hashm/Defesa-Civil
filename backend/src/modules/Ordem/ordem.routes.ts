import { Router } from 'express';
import { OrdemController } from './ordem.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rolesMiddleware } from '../../middlewares/roles.middleware';

const router = Router();
const controller = new OrdemController();

// Rota pública: qualquer usuário autenticado pode listar ordens ativas (para preencher selects)
router.get('/ativas', authMiddleware, controller.listarAtivas.bind(controller));

// Rotas admin-only
router.use(authMiddleware, rolesMiddleware('ADMIN'));
router.post('/', controller.criar.bind(controller));
router.get('/', controller.listar.bind(controller));
router.get('/:id', controller.buscar.bind(controller));
router.put('/:id', controller.atualizar.bind(controller));
router.delete('/:id', controller.deletar.bind(controller));

export default router;
