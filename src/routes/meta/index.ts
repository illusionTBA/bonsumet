import { FixPath, JsonResponse } from "../../utils";
import anilist from "./anilist";
const HandleMeta = async (url: URL): Promise<Response> => {
  const metaPath = FixPath(url.pathname.replace("/meta", ""));

  if (metaPath === "/") return new Response("Welcome to Bonsumet Anime 🗺️");
  if (/\/anilist.*/.test(metaPath)) return anilist(url)



  return JsonResponse({ message: "Route not found" }, 404);
};

export default HandleMeta;
