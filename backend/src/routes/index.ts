import { Router } from 'express';
import usuarioRoutes from '../modules/Usuario/usuario.routes';
import authRoutes from '../modules/Auth/auth.routes';
import comunicadoRoutes from '../modules/Comunicado/comunicado.routes';
import formularioRoutes from '../modules/Formulario/formulario.routes';
import tentativaRoutes from '../modules/Formulario/tentativa.routes';
import ordemRoutes from '../modules/Ordem/ordem.routes';

const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/usuarios', usuarioRoutes);
routes.use('/comunicados', comunicadoRoutes);
routes.use('/ordens', ordemRoutes);routes.use('/formularios', formularioRoutes);
routes.use('/tentativas', tentativaRoutes);

export default routes;
