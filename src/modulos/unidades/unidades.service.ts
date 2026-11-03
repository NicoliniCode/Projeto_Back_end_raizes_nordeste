import { prisma } from "../../infra/banco/prisma";
import { ErroApp } from "../../infra/erros/ErroApp";
import { verificarUnidade } from "../../infra/utils/permissoes";
import type { UsuarioLogado } from "../../infra/tipos";

export async function listarUnidades() {
    return prisma.unidade.findMany({
        where: { ativo: true },
        select: { id: true, nome: true, cidade: true },
        orderBy: { id: "asc" },
    });
}

export async function buscarCardapio(unidadeId: number) {

    const unidade = await prisma.unidade.findFirst({ where: { id: unidadeId, ativo: true } });

    if (!unidade) throw new ErroApp(404, "UNIDADE_NAO_ENCONTRADA", "Essa unidade não existe.");

    const itens = await prisma.itemCardapio.findMany({
        where: { unidadeId, disponivel: true, produto: { ativo: true } },
        include: { produto: { select: { nome: true, descricao: true } } },
        orderBy: { produtoId: "asc" },
    });

    return {
        unidade: { id: unidade.id, nome: unidade.nome },
        itens: itens.map((item) => ({
            produtoId: item.produtoId,
            nome: item.produto.nome,
            descricao: item.produto.descricao,
            preco: item.preco,
        })),
    };
}

export async function buscarEstoque(unidadeId: number, usuario: UsuarioLogado) {

    verificarUnidade(usuario, unidadeId);

    const unidade = await prisma.unidade.findUnique({ where: { id: unidadeId } });
    
    if (!unidade)
        throw new ErroApp(
            404,
            "UNIDADE_NAO_ENCONTRADA",
            "Essa unidade não está cadastada no sistema.",
        );

    const estoques = await prisma.estoque.findMany({
        where: { unidadeId },
        include: { produto: { select: { nome: true } } },
        orderBy: { produtoId: "asc" },
    });

    return {
        unidadeId,
        estoques: estoques.map((estoque) => ({
            produtoId: estoque.produtoId,
            produto: estoque.produto.nome,
            quantidade: estoque.quantidade,
        })),
    };
}
