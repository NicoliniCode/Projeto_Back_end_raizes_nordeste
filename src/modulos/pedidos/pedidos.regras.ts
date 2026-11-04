import { Perfil, StatusPedido, type Pedido, type Prisma } from "@prisma/client";
import { ErroApp } from "../../infra/erros/ErroApp";
import { verificarUnidade } from "../../infra/utils/permissoes";
import type { UsuarioLogado } from "../../infra/tipos";

export const PERFIS_QUE_CRIAM_PEDIDO: Perfil[] = [
    Perfil.CLIENTE,
    Perfil.ATENDENTE,
    Perfil.GERENTE,
    Perfil.ADMIN,
];

export const PERFIS_QUE_ALTERAM_STATUS: Perfil[] = [
    Perfil.COZINHA,
    Perfil.ATENDENTE,
    Perfil.GERENTE,
    Perfil.ADMIN,
];

// Pedido só pode ser pago ou cancelado enquanto não foi pago
export const STATUS_PAGAVEIS: StatusPedido[] = [
    StatusPedido.AGUARDANDO_PAGAMENTO,
    StatusPedido.PAGAMENTO_RECUSADO,
];

export const STATUS_CANCELAVEIS: StatusPedido[] = [
    StatusPedido.AGUARDANDO_PAGAMENTO,
    StatusPedido.PAGAMENTO_RECUSADO,
];

// Fluxo operacional: cada status só avança para o próximo
export const PROXIMO_STATUS: Partial<Record<StatusPedido, StatusPedido>> = {
    [StatusPedido.PAGO]: StatusPedido.EM_PREPARO,
    [StatusPedido.EM_PREPARO]: StatusPedido.PRONTO,
    [StatusPedido.PRONTO]: StatusPedido.ENTREGUE,
};

export const INCLUIR_DETALHES = {
    itens: { include: { produto: { select: { nome: true } } } },
    pagamentos: true,
} satisfies Prisma.PedidoInclude;

// ADMIN vê tudo, CLIENTE só os próprios pedidos e a equipe só a própria unidade
export function verificarAcessoPedido(
    pedido: Pick<Pedido, "clienteId" | "unidadeId">,
    usuario: UsuarioLogado,
): void {

    if (usuario.perfil === Perfil.ADMIN) return;

    if (usuario.perfil === Perfil.CLIENTE) {

        if (pedido.clienteId !== usuario.id) {
            
            throw new ErroApp(403, "SEM_PERMISSAO", "Pedido não pertence ao cliente.");
        }

        return;
    }

    verificarUnidade(usuario, pedido.unidadeId);
}
