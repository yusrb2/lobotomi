package com.lobotomi.app;

import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioTrack;

import java.util.Random;

public final class GatekeeperAudioSynthesizer {
    private static final int SAMPLE_RATE = 22050;
    private volatile boolean running = false;
    private volatile boolean muted = false;
    private Thread thread;
    private AudioTrack audioTrack;

    public synchronized void start(String mode) {
        stop();
        if ("silent".equals(mode)) {
            muted = true;
            return;
        }
        muted = false;
        running = true;
        final boolean isDrone = "drone".equals(mode);

        int minBuf = AudioTrack.getMinBufferSize(
            SAMPLE_RATE,
            AudioFormat.CHANNEL_OUT_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        );
        int bufferSize = Math.max(minBuf, SAMPLE_RATE / 4 * 2);

        audioTrack = new AudioTrack.Builder()
            .setAudioAttributes(
                new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build()
            )
            .setAudioFormat(
                new AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(SAMPLE_RATE)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build()
            )
            .setBufferSizeInBytes(bufferSize)
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build();

        if (audioTrack.getState() != AudioTrack.STATE_INITIALIZED) {
            stop();
            return;
        }

        audioTrack.play();

        thread = new Thread(() -> renderLoop(isDrone), "LobotomiAudioSynth");
        thread.setDaemon(true);
        thread.start();
    }

    private void renderLoop(boolean isDrone) {
        final int chunkSamples = 1024;
        final short[] pcm = new short[chunkSamples];
        final Random rng = new Random();

        double lastBrown = 0.0;
        double lpBrown = 0.0;
        double phase1 = 0.0;
        double phase2 = 0.0;
        double phase3 = 0.0;
        double lfoPhase = 0.0;
        double fadeGain = 0.0;

        final double twoPi = Math.PI * 2.0;
        final double inc1 = twoPi * 110.0 / SAMPLE_RATE;
        final double inc2 = twoPi * 164.81 / SAMPLE_RATE;
        final double inc3 = twoPi * 220.4 / SAMPLE_RATE;
        final double lfoInc = twoPi * 0.09 / SAMPLE_RATE;

        while (running) {
            for (int i = 0; i < chunkSamples; i++) {
                double targetGain = muted ? 0.0 : 1.0;
                fadeGain += (targetGain - fadeGain) * 0.0025;

                double sample;
                if (isDrone) {
                    double lfo = 0.82 + 0.18 * Math.sin(lfoPhase);
                    sample =
                        (0.55 * Math.sin(phase1) +
                            0.28 * Math.sin(phase2) +
                            0.17 * Math.sin(phase3)) *
                        0.16 *
                        lfo;
                    phase1 = (phase1 + inc1) % twoPi;
                    phase2 = (phase2 + inc2) % twoPi;
                    phase3 = (phase3 + inc3) % twoPi;
                    lfoPhase = (lfoPhase + lfoInc) % twoPi;
                } else {
                    double white = rng.nextDouble() * 2.0 - 1.0;
                    lastBrown = (lastBrown + 0.025 * white) / 1.025;
                    lpBrown = lpBrown + 0.14 * (lastBrown - lpBrown);
                    sample = lpBrown * 1.6;
                }

                double clamped = Math.max(-0.95, Math.min(0.95, sample * fadeGain));
                pcm[i] = (short) (clamped * 32767.0);
            }

            AudioTrack track = audioTrack;
            if (!running || track == null) break;
            try {
                track.write(pcm, 0, chunkSamples);
            } catch (IllegalStateException ignored) {
                break;
            }
        }
    }

    public void setMuted(boolean muted) {
        this.muted = muted;
    }

    public boolean isMuted() {
        return muted;
    }

    public synchronized void stop() {
        running = false;
        Thread t = thread;
        thread = null;
        if (t != null) {
            t.interrupt();
        }
        AudioTrack track = audioTrack;
        audioTrack = null;
        if (track != null) {
            try {
                track.pause();
                track.flush();
                track.release();
            } catch (IllegalStateException ignored) {
            }
        }
    }
}
