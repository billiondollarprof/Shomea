// functions/models/[[path]].js
//
// SERVES A SPEECH MODEL OUT OF R2, THROUGH OUR OWN ADDRESS.
//
// Why this exists rather than a public bucket
// -------------------------------------------
// The models are far bigger than the 25 MiB Cloudflare Pages allows, so
// they live in R2 instead. R2 can be made public, but then the browser is
// fetching from a different address to the app, which means cross origin
// rules, a CORS policy to maintain, and a second URL that can rot.
//
// Reading it through here instead means the browser only ever talks to
// shomea.pages.dev. Same address, no CORS, nothing to configure, and the
// bucket stays private.
//
// What it must never do
// ---------------------
// It must never write, and it must never take a path from the browser and
// hand it to anything but the bucket. It is a read hole into one bucket
// and nothing else.
//
// What it needs
// -------------
// A binding called MODELS pointing at the bucket shomea-models. The
// convert-model workflow sets that itself through the Cloudflare API, so
// there is nothing to click.
//
// Sections
// --------
//   1. Working out what was asked for
//   2. Fetching it
//   3. Caching, which is what makes the second service instant

export async function onRequestGet(context) {
  // -------------------------------------------------------------------------
  // 1. Working out what was asked for
  // -------------------------------------------------------------------------

  const { params, env } = context;

  if (!env || !env.MODELS) {
    return new Response(
      "No model storage is connected. Run the Convert a speech model workflow.",
      { status: 503, headers: { "content-type": "text/plain" } },
    );
  }

  // params.path is each piece of the address after /models/. Joining them
  // back up gives the key inside the bucket.
  const pieces = Array.isArray(params.path) ? params.path : [params.path];
  const key = pieces.filter(Boolean).join("/");

  // A path that climbs out of its folder is refused rather than cleaned up,
  // because a request shaped like that is never a real one.
  if (!key || key.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  // -------------------------------------------------------------------------
  // 2. Fetching it
  // -------------------------------------------------------------------------

  const object = await env.MODELS.get(key);

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  // -------------------------------------------------------------------------
  // 3. Caching, which is what makes the second service instant
  // -------------------------------------------------------------------------
  //
  // A model file never changes. A new model gets a new name. So it can be
  // kept for a year, which means a phone that has been to one service
  // never downloads it again.

  headers.set("cache-control", "public, max-age=31536000, immutable");

  if (!headers.has("content-type")) {
    headers.set(
      "content-type",
      key.endsWith(".json") ? "application/json" : "application/octet-stream",
    );
  }

  return new Response(object.body, { headers });
}
