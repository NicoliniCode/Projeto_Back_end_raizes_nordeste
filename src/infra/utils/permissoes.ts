import { Perfil } from "@prisma/client";
import { ErroApp } from "../erros/ErroApp";
import type { UsuarioLogado } from "../tipos";

// Funcionário só mexe na própria unidade. ADMIN vê tudo e CLIENTE é tratado pelo dono do pedido.
export function verificarUnidade(usuario: UsuarioLogado, unidadeId: number): void {
    
    const ehEquipe = usuario.perfil !== Perfil.ADMIN && usuario.perfil !== Perfil.CLIENTE;

    if (ehEquipe && usuario.unidadeId !== unidadeId) {
        throw new ErroApp(403, "SEM_PERMISSAO", "Acesso negado para outra unidade.");
    }
}
