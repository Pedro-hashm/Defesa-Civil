import express from "express";
import usuarioRoutes from "./modules/Usuario/usuario.routes";

const app = express();

app.use(express.json());

app.use("/usuarios", usuarioRoutes);

export default app;