import type { RequestHandler } from "express";
import type { Perfil } from "@prisma/client";
import { ErroApp } from "../erros/ErroApp";
import { usuarioLogado } from "./autenticar";

export function autorizar(...perfis: Perfil[]): RequestHandler {
    return (req, _res, next) => {

        if (!perfis.includes(usuarioLogado(req).perfil)) {
            
            return next(
                new ErroApp(403, "SEM_PERMISSAO", "Perfil sem permissão para esta operação."),
            );
        }

        next();
    };
}
