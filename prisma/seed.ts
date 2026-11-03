import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Perfil, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const unidades = [
    { id: 1, nome: "Recife - Centro", cidade: "Recife" },
    { id: 2, nome: "Olinda - Centro", cidade: "Olinda" },
];

const produtos = [
    { id: 101, nome: "Cuscuz com queijo", preco: "19.90" },
    { id: 102, nome: "Tapioca de carne de sol", preco: "24.90" },
    { id: 103, nome: "Suco de cajá", preco: "9.90" },
];

const ESTOQUE_INICIAL = 30;

const usuarios = [
    {
        nome: "Administrador Demonstrativo",
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

    // Unidades primeiro, porque os funcionários apontam para a unidade 1
    for (const unidade of unidades) {

        await prisma.unidade.upsert({
            where: { id: unidade.id },
            create: unidade,
            update: { nome: unidade.nome, cidade: unidade.cidade, ativo: true },
        });
    }

    for (const { preco, ...produto } of produtos) {

        await prisma.produto.upsert({
            where: { id: produto.id },
            create: produto,
            update: { nome: produto.nome, ativo: true },
        });

        for (const unidade of unidades) {
            const chave = { unidadeId: unidade.id, produtoId: produto.id };

            await prisma.itemCardapio.upsert({
                where: { unidadeId_produtoId: chave },
                create: { ...chave, preco: new Prisma.Decimal(preco) },
                update: { preco: new Prisma.Decimal(preco), disponivel: true },
            });

            // update vazio: rodar o seed de novo não repõe o saldo que já existe
            await prisma.estoque.upsert({
                where: { unidadeId_produtoId: chave },
                create: { ...chave, quantidade: ESTOQUE_INICIAL },
                update: {},
            });
        }
    }

    for (const { senha, ...dados } of usuarios) {

        const senhaHash = await bcrypt.hash(senha, 12);
        
        await prisma.usuario.upsert({
            where: { email: dados.email },
            create: { ...dados, senhaHash },
            update: { ...dados, senhaHash, ativo: true },
        });
    }

    console.log(
        `Seed concluído: ${unidades.length} unidades, ${produtos.length} produtos e ${usuarios.length} usuários.`,
    );
}

main()
    .catch((erro) => {
        console.error(erro);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
