import { Router } from "express";
import { Perfil } from "@prisma/client";
import { autenticar } from "../../infra/middlewares/autenticar";
import { autorizar } from "../../infra/middlewares/autorizar";
import { unidadesController } from "./unidades.controller";

export const rotasUnidades = Router();

rotasUnidades.get("/", unidadesController.listar);
rotasUnidades.get("/:id/cardapio", unidadesController.cardapio);
rotasUnidades.get(
    "/:id/estoque",
    autenticar,
    autorizar(Perfil.GERENTE, Perfil.ADMIN),
    unidadesController.estoque,
);
