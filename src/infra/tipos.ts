import type { Usuario } from "@prisma/client";

export type UsuarioLogado = Pick<Usuario, "id" | "nome" | "email" | "perfil" | "unidadeId">;
