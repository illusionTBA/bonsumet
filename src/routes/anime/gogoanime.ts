import { FixPath, JsonResponse } from "../../utils";
import { ANIME } from "@consumet/extensions";

const gogoanime = async (url: URL): Promise<Response> => {
  const gogoPath = FixPath(url.pathname.replace("/anime/gogoanime", ""));
  const gogo = new ANIME.Gogoanime();

  if (gogoPath === "/")
    return JsonResponse({
      intro:
        `Welcome to the gogoanime provider: check out the provider's website @ https://gogoanimehd.io/`,
      routes: [
        "/:query",
        "/info/:id",
        "/watch/:episodeId",
        "/servers/:episodeId",
        "/top-airing",
        "/recent-episodes",
      ],
      documentation: "https://docs.consumet.org/#tag/gogoanime",
    });

    if (/\/info.*/.test(gogoPath)) {
        if (gogoPath.split("/").length < 3 || gogoPath.endsWith("/")) return JsonResponse({message: "please supply an id. example: /info/one-piece"})
        const id = decodeURIComponent(gogoPath.replace("/info/", ""))
        const res = await gogo.fetchAnimeInfo(id).catch(err => JsonResponse({message: err}, 404))
        return JsonResponse(res)
    } 

    if (/\/genre.*/.test(gogoPath)) {
        if (gogoPath.split("/").length < 3 || gogoPath.endsWith("/")) return JsonResponse({message: "please supply a genre. example: /genre/action"})
        const genre = gogoPath.replace("/genre/", "")
        const page = Number(url.searchParams.get("page"))
        const res = await gogo.fetchGenreInfo(genre.endsWith("/") ? genre.replace("/", ""): genre, page).catch(err => JsonResponse({message: err}, 404))
        return JsonResponse(res)
    }



    if (/\/.*/.test(gogoPath)) {
      const query = gogoPath.substring(1);
      const res = await gogo.search(query);
      return JsonResponse(res)
  }   


  return JsonResponse({ message: "Route not found" }, 404);
};

export default gogoanime;
