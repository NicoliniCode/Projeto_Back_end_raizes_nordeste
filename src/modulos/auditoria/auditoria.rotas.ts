import { Router } from "express";
import { Perfil } from "@prisma/client";
import { autenticar } from "../../infra/middlewares/autenticar";
import { autorizar } from "../../infra/middlewares/autorizar";
import { auditoriaController } from "./auditoria.controller";

export const rotasAuditoria = Router();

rotasAuditoria.get(
    "/",
    autenticar,
    autorizar(Perfil.GERENTE, Perfil.ADMIN),
    auditoriaController.listar,
);
