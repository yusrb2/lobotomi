package com.lobotomi.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public final class GatekeeperStore {
    private static final String PREFS_NAME = "lobotomi_gatekeeper";
    private static final String KEY_GUARDED_APPS = "guarded_apps";
    private static final String KEY_PROMPTS = "prompts";
    private static final String KEY_LOCALE = "locale";
    private static final String KEY_AMBIENT_SOUND = "ambient_sound";
    private static final String KEY_HAPTICS = "haptics_enabled";
    private static final String KEY_GRACE_PREFIX = "grace_until_";
    private static final String KEY_LAST_PKG = "last_intercept_pkg";
    private static final String KEY_LAST_TS = "last_intercept_ts";
    private static final String KEY_PENDING_EVENTS = "pending_events";
    private static final String KEY_PENDING_ROUTE = "pending_route";

    private GatekeeperStore() {}

    public static final class GuardedApp {
        public final String packageName;
        public final String appName;
        public final int delaySeconds;
        public final int graceMinutes;

        public GuardedApp(String packageName, String appName, int delaySeconds, int graceMinutes) {
            this.packageName = packageName;
            this.appName = appName;
            this.delaySeconds = delaySeconds;
            this.graceMinutes = graceMinutes;
        }
    }

    private static SharedPreferences prefs(Context context) {
        return context.getApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public static synchronized void saveConfig(
        Context context,
        JSONArray apps,
        JSONArray prompts,
        String locale,
        String ambientSound,
        boolean hapticsEnabled
    ) {
        SharedPreferences.Editor editor = prefs(context).edit();
        editor.putString(KEY_GUARDED_APPS, apps != null ? apps.toString() : "[]");
        editor.putString(KEY_PROMPTS, prompts != null ? prompts.toString() : "[]");
        editor.putString(KEY_LOCALE, "id".equals(locale) ? "id" : "en");
        if ("drone".equals(ambientSound) || "silent".equals(ambientSound)) {
            editor.putString(KEY_AMBIENT_SOUND, ambientSound);
        } else {
            editor.putString(KEY_AMBIENT_SOUND, "brown");
        }
        editor.putBoolean(KEY_HAPTICS, hapticsEnabled);
        editor.apply();
    }

    public static GuardedApp getGuardedApp(Context context, String packageName) {
        if (packageName == null || packageName.isEmpty()) return null;
        String raw = prefs(context).getString(KEY_GUARDED_APPS, "[]");
        try {
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.optJSONObject(i);
                if (obj == null) continue;
                if (packageName.equals(obj.optString("packageName"))) {
                    String appName = obj.optString("appName", packageName);
                    int delay = obj.optInt("delaySeconds", 180);
                    int grace = obj.optInt("graceMinutes", 15);
                    return new GuardedApp(
                        packageName,
                        appName,
                        delay == 300 ? 300 : 180,
                        Math.max(1, Math.min(120, grace))
                    );
                }
            }
        } catch (JSONException ignored) {
        }
        return null;
    }

    public static List<String> getPrompts(Context context) {
        List<String> list = new ArrayList<>();
        String raw = prefs(context).getString(KEY_PROMPTS, "[]");
        try {
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) {
                String text = arr.optString(i, "").trim();
                if (!text.isEmpty()) list.add(text);
            }
        } catch (JSONException ignored) {
        }
        return list;
    }

    public static String getLocale(Context context) {
        return prefs(context).getString(KEY_LOCALE, "en");
    }

    public static String getAmbientSound(Context context) {
        return prefs(context).getString(KEY_AMBIENT_SOUND, "brown");
    }

    public static boolean isHapticsEnabled(Context context) {
        return prefs(context).getBoolean(KEY_HAPTICS, true);
    }

    public static boolean isWithinGracePeriod(Context context, String packageName) {
        long until = prefs(context).getLong(KEY_GRACE_PREFIX + packageName, 0L);
        return System.currentTimeMillis() < until;
    }

    public static void grantGracePeriod(Context context, String packageName, int graceMinutes) {
        long until = System.currentTimeMillis() + (long) graceMinutes * 60_000L;
        prefs(context).edit().putLong(KEY_GRACE_PREFIX + packageName, until).apply();
    }

    public static synchronized boolean shouldDebounce(Context context, String packageName) {
        SharedPreferences p = prefs(context);
        String lastPkg = p.getString(KEY_LAST_PKG, "");
        long lastTs = p.getLong(KEY_LAST_TS, 0L);
        long now = System.currentTimeMillis();
        if (packageName.equals(lastPkg) && (now - lastTs) < 2500L) {
            return true;
        }
        p.edit().putString(KEY_LAST_PKG, packageName).putLong(KEY_LAST_TS, now).apply();
        return false;
    }

    public static synchronized void appendPendingEvent(
        Context context,
        String id,
        String packageName,
        String appName,
        long startedAt,
        long endedAt,
        int plannedSeconds,
        int actualSeconds,
        String outcome
    ) {
        SharedPreferences p = prefs(context);
        String raw = p.getString(KEY_PENDING_EVENTS, "[]");
        try {
            JSONArray arr = new JSONArray(raw);
            JSONObject obj = new JSONObject();
            obj.put("id", id);
            obj.put("packageName", packageName);
            obj.put("appName", appName);
            obj.put("startedAt", startedAt);
            obj.put("endedAt", endedAt);
            obj.put("plannedSeconds", plannedSeconds);
            obj.put("actualSeconds", actualSeconds);
            obj.put("outcome", outcome);
            arr.put(obj);
            p.edit().putString(KEY_PENDING_EVENTS, arr.toString()).apply();
        } catch (JSONException ignored) {
        }
    }

    public static synchronized void setPendingRoute(Context context, String route) {
        prefs(context).edit().putString(KEY_PENDING_ROUTE, route == null ? "" : route).apply();
    }

    public static synchronized JSONObject consumePendingData(Context context) {
        SharedPreferences p = prefs(context);
        String eventsRaw = p.getString(KEY_PENDING_EVENTS, "[]");
        String route = p.getString(KEY_PENDING_ROUTE, "");
        p.edit().putString(KEY_PENDING_EVENTS, "[]").putString(KEY_PENDING_ROUTE, "").apply();

        JSONObject result = new JSONObject();
        try {
            result.put("events", new JSONArray(eventsRaw));
            result.put("route", route);
        } catch (JSONException e) {
            try {
                result.put("events", new JSONArray());
                result.put("route", "");
            } catch (JSONException ignored) {
            }
        }
        return result;
    }
}
