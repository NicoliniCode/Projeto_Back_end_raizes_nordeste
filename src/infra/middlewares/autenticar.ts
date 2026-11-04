import type { Request } from "express";
import jwt from "jsonwebtoken";
import { ambiente } from "../../config/ambiente";
import { prisma } from "../banco/prisma";
import { ErroApp } from "../erros/ErroApp";
import { capturarErros } from "../utils/capturarErros";
import type { UsuarioLogado } from "../tipos";

export const autenticar = capturarErros(async (req, _res, next) => {

    const cabecalho = req.headers.authorization ?? "";
    const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice(7) : "";

    if (!token) throw new ErroApp(401, "NAO_AUTENTICADO", "Informe um token Bearer.");

    let payload: string | jwt.JwtPayload;

    try {
        payload = jwt.verify(token, ambiente.JWT_SECRET);
    } 
    catch {
        throw new ErroApp(401, "NAO_AUTENTICADO", "Token inválido ou expirado.");
    }

    if (typeof payload === "string" || !payload.sub || !/^\d+$/.test(payload.sub)) {
        throw new ErroApp(401, "NAO_AUTENTICADO", "Token inválido.");
    }

    // Busca de novo no banco: se o usuário foi desativado, o token para de valer
    const usuario = await prisma.usuario.findUnique({
        where: { id: Number(payload.sub) },
        select: { id: true, nome: true, email: true, perfil: true, unidadeId: true, ativo: true },
    });

    if (!usuario?.ativo) throw new ErroApp(401, "NAO_AUTENTICADO", "Conta inválida ou inativa.");

    const { ativo, ...dados } = usuario;
    req.usuario = dados;
    
    next();

});

// Usado nos controllers depois do middleware autenticar
export function usuarioLogado(req: Request): UsuarioLogado {
    if (!req.usuario) throw new ErroApp(401, "NAO_AUTENTICADO", "Token ausente ou inválido.");
    return req.usuario;
}
