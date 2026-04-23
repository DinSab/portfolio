import { NextResponse } from "next/server";

export interface SpotifyArtist {
  name: string;
}

export interface SpotifyImage {
  url: string;
  width: number;
  height: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: {
    name: string;
    images: SpotifyImage[];
  };
  preview_url: string | null;
  external_urls: { spotify: string };
  duration_ms: number;
}

export interface SpotifyData {
  nowPlaying: SpotifyTrack | null;
  isPlaying: boolean;
  recentlyPlayed: SpotifyTrack[];
}

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.SPOTIFY_REFRESH_TOKEN!,
    }),
    cache: "no-store",
  });

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export async function GET() {
  if (!process.env.SPOTIFY_REFRESH_TOKEN) {
    return NextResponse.json(
      { error: "SPOTIFY_REFRESH_TOKEN not set" },
      { status: 503 }
    );
  }

  try {
    const token = await getAccessToken();

    const [nowPlayingRes, recentlyPlayedRes] = await Promise.all([
      fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch("https://api.spotify.com/v1/me/player/recently-played?limit=10", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
    ]);

    let nowPlaying: SpotifyTrack | null = null;
    let isPlaying = false;

    if (nowPlayingRes.status === 200) {
      const npData = await nowPlayingRes.json() as {
        is_playing: boolean;
        item: SpotifyTrack | null;
      };
      isPlaying = npData.is_playing;
      nowPlaying = npData.item;
    }

    const rpData = await recentlyPlayedRes.json() as {
      items: Array<{ track: SpotifyTrack }>;
    };

    const recentlyPlayed = (rpData.items ?? [])
      .map((item) => item.track)
      // deduplicate by id, skip if same as now playing
      .filter(
        (track, index, arr) =>
          arr.findIndex((t) => t.id === track.id) === index &&
          track.id !== nowPlaying?.id
      )
      .slice(0, 10);

    return NextResponse.json(
      { nowPlaying, isPlaying, recentlyPlayed } satisfies SpotifyData,
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    console.error("Spotify API error:", err);
    return NextResponse.json({ error: "Failed to fetch Spotify data" }, { status: 500 });
  }
}
