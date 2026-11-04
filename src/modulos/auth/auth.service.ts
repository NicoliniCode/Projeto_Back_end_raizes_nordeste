import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ambiente } from "../../config/ambiente";
import { prisma } from "../../infra/banco/prisma";
import { ErroApp } from "../../infra/erros/ErroApp";
import type { DadosLogin } from "./auth.schema";

const DURACAO_TOKEN_SEGUNDOS = 2 * 60 * 60; // 2 horas

export async function fazerLogin({ email, senha }: DadosLogin) {
    
    const usuario = await prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });

    // Mesma resposta para e-mail inexistente e senha errada, para não revelar quais e-mails existem
    const senhaConfere = usuario?.ativo && (await bcrypt.compare(senha, usuario.senhaHash));

    if (!usuario || !senhaConfere) {
        throw new ErroApp(401, "CREDENCIAIS_INVALIDAS", "E-mail ou senha inválidos.");
    }

    const accessToken = jwt.sign({ perfil: usuario.perfil }, ambiente.JWT_SECRET, {
        subject: String(usuario.id),
        expiresIn: DURACAO_TOKEN_SEGUNDOS,
    });

    return {
        accessToken,
        tokenType: "Bearer",
        expiresIn: DURACAO_TOKEN_SEGUNDOS,
        user: {
            id: usuario.id,
            nome: usuario.nome,
            perfil: usuario.perfil,
            unidadeId: usuario.unidadeId,
        },
    };
}
