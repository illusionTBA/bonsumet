export const JsonResponse = async (
  json: any[] | Object,
  status: number = 200,
  headers?: Record<string, string>
): Promise<Response> => {
  return new Response(JSON.stringify(json), {
    status,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });
};


export const FixPath = (path: string): string => {
    return path === "" ? "/" : path;
}