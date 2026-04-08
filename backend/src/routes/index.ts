import { Router } from 'express';
import usuarioRoutes from '../modules/Usuario/usuario.routes';
import authRoutes from '../modules/Auth/auth.routes';

const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/usuarios', usuarioRoutes);


export default routes;