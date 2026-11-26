package com.lobotomi.app;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.view.View;
import android.view.animation.PathInterpolator;
import android.widget.Button;
import android.widget.TextView;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import java.util.List;
import java.util.Locale;
import java.util.Random;
import java.util.UUID;

public class GatekeeperInterceptionActivity extends AppCompatActivity {
    public static final String EXTRA_PACKAGE_NAME = "gk_package_name";
    public static final String EXTRA_APP_NAME = "gk_app_name";
    public static final String EXTRA_DELAY_SECONDS = "gk_delay_seconds";
    public static final String EXTRA_GRACE_MINUTES = "gk_grace_minutes";

    public static volatile boolean isVisible = false;
    public static volatile String activePackage = "";

    private static final String[] REFLECTIONS_EN = {
        "Your thumb moved faster than your brain again. Take a breath first.",
        "Nothing inside this feed needs you in the next three minutes.",
        "Let the itch crest and settle like steam off warm tea.",
        "Boredom is just quiet air. You do not have to fill it right away.",
    };

    private static final String[] REFLECTIONS_ID = {
        "Jempolmu gerak lebih cepat dari pikiranmu lagi, ya? Sebentar, tarik napas dulu.",
        "Tidak ada hal mendesak di dalam feed dalam tiga menit ke depan.",
        "Biarkan dorongannya surut pelan, seperti uap teh hangat yang menghilang.",
        "Rasa bosan cuma ruang kosong yang tenang—tidak harus langsung diisi.",
    };

    private String targetPackage = "";
    private String targetAppName = "";
    private int delaySeconds = 180;
    private int graceMinutes = 15;
    private boolean isIndonesian = false;
    private boolean hapticsEnabled = true;

    private long startedWallMs = 0L;
    private long startedElapsedMs = 0L;
    private int lastBreathPhase = -1;
    private boolean unlocked = false;

    private TextView timerView;
    private TextView breathLabelView;
    private BreathRingView breathRingView;
    private Button muteBtn;
    private Button slowBtn;
    private Button continueBtn;

    private final GatekeeperAudioSynthesizer audioSynth = new GatekeeperAudioSynthesizer();
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final PathInterpolator tactileCurve = new PathInterpolator(0.22f, 1f, 0.36f, 1f);

    public static boolean isShowingFor(String pkg) {
        return isVisible && pkg != null && pkg.equals(activePackage);
    }

    private final Runnable tickRunnable = new Runnable() {
        @Override
        public void run() {
            updateCountdownAndBreath();
            if (isVisible) {
                handler.postDelayed(this, 32L);
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_gatekeeper_interception);

        Intent intent = getIntent();
        targetPackage = intent.getStringExtra(EXTRA_PACKAGE_NAME);
        if (targetPackage == null) targetPackage = "";
        targetAppName = intent.getStringExtra(EXTRA_APP_NAME);
        if (targetAppName == null || targetAppName.isEmpty()) targetAppName = "App";
        delaySeconds = intent.getIntExtra(EXTRA_DELAY_SECONDS, 180);
        if (delaySeconds != 300) delaySeconds = 180;
        graceMinutes = Math.max(1, intent.getIntExtra(EXTRA_GRACE_MINUTES, 15));

        isIndonesian = "id".equals(GatekeeperStore.getLocale(this));
        hapticsEnabled = GatekeeperStore.isHapticsEnabled(this);

        View root = findViewById(R.id.gatekeeper_root);
        final int baseLeft = root.getPaddingLeft();
        final int baseTop = root.getPaddingTop();
        final int baseRight = root.getPaddingRight();
        final int baseBottom = root.getPaddingBottom();
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(
                baseLeft + bars.left,
                baseTop + bars.top,
                baseRight + bars.right,
                baseBottom + bars.bottom
            );
            return insets;
        });

        TextView eyebrowView = findViewById(R.id.gk_eyebrow);
        TextView titleView = findViewById(R.id.gk_title);
        TextView promptLabelView = findViewById(R.id.gk_prompt_label);
        TextView promptTextView = findViewById(R.id.gk_prompt_text);
        timerView = findViewById(R.id.gk_timer);
        breathLabelView = findViewById(R.id.gk_breath_label);
        breathRingView = findViewById(R.id.gk_breath_ring);
        muteBtn = findViewById(R.id.gk_mute_btn);
        slowBtn = findViewById(R.id.gk_slow_btn);
        continueBtn = findViewById(R.id.gk_continue_btn);

