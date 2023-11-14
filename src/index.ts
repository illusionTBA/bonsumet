import { Router } from "./routes"

const PORT = process.env.PORT || 3000

const server = Bun.serve({
    port: PORT,
    async fetch(request, server) {
        return await Router(request)
    },
})



console.log(`[ INFO ] Server listening @ http://${server.hostname}:${server.port}`)