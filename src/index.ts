import { Router } from "./routes"
import Redis from 'ioredis';

export const redis = process.env.REDIS && new Redis(process.env.REDIS)

const PORT = process.env.PORT || 3000
const server = Bun.serve({
    development: true,
    port: PORT,
    async fetch(request, server) {
        return await Router(request)
    },
})



console.log(`[ INFO ] Server listening @ ${server.url}`)