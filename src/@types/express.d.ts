import type { UsuarioLogado } from "../infra/tipos";

// Acrescenta o usuário logado ao Request do Express
declare global {
    namespace Express {
        interface Request {
            usuario?: UsuarioLogado;
        }
    }
}

export {};
