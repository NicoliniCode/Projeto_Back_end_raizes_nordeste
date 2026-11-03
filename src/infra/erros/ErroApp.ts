export class ErroApp extends Error {
    constructor(
        public readonly status: number,
        public readonly codigo: string,
        mensagem: string,
        public readonly detalhes: unknown[] = [],
    ) {
        super(mensagem);
        this.name = "ErroApp";
    }
}
