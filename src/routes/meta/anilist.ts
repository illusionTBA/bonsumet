import { PROVIDERS_LIST, ANIME, META, Genres, StreamingServers } from "@consumet/extensions";
import NineAnime from "@consumet/extensions/dist/providers/anime/9anime";
import Anilist from "@consumet/extensions/dist/providers/meta/anilist";
import { FixPath, JsonResponse } from "../../utils";
import { redis } from "../..";
import cache from "../../cache";
import Redis from "ioredis";

const anilist = async (url: URL): Promise<Response> => {
  const anilistPath = FixPath(url.pathname.replace("/meta/anilist", ""));


  if (anilistPath === "/") {
    return JsonResponse({
      intro:
        "Welcome to the anilist provider: check out the provider's website @ https://anilist.co/",
      routes: ["/:query", "/info/:id", "/watch/:episodeId"],
      documentation: "https://docs.consumet.org/#tag/anilist",
    });
  }


  if (anilistPath === "/advanced-search") {
    const query = url.searchParams.get("query") ?? undefined;
    const page = Number(url.searchParams.get("page")) ?? 1;
    const perPage = Number(url.searchParams.get("perPage")) ?? 20;
    const type = url.searchParams.get("type") ?? "ANIME";
    let genres: string | string[] | undefined  = url.searchParams.get("genres") ?? undefined;
    const id = url.searchParams.get("id") ?? undefined;
    const format = url.searchParams.get("format") ?? undefined;
    let sort: string | string[] | undefined = url.searchParams.get("sort") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const year = Number(url.searchParams.get("year")) ?? undefined;
    const season = url.searchParams.get("season") ?? undefined;
    const anilist = generateAnilistMeta();
    if (genres) {
      JSON.parse(genres as string).forEach((genre: string) => {
        if (!Object.values(Genres).includes(genre as Genres)) {
          return JsonResponse(
            { message: `${genre} is not a valid genre` },
            400
          );
        }
      });
      genres = JSON.parse(genres as string);
    }

    if (sort) sort = JSON.parse(sort as string);

    if (season)
      if (!["WINTER", "SPRING", "SUMMER", "FALL"].includes(season))
        return JsonResponse(
          { message: `${season} is not a valid season` },
          400
        );

    const res = await anilist.advancedSearch(
      query as string,
      type as string,
      page,
      perPage,
      format as string,
      sort as string[],
      genres as string[],
      id as string,
      year,
      status as string,
      season as string
    );
    return JsonResponse(res);
  }

  if (anilistPath === "/trending") {
    const page = Number(url.searchParams.get("page")) ?? 1;
    const perPage = Number(url.searchParams.get("perPage")) ?? 20;
    const anilist = generateAnilistMeta();

    return redis
      ? JsonResponse(
          await cache.fetch(
            redis as Redis,
            `anilist:trending;${page};${perPage}`,
            async () => await anilist.fetchTrendingAnime(page, perPage),
            60 * 60
          )
        )
      : JsonResponse(await anilist.fetchTrendingAnime(page, perPage));
  }

  if (anilistPath === "/popular") {
    const page = Number(url.searchParams.get("page")) ?? 1;
    const perPage = Number(url.searchParams.get("perPage")) ?? 20;
    const anilist = generateAnilistMeta();

    return redis
      ? JsonResponse(
          await cache.fetch(
            redis as Redis,
            `anilist:popular;${page};${perPage}`,
            async () => await anilist.fetchPopularAnime(page, perPage),
            60 * 60
          )
        )
      : JsonResponse(await anilist.fetchPopularAnime(page, perPage));
  }

  if (anilistPath === "/airing-schedule") {
    const page = Number(url.searchParams.get("page")) ?? 1;
    const perPage = Number(url.searchParams.get("perPage")) ?? 20;
    const weekStart: number | string | undefined = url.searchParams.get("weekStart") ?? undefined;
    const weekEnd: number | string | undefined = url.searchParams.get("weekEnd") ?? undefined;
    let notYetAired: string | boolean | undefined = url.searchParams.get("notYetAired") ?? undefined;
    const anilist = generateAnilistMeta();
    if (notYetAired && notYetAired.toLocaleLowerCase() === "true") {
      notYetAired = true;
    } else {
      notYetAired = false;
    }
    const res = await anilist.fetchAiringSchedule(
      page,
      perPage,
      weekStart,
      weekEnd,
      typeof notYetAired === "boolean"
    );
    return JsonResponse(res)
  }

  if (anilistPath === "/genre") {
    const genres = url.searchParams.get("genres")
    const page = Number(url.searchParams.get("page")) ?? 1;
    const perPage = Number(url.searchParams.get("perPage")) ?? 20;

    const anilist = generateAnilistMeta();

    if (!genres) return JsonResponse({ message: 'genres is required' }, 400)

    JSON.parse(genres).forEach((genre: string) => {
      if (!Object.values(Genres).includes(genre as Genres)) {
        return JsonResponse({ message: `${genre} is not a valid genre` }, 400)
      }
    });

    const res = await anilist.fetchAnimeGenres(JSON.parse(genres), page, perPage);

    return JsonResponse(res)
  }


  if (anilistPath === "/recent-episodes") {
    const provider = url.searchParams.get("provider") as 'gogoanime' | 'zoro' ?? "gogoanime"
    const page = Number(url.searchParams.get("page"));
    const perPage = Number(url.searchParams.get("perPage"));

    const anilist = generateAnilistMeta(provider);

    const res = await anilist.fetchRecentEpisodes(provider, page, perPage);

    return JsonResponse(res)
  }

  if (anilistPath === "/random-anime") {
    const anilist = generateAnilistMeta();

      const res = await anilist.fetchRandomAnime().catch((err) => {
        return JsonResponse({ message: 'Anime not found' }, 400)
      });
      return JsonResponse(res)

  }


  if (anilistPath.includes("/servers/")) {
    const id = anilistPath.replace("/servers/", "")
    const provider = url.searchParams.get("provider") as string

    const anilist = generateAnilistMeta(provider);
    const res = await anilist.fetchEpisodeServers(id);
    return JsonResponse(res)
  }

  if (anilistPath.includes("/data/")) {
    const id = anilistPath.replace("/data/", "")
    const anilist = generateAnilistMeta();
    const res = await anilist.fetchAnilistInfoById(id);
    return JsonResponse(res)
  }

  if (anilistPath.includes("/episodes/")) {
    const id = anilistPath.replace("/episodes/", "");
    const provider = (url.searchParams.get("provider") as string) ?? "gogoanime";
    let fetchFiller = url.searchParams.get("fetchFiller") as string | boolean;
    let dub = url.searchParams.get("dub") as string | boolean;
    const anilist = generateAnilistMeta(provider);

    if (dub === "true" || dub === "1") dub = true;
    else dub = false;

    if (fetchFiller === "true" || fetchFiller === "1") fetchFiller = true;
    else fetchFiller = false;

    return redis
      ? JsonResponse(
          await cache.fetch(
            redis as Redis,
            `anilist:episodes;${id};${dub};${fetchFiller};${anilist.provider.name.toLowerCase()}`,
            async () =>
              anilist.fetchEpisodesListById(
                id,
                dub as boolean,
                fetchFiller as boolean
              ),
            60 * 60
          )
        )
      : JsonResponse(
          await anilist.fetchEpisodesListById(
            id,
            dub as boolean,
            fetchFiller as boolean
          )
        );
  }



  if (anilistPath.includes("/info/")) {
    const id = anilistPath.replace("/info/", "");
    const provider = (url.searchParams.get("provider") as string) ?? "gogoanime";
    let fetchFiller = url.searchParams.get("fetchFiller") as string | boolean;
    let isDub = url.searchParams.get("dub") as string | boolean;

    if (!id) return JsonResponse({ message: "ID required" }, 400);

    let anilist = generateAnilistMeta(provider);

    if (isDub === "true" || isDub === "1") isDub = true;
    else isDub = false;

    if (fetchFiller === "true" || fetchFiller === "1") fetchFiller = true;
    else fetchFiller = false;

    return redis
      ? JsonResponse(
          await cache.fetch(
            redis,
            `anilist:info;${id};${isDub};${fetchFiller};${anilist.provider.name.toLowerCase()}`,
            async () =>
              await anilist.fetchAnimeInfo(
                id,
                isDub as boolean,
                fetchFiller as boolean
              ),
            60 * 60
          )
        )
      : JsonResponse(
          await anilist.fetchAnimeInfo(
            id,
            isDub as boolean,
            fetchFiller as boolean
          )
        );
  }



  if (anilistPath.includes("/watch/")) {
    const episodeId = anilistPath.replace("/watch/", "")
    const provider = url.searchParams.get("provider") as string ?? "gogoanime";
    const server = url.searchParams.get("server") as StreamingServers | undefined;


    if (server && !Object.values(StreamingServers).includes(server))
      return JsonResponse({message: `${server} is not a valid server`}, 400)

    const anilist = generateAnilistMeta(provider);

    return redis ? JsonResponse(await cache.fetch(
      redis,
      `anilist:watch;${episodeId};${anilist.provider.name.toLowerCase()};${server}`,
      async () => await anilist.fetchEpisodeSources(episodeId, server),
      600
    )) : JsonResponse(await anilist.fetchEpisodeSources(episodeId, server))

  }


  if (/\/.*/.test(anilistPath)) {
    const anilist = generateAnilistMeta();
    const query = anilistPath.substring(1);
    const page = Number(url.searchParams.get("page"));
    const perPage = Number(url.searchParams.get("perPage"));
    return JsonResponse(await anilist.search(query, page, perPage))

  }
  return JsonResponse({ message: "Route not found" }, 404);
};

export default anilist;

const generateAnilistMeta = (
  provider: string | undefined = undefined
): Anilist => {
  if (typeof provider !== "undefined") {
    let possibleProvider = PROVIDERS_LIST.ANIME.find(
      (p) => p.name.toLowerCase() === provider.toLocaleLowerCase()
    );

    if (possibleProvider instanceof NineAnime) {
      possibleProvider = new ANIME.NineAnime(
        process.env?.NINE_ANIME_HELPER_URL,
        {
          url: process.env?.NINE_ANIME_PROXY as string,
        },
        process.env?.NINE_ANIME_HELPER_KEY as string
      );
    }

    return new META.Anilist(possibleProvider, {
      url: process.env.PROXY as string | string[],
    });
  } else {
    return new Anilist(undefined, {
      url: process.env.PROXY as string | string[],
    });
  }
};
