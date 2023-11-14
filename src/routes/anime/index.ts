import { JsonResponse, FixPath } from "../../utils";
import anify from "./anify";
import gogoanime from "./gogoanime";

const HandleAnime = async (url: URL): Promise<Response> => {
  const animePath = FixPath(url.pathname.replace("/anime", ""))
  
  if (animePath === "/") return new Response("Welcome to Bonsumet Anime 🗾")

  if (/\/anify.*/.test(animePath)) return anify(url)
  if (/\/gogoanime.*/.test(animePath)) return gogoanime(url)


  return JsonResponse({ message: "Route not found" }, 404);
};

export default HandleAnime;
