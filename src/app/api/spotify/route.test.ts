/** @jest-environment node */

import { GET } from "@/app/api/spotify/route";

describe("GET /api/spotify", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 503 when refresh token is missing", async () => {
    delete process.env.SPOTIFY_REFRESH_TOKEN;

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body).toEqual({ error: "SPOTIFY_REFRESH_TOKEN not set" });
  });

  it("returns 429 with Retry-After header when spotify rate limits currently-playing", async () => {
    process.env.SPOTIFY_CLIENT_ID = "client";
    process.env.SPOTIFY_CLIENT_SECRET = "secret";
    process.env.SPOTIFY_REFRESH_TOKEN = "refresh-token";

    const fetchMock = jest.spyOn(global, "fetch").mockImplementation(
      (async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("accounts.spotify.com")) {
          return new Response(JSON.stringify({ access_token: "token" }), { status: 200 });
        }

        if (url.includes("currently-playing")) {
          return new Response(null, {
            status: 429,
            headers: { "Retry-After": "25" },
          });
        }

        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      }) as typeof fetch
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("25");
    expect(body).toEqual({ error: "Spotify rate limit reached" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
