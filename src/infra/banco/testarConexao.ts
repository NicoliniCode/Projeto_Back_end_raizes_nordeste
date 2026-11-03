import { prisma } from "./prisma";

async function testar() {
    await prisma.$connect();
    console.log("Conectado ao banco.");

    const criado = await prisma.usuario.create({
        data: { nome: "Teste", email: "teste@raizes.local", senhaHash: "Testando-senha-real" },
    });
    console.log("Usuário criado:", criado);

    const total = await prisma.usuario.count();
    console.log("Total de usuários:", total);

    await prisma.usuario.delete({ where: { id: criado.id } });
    console.log("Usuário de teste removido.");
}

testar()
    .catch((erro) => {
        console.error("Falha ao testar o banco:", erro);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
