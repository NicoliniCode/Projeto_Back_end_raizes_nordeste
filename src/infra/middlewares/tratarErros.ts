import { randomUUID } from "node:crypto";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ErroApp } from "../erros/ErroApp";

export const rotaNaoEncontrada: RequestHandler = (_req, _res, next) => {
    next(new ErroApp(404, "ROTA_NAO_ENCONTRADA", "Rota inexistente."));
};

export const tratarErros: ErrorRequestHandler = (erro: unknown, req, res, _next) => {
    let status = 500;
    let codigo = "ERRO_INTERNO";
    let mensagem = "Ocorreu um erro interno.";
    let detalhes: unknown[] = [];

    if (erro instanceof ErroApp) {
        ({ status, codigo, detalhes } = erro);
        mensagem = erro.message;
    } else if (erro instanceof ZodError) {
        status = 422;
        codigo = "VALIDACAO_DADOS";
        mensagem = "Dados inválidos.";
        detalhes = erro.issues.map((item) => ({ field: item.path.join("."), issue: item.message }));
    } else if (erro instanceof SyntaxError && "body" in erro) {
        status = 400;
        codigo = "JSON_INVALIDO";
        mensagem = "O corpo do JSON está malformado.";
    } else if (erro instanceof Prisma.PrismaClientKnownRequestError) {
        const conhecidos: Record<string, [number, string, string]> = {
            P2002: [409, "REGISTRO_DUPLICADO", "O registro já existe."],
            P2025: [404, "NAO_ENCONTRADO", "Registro não encontrado."],
            P2034: [409, "CONCORRENCIA", "Conflito concorrente; tente novamente."],
        };
        if (conhecidos[erro.code]) [status, codigo, mensagem] = conhecidos[erro.code];
    }

    if (status >= 500) console.error("Erro interno:", erro);

    res.status(status).json({
        error: codigo,
        message: mensagem,
        details: detalhes,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        requestId: randomUUID(),
    });
};
