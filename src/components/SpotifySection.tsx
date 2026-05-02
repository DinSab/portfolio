"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SpotifyData, SpotifyTrack } from "@/app/api/spotify/route";
import styles from "@/styles/components/spotify-section.module.scss";
import Image from "next/image";

const POLL_INTERVAL = 30_000;
const MINI_PLAYER_LINGER = 10_000;

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function TrackRow({
  track,
  isActive,
  isNowPlaying,
  onPlay,
  index = 0,
}: {
  track: SpotifyTrack;
  isActive: boolean;
  isNowPlaying?: boolean;
  onPlay: (track: SpotifyTrack) => void;
  index?: number;
}) {
  const art = track.album.images[2]?.url ?? track.album.images[0]?.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.2, once: false }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
    >
      <div
        className={`${styles.trackRow} ${isActive ? styles.trackRowActive : ""}`}
        onClick={() => onPlay(track)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPlay(track);
          }
        }}
        aria-label={`${track.preview_url ? "Play preview" : "Open on Spotify"} of ${track.name} by ${track.artists.map((a) => a.name).join(", ")}`}
      >
        <div className={styles.trackArt}>
          {art && <Image src={art} alt={track.album.name} width={40} height={40} />}
          {isNowPlaying && (
            <span className={styles.nowPlayingDot} aria-hidden="true" />
          )}
          {!isNowPlaying && track.preview_url && (
            <span className={`${styles.playOverlay} ${isActive ? styles.playOverlayPause : ""}`} aria-hidden="true">
              {isActive ? "⏸" : "▶"}
            </span>
          )}
        </div>

        <div className={styles.trackInfo}>
          <span className={styles.trackName}>{track.name}</span>
          <span className={styles.trackArtist}>
            {track.artists.map((a) => a.name).join(", ")} · {track.album.name}
          </span>
        </div>

        <div className={styles.trackMeta}>
          <span className={styles.trackDuration}>{formatMs(track.duration_ms)}</span>
          {!track.preview_url && <span className={styles.noPreview} title="No preview available">Open</span>}
        </div>
      </div>
    </motion.div>
  );
}

