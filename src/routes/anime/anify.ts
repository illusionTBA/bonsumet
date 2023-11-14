import { ANIME } from "@consumet/extensions";
import { JsonResponse, FixPath } from "../../utils";

const anify = async (url: URL): Promise<Response> => {
  const Anify = new ANIME.Anify();
  const anifyPath = FixPath(url.pathname.replace("/anime/anify", ""));

  if (anifyPath === "/")
    return JsonResponse({
      intro:
        "Welcome to the Anify provider: check out the provider's website @ https://anify.tv/",
      routes: ["/:query", "/info/:id", "/watch/:episodeId"],
      documentation: "https://docs.consumet.org/#tag/anify",
    });

    if (anifyPath === "/info") {
        const id = url.searchParams.get("id")
        if (!id) return JsonResponse({message: "ID is needed"})
        const res = await Anify.fetchAnimeInfo(id).catch((err) => JsonResponse({message: err}))
        return JsonResponse(res)
    }


    if (anifyPath === "/watch") {
        const episodeId = url.searchParams.get("episodeId")
        const episodeNumber = url.searchParams.get("episodeNumber")
        const animeId = url.searchParams.get("animeId")
         
        if (!episodeId) return JsonResponse({ message: 'episodeId is required' }, 400)
        if (!episodeNumber) return JsonResponse({ message: 'episodeNumber is required' }, 400)
        if (!animeId) return JsonResponse({ message: 'animeId is required' }, 400)

        const res = await Anify.fetchEpisodeSources(episodeId, Number(episodeNumber), Number(animeId)).catch((err) => JsonResponse({message: err}))


        return JsonResponse(res)
    }


    if (/\/.*/.test(anifyPath)) {
        const query = anifyPath.substring(1);
        const res = await Anify.search(query);
        return JsonResponse(res)
    }   


  return JsonResponse({ message: "Route not found" }, 404);
};

export default anify
