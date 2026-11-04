import { Perfil, type Prisma } from "@prisma/client";
import { prisma } from "../../infra/banco/prisma";
import { ErroApp } from "../../infra/erros/ErroApp";
import type { UsuarioLogado } from "../../infra/tipos";
import type { FiltrosAuditoria } from "./auditoria.schema";

type DadosAuditoria = {
    atorId: number;
    acao: string;
    entidade: string;
    entidadeId: number;
    unidadeId: number | null;
    dados?: Prisma.InputJsonValue;
};

// Sempre chamado dentro da transação da operação, para o registro não ficar órfão
export async function registrarAuditoria(tx: Prisma.TransactionClient, dados: DadosAuditoria) {
    await tx.auditoria.create({ data: dados });
}

export async function listarAuditoria(filtros: FiltrosAuditoria, usuario: UsuarioLogado) {
    
    const ehGerente = usuario.perfil === Perfil.GERENTE;

    if (ehGerente && !usuario.unidadeId) {
        throw new ErroApp(403, "SEM_UNIDADE", "Gerente sem unidade vinculada.");
    }

    if (ehGerente && filtros.unidadeId && filtros.unidadeId !== usuario.unidadeId) {
        throw new ErroApp(403, "SEM_PERMISSAO", "Auditoria de outra unidade não permitida.");
    }

    // Gerente sempre vê só a própria unidade; ADMIN pode filtrar ou ver tudo
    const unidadeId = ehGerente ? usuario.unidadeId : filtros.unidadeId;

    return prisma.auditoria.findMany({
        where: unidadeId ? { unidadeId } : {},
        orderBy: { criadoEm: "desc" },
        take: filtros.limit,
        select: {
            id: true,
            atorId: true,
            acao: true,
            entidade: true,
            entidadeId: true,
            unidadeId: true,
            dados: true,
            criadoEm: true,
        },
    });
}
