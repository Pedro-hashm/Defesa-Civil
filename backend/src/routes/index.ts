import { Router } from 'express';
import usuarioRoutes from '../modules/Usuario/usuario.routes';
import authRoutes from '../modules/Auth/auth.routes';
import comunicadoRoutes from '../modules/Comunicado/comunicado.routes';

const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/usuarios', usuarioRoutes);
routes.use('/comunicados', comunicadoRoutes);


export default routes;