export default function SpotifySection() {
  const [data, setData] = useState<SpotifyData | null>(null);
  const [activeTrack, setActiveTrack] = useState<SpotifyTrack | null>(null);
  const [progress, setProgress] = useState(0);
  const [miniVisible, setMiniVisible] = useState(false);
  const [modalTrack, setModalTrack] = useState<SpotifyTrack | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRafRef = useRef<number | null>(null);
  const lingerTimerRef = useRef<number | null>(null);
  const retryTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const scheduleRetry = (delayMs: number) => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = window.setTimeout(() => {
        if (!cancelled) load();
      }, delayMs);
    };

    const load = async () => {
      try {
        const res = await fetch("/api/spotify");
        if (cancelled) return;

        if (res.status === 429) {
          // Back off; keep whatever stale data is already shown.
          const retryAfter = Number(res.headers.get("Retry-After") ?? "60");
          scheduleRetry(retryAfter * 1000);
          return;
        }

        if (!res.ok) return;
        const json = await res.json() as SpotifyData;
        setData(json);
      } catch {
        // silently ignore — Spotify is non-critical
      }
    };

    load();
    intervalId = setInterval(load, POLL_INTERVAL);
    return () => {
      cancelled = true;
      if (intervalId !== null) clearInterval(intervalId);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const stopProgress = useCallback(() => {
    if (progressRafRef.current) cancelAnimationFrame(progressRafRef.current);
    progressRafRef.current = null;
  }, []);

  const startProgress = useCallback(() => {
    stopProgress();
    const tick = () => {
      const audio = audioRef.current;
      if (!audio || audio.paused) return;
      setProgress(audio.currentTime / audio.duration);
      progressRafRef.current = requestAnimationFrame(tick);
    };
    progressRafRef.current = requestAnimationFrame(tick);
  }, [stopProgress]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    stopProgress();
    setProgress(0);
    setActiveTrack(null);

    // start linger then hide mini player
    if (lingerTimerRef.current) clearTimeout(lingerTimerRef.current);
    lingerTimerRef.current = window.setTimeout(() => {
      setMiniVisible(false);
      lingerTimerRef.current = null;
    }, MINI_PLAYER_LINGER);
  }, [stopProgress]);

  const playAudio = useCallback((track: SpotifyTrack) => {
    // toggle off if same track
    if (activeTrack?.id === track.id) {
      stopAudio();
      return;
    }

    if (lingerTimerRef.current) {
      clearTimeout(lingerTimerRef.current);
      lingerTimerRef.current = null;
    }

    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.pause();
    audio.src = track.preview_url ?? "";
    audio.volume = 0.6;
    audio.play().catch(() => null);

    setActiveTrack(track);
    setProgress(0);
    setMiniVisible(true);
    setModalTrack(null);

    audio.onended = stopAudio;
    audio.ontimeupdate = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    startProgress();
  }, [activeTrack, stopAudio, startProgress]);

  const openInSpotify = useCallback((track: SpotifyTrack) => {
    window.open(track.external_urls.spotify, "_blank", "noopener,noreferrer");
    setModalTrack(null);
  }, []);

  const openModal = useCallback((track: SpotifyTrack) => {
    setModalTrack(track);
  }, []);

  const playTrack = useCallback((track: SpotifyTrack) => {
    if (!track.preview_url) {
      openInSpotify(track);
      return;
    }
    openModal(track);
  }, [openInSpotify, openModal]);

  useEffect(() => {
    return () => {
      stopAudio();
      if (lingerTimerRef.current) clearTimeout(lingerTimerRef.current);
      setModalTrack(null);
    };
  }, [stopAudio]);

  return (
    <>
      <section id="spotify" className={styles.section}>
        <motion.div
          className={styles.shell}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.2, once: false }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
        >
          {data ? (
            <>
              {/* Header */}
              <div className={styles.header}>
                <div className={styles.headerLeft}>
                  <svg className={styles.spotifyIcon} viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <div>
                    <p className={styles.kicker}>Spotify</p>
                    <p className={styles.lead}>
                      {data.isPlaying ? "Now playing · Recently played" : "Recently played"}
                    </p>
                    {![data.nowPlaying, ...data.recentlyPlayed].some((track) => !!track?.preview_url) && (
                      <p className={styles.previewHint}>No Spotify previews for these tracks right now. Click to open in Spotify.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Now Playing */}
              {data.nowPlaying && (
                <div className={styles.nowPlayingBar}>
                  <span className={styles.nowPlayingLabel}>
                    <span className={styles.pulse} aria-hidden="true" />
                    Now Playing
                  </span>
                  <TrackRow
                    track={data.nowPlaying}
                    isActive={activeTrack?.id === data.nowPlaying.id}
                    isNowPlaying={data.isPlaying}
                    onPlay={playTrack}
                    index={0}
                  />
                </div>
              )}

              {/* Recently played */}
              <div className={styles.trackList}>
                {data.recentlyPlayed.length === 0 && (
                  <p className={styles.empty}>No recent tracks found.</p>
                )}
                {data.recentlyPlayed.map((track, index) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    isActive={activeTrack?.id === track.id}
                    onPlay={playTrack}
                    index={index + 1}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <svg className={styles.spotifyIcon} viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                <div>
                  <p className={styles.kicker}>Spotify</p>
                  <p className={styles.lead}>Loading...</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* Track Preview Modal */}
      <AnimatePresence>
        {modalTrack && (
          <>
            <motion.div
              className={styles.modalBackdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setModalTrack(null)}
              aria-hidden="true"
            />
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-track-name"
            >
              <button
                className={styles.closeButton}
                onClick={() => setModalTrack(null)}
                aria-label="Close preview"
              >
                ✕
              </button>

              <div className={styles.modalContent}>
                <Image
                  className={styles.modalArt}
                  src={modalTrack.album.images[0]?.url}
                  alt={modalTrack.album.name}
                  width={200}
                  height={200}
                />

                <div className={styles.modalInfo}>
                  <h3 id="modal-track-name" className={styles.modalTrackName}>
                    {modalTrack.name}
                  </h3>
                  <p className={styles.modalArtist}>
                    {modalTrack.artists.map((a) => a.name).join(", ")}
                  </p>
                  <p className={styles.modalAlbum}>{modalTrack.album.name}</p>
                  <p className={styles.modalDuration}>{formatMs(modalTrack.duration_ms)}</p>
                </div>

                <div className={styles.modalActions}>
                  {modalTrack.preview_url && (
                    <motion.button
                      className={styles.playButton}
                      onClick={() => playAudio(modalTrack)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      ▶ Play Preview
                    </motion.button>
                  )}
                  <motion.button
                    className={styles.spotifyButton}
                    onClick={() => openInSpotify(modalTrack)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ⲛ Open on Spotify
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mini persistent player */}
      <AnimatePresence>
        {miniVisible && (
          <motion.div
            className={styles.miniPlayer}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTrack && (
              <>
                <Image
                  className={styles.miniArt}
                  src={activeTrack.album.images[2]?.url ?? activeTrack.album.images[0]?.url}
                  alt={activeTrack.album.name}
                  width={36}
                  height={36}
                />
                <div className={styles.miniInfo}>
                  <span className={styles.miniName}>{activeTrack.name}</span>
                  <span className={styles.miniArtist}>
                    {activeTrack.artists.map((a) => a.name).join(", ")}
                  </span>
                </div>
                <div className={styles.miniProgressWrap} aria-hidden="true">
                  <div className={styles.miniProgressBar} style={{ width: `${progress * 100}%` }} />
                </div>
                <button
                  className={styles.miniStop}
                  onClick={stopAudio}
                  aria-label="Stop preview"
                >
                  ■
                </button>
              </>
            )}

            {!activeTrack && (
              <p className={styles.miniLinger}>Preview ended</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