        timerView.setFontFeatureSettings("tnum");

        eyebrowView.setText(isIndonesian ? "LOBOTOMI · JEDA TEH" : "LOBOTOMI · TEA BREAK");
        titleView.setText(
            isIndonesian
                ? "Sebentar, tarik napas sebelum buka " + targetAppName
                : "Hey, pause for a sec before " + targetAppName
        );
        slowBtn.setText(
            isIndonesian
                ? "Taruh Ponsel & Cari Aktivitas Santai"
                : "Put It Down & Do Something Slow"
        );

        String chosenPrompt = pickPrompt();
        promptLabelView.setText(isIndonesian ? "CATATAN KECIL" : "A SMALL NOTE");
        promptTextView.setText(chosenPrompt);

        String soundMode = GatekeeperStore.getAmbientSound(this);
        audioSynth.start(soundMode);
        updateMuteButtonText();

        muteBtn.setOnClickListener(v -> {
            if ("silent".equals(soundMode)) {
                return;
            }
            audioSynth.setMuted(!audioSynth.isMuted());
            updateMuteButtonText();
        });
        if ("silent".equals(soundMode)) {
            muteBtn.setText(isIndonesian ? "SENYAP" : "SILENT");
            muteBtn.setEnabled(false);
            muteBtn.setAlpha(0.55f);
        }

