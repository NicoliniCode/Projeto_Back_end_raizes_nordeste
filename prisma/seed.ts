import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Perfil } from "@prisma/client";

const prisma = new PrismaClient();

const usuarios = [
    {
        nome: "Administrador Demostrativo",
        email: "admin@raizes.local",
        perfil: Perfil.ADMIN,
        unidadeId: null,
        senha: "Admin123!",
    },
    {
        nome: "Cliente Demo",
        email: "cliente@raizes.local",
        perfil: Perfil.CLIENTE,
        unidadeId: null,
        senha: "Cliente123!",
    },
    {
        nome: "Cozinha Recife",
        email: "cozinha@raizes.local",
        perfil: Perfil.COZINHA,
        unidadeId: 1,
        senha: "Cozinha123!",
    },
    {
        nome: "Atendente Recife",
        email: "atendente@raizes.local",
        perfil: Perfil.ATENDENTE,
        unidadeId: 1,
        senha: "Atendente123!",
    },
    {
        nome: "Gerente Recife",
        email: "gerente@raizes.local",
        perfil: Perfil.GERENTE,
        unidadeId: 1,
        senha: "Gerente123!",
    },
    {
        nome: "Outro Cliente",
        email: "cliente2@raizes.local",
        perfil: Perfil.CLIENTE,
        unidadeId: null,
        senha: "Cliente2123!",
    },
];

async function main() {
    if (process.env.NODE_ENV === "production") {
        throw new Error("Seed de demonstração não pode rodar em produção.");
    }

    for (const { senha, ...dados } of usuarios) {
        const senhaHash = await bcrypt.hash(senha, 12);
        await prisma.usuario.upsert({
            where: { email: dados.email },
            create: { ...dados, senhaHash },
            update: { ...dados, senhaHash, ativo: true },
        });
    }

    console.log(`Seed concluído: ${usuarios.length} usuários.`);
}

main()
    .catch((erro) => {
        console.error(erro);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
