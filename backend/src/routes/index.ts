import { Router } from 'express';
import usuarioRoutes from '../modules/Usuario/usuario.routes';

const routes = Router();

routes.use('/usuarios', usuarioRoutes);


export default routes;