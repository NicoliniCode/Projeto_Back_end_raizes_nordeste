import { ambiente } from "./config/ambiente";
import { criarApp } from "./app";
import { prisma } from "./infra/banco/prisma";

async function iniciar() {
    await prisma.$connect();

    const servidor = criarApp().listen(ambiente.PORT, () => {
        console.log(`API: http://localhost:${ambiente.PORT}/api`);
        console.log(`Swagger: http://localhost:${ambiente.PORT}/api/docs`);
    });

    const encerrar = () => {
        servidor.close(() => {
            prisma.$disconnect().finally(() => process.exit(0));
        });
    };
    process.on("SIGINT", encerrar);
    process.on("SIGTERM", encerrar);
}

iniciar().catch((erro) => {
    console.error(erro);
    process.exit(1);
});
