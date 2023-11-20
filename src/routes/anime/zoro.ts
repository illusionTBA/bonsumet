import { FixPath, JsonResponse } from "../../utils";
import { ANIME, StreamingServers } from "@consumet/extensions";

const zoro = async (url: URL): Promise<Response> => {
  const zoroPath = FixPath(url.pathname.replace("/anime/zoro", ""));
  const Zoro = new ANIME.Zoro();

  if (zoroPath === "/")
    return JsonResponse({
      intro:
        "Welcome to the zoro provider: check out the provider's website @ https://zoro.to/",
      routes: ["/:query", "/recent-episodes", "/info/:id", "/watch/:episodeId"],
      documentation: "https://docs.consumet.org/#tag/zoro",
    });

  if (zoroPath === "/recent-episodes") {
    const page = Number(url.searchParams.get("page"));
    const res = await Zoro.fetchRecentEpisodes(isNaN(page) ? 1 : page);
    return JsonResponse(res);
  }

  if (zoroPath === "/info") {
    const id = url.searchParams.get("id");
    if (!id) return JsonResponse({ message: "Please supply an ID" });
    const res = await Zoro.fetchAnimeInfo(id).catch((err) =>
      JsonResponse({ message: err })
    );
    return JsonResponse(res);
  }

  if (zoroPath === "/watch") {
    try {
        const episodeId = url.searchParams.get("episodeId");
        const server = url.searchParams.get("server") as StreamingServers;
    
        if (server && !Object.values(StreamingServers).includes(server))
          return JsonResponse({ message: "server is invalid" }, 400);
    
        if (!episodeId) return JsonResponse({ message: "id is required" });
    
        const res = await Zoro.fetchEpisodeSources(episodeId, server).catch(err => JsonResponse({message: err}))
        return JsonResponse(res)
    } catch (error) {
        return JsonResponse({message: error})
        
    }
  }

  if (/\/.*/.test(zoroPath)) {
    const query = zoroPath.substring(1);
    const res = await Zoro.search(query);
    return JsonResponse(res);
  }
  // if (/\/info.*/.test(gogoPath)) {
  //     if (gogoPath.split("/").length < 3 || gogoPath.endsWith("/")) return JsonResponse({message: "please supply an id. example: /info/one-piece"})
  //     const id = decodeURIComponent(gogoPath.replace("/info/", ""))
  //     const res = await gogo.fetchAnimeInfo(id).catch(err => JsonResponse({message: err}, 404))
  //     return JsonResponse(res)
  // }

  // if (/\/genre.*/.test(gogoPath)) {
  //     if (gogoPath.split("/").length < 3 || gogoPath.endsWith("/")) return JsonResponse({message: "please supply a genre. example: /genre/action"})
  //     const genre = gogoPath.replace("/genre/", "")
  //     const page = Number(url.searchParams.get("page"))
  //     const res = await gogo.fetchGenreInfo(genre.endsWith("/") ? genre.replace("/", ""): genre, page).catch(err => JsonResponse({message: err}, 404))
  //     return JsonResponse(res)
  // }

  return JsonResponse({ message: "Route not found" }, 404);
};

export default zoro;
