import { JsonResponse } from "../utils"
import HandleAnime from "./anime"
export const Router = async(req: Request): Promise<Response> => {
    const url = new URL(req.url)
    const path = url.pathname
    if (path === "/") return new Response("Welcome to bonsumet api! 🎉 \n")
    if (/\/anime.*/.test(path)) return HandleAnime(url)
    return JsonResponse({message: "Route not found"}, 404)
}