        slowBtn.setOnClickListener(v -> onPutItDown());
        continueBtn.setOnClickListener(v -> onContinueToTarget());

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                goHomeAndClose();
            }
        });

        startedWallMs = System.currentTimeMillis();
        startedElapsedMs = SystemClock.elapsedRealtime();
        activePackage = targetPackage;
        isVisible = true;
        updateCountdownAndBreath();
        handler.post(tickRunnable);
    }

    private String pickPrompt() {
        List<String> rules = GatekeeperStore.getPrompts(this);
        Random rng = new Random();
        if (!rules.isEmpty()) {
            return rules.get(rng.nextInt(rules.size()));
        }
        String[] pool = isIndonesian ? REFLECTIONS_ID : REFLECTIONS_EN;
        return pool[rng.nextInt(pool.length)];
    }

    private void updateMuteButtonText() {
        if (audioSynth.isMuted()) {
            muteBtn.setText(isIndonesian ? "NYALAKAN" : "UNMUTE");
        } else {
            muteBtn.setText(isIndonesian ? "BISUKAN" : "MUTE");
        }
    }

    private void updateCountdownAndBreath() {
        long elapsedMs = SystemClock.elapsedRealtime() - startedElapsedMs;
        long totalMs = (long) delaySeconds * 1000L;
        long remainingMs = Math.max(0L, totalMs - elapsedMs);
        int remainingSec = (int) Math.ceil(remainingMs / 1000.0);

        timerView.setText(formatClock(remainingSec));

        double elapsedSec = elapsedMs / 1000.0;
        double cycleSec = elapsedSec % 11.0;
        int phase;
        float scale;
        if (cycleSec < 4.0) {
            phase = 0;
            float t = tactileCurve.getInterpolation((float) (cycleSec / 4.0));
            scale = 0.62f + t * 0.24f;
        } else if (cycleSec < 5.0) {
            phase = 1;
            float t = tactileCurve.getInterpolation((float) (cycleSec - 4.0));
            scale = 0.86f + t * 0.14f;
        } else {
            phase = 2;
            float t = tactileCurve.getInterpolation((float) ((cycleSec - 5.0) / 6.0));
            scale = 1.0f - t * 0.38f;
        }

        breathRingView.setProgressScale(scale, (float) (elapsedSec * 0.85));

        if (phase != lastBreathPhase) {
            lastBreathPhase = phase;
            if (phase == 0) {
                breathLabelView.setText(isIndonesian ? "Tarik napas pelan" : "Breathe in gently");
                pulseHaptic(false);
            } else if (phase == 1) {
                breathLabelView.setText(
                    isIndonesian ? "Tambah sedikit lagi" : "One tiny sip of air"
                );
                pulseHaptic(true);
            } else {
                breathLabelView.setText(
                    isIndonesian ? "Hembuskan santai" : "Let it all out slowly"
                );
                pulseHaptic(false);
            }
        }

        if (remainingMs <= 0L && !unlocked) {
            unlocked = true;
            continueBtn.setEnabled(true);
            continueBtn.setTextColor(0xFFEDE4D7);
            continueBtn.setText(
                isIndonesian ? "Lanjut buka " + targetAppName : "Continue to " + targetAppName
            );
            pulseHaptic(true);
        } else if (!unlocked) {
            String clock = formatClock(remainingSec);
            continueBtn.setEnabled(false);
            continueBtn.setTextColor(0xFF6E6257);
            continueBtn.setText(
                isIndonesian
                    ? "Lanjut buka " + targetAppName + " (" + clock + ")"
                    : "Continue to " + targetAppName + " (" + clock + ")"
            );
        }
    }

    private void pulseHaptic(boolean strong) {
        if (!hapticsEnabled) return;
        try {
            Vibrator vibrator;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager vm = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                vibrator = vm != null ? vm.getDefaultVibrator() : null;
            } else {
                vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            }
            if (vibrator == null || !vibrator.hasVibrator()) return;
            long ms = strong ? 22L : 12L;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createOneShot(ms, strong ? 90 : 45));
            } else {
                vibrator.vibrate(ms);
            }
        } catch (Exception ignored) {
        }
    }

    private void onPutItDown() {
        recordEvent("diverted");
        GatekeeperStore.setPendingRoute(this, "slow_menu");
        audioSynth.stop();
        isVisible = false;
        activePackage = "";

        Intent home = new Intent(Intent.ACTION_MAIN);
        home.addCategory(Intent.CATEGORY_HOME);
        home.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(home);

        Intent lobotomi = new Intent(this, MainActivity.class);
        lobotomi.putExtra("lobotomi_route", "slow_menu");
        lobotomi.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK |
            Intent.FLAG_ACTIVITY_CLEAR_TOP |
            Intent.FLAG_ACTIVITY_SINGLE_TOP
        );
        startActivity(lobotomi);
        finishAndRemoveTask();
    }

    private void onContinueToTarget() {
        if (!unlocked) return;
        GatekeeperStore.grantGracePeriod(this, targetPackage, graceMinutes);
        recordEvent("continued");
        audioSynth.stop();
        isVisible = false;
        activePackage = "";
        finish();
    }

    private void goHomeAndClose() {
        audioSynth.stop();
        isVisible = false;
        activePackage = "";
        Intent home = new Intent(Intent.ACTION_MAIN);
        home.addCategory(Intent.CATEGORY_HOME);
        home.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(home);
        finishAndRemoveTask();
    }

    private void recordEvent(String outcome) {
        long now = System.currentTimeMillis();
        int actualSeconds = Math.max(
            1,
            Math.min(delaySeconds, (int) Math.round((SystemClock.elapsedRealtime() - startedElapsedMs) / 1000.0))
        );
        GatekeeperStore.appendPendingEvent(
            this,
            "gk-" + UUID.randomUUID().toString(),
            targetPackage,
            targetAppName,
            startedWallMs > 0 ? startedWallMs : now - actualSeconds * 1000L,
            now,
            delaySeconds,
            actualSeconds,
            outcome
        );
    }

    private static String formatClock(int totalSec) {
        int s = Math.max(0, totalSec);
        int m = s / 60;
        int r = s % 60;
        return String.format(Locale.US, "%02d:%02d", m, r);
    }

    @Override
    protected void onPause() {
        super.onPause();
        audioSynth.setMuted(true);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (!"silent".equals(GatekeeperStore.getAmbientSound(this))) {
            audioSynth.setMuted(false);
            updateMuteButtonText();
        }
    }

    @Override
    protected void onDestroy() {
        isVisible = false;
        activePackage = "";
        handler.removeCallbacks(tickRunnable);
        audioSynth.stop();
        super.onDestroy();
    }
}
