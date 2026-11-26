package com.lobotomi.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "Gatekeeper")
public class GatekeeperPlugin extends Plugin {
    private static final ExecutorService IO_EXECUTOR = Executors.newSingleThreadExecutor();
    private static WeakReference<GatekeeperPlugin> instanceRef = new WeakReference<>(null);

    @Override
    public void load() {
        instanceRef = new WeakReference<>(this);
    }

    public static void notifyRoute(String route) {
        GatekeeperPlugin plugin = instanceRef.get();
        if (plugin != null && route != null && !route.isEmpty()) {
            JSObject payload = new JSObject();
            payload.put("route", route);
            plugin.notifyListeners("gatekeeperRoute", payload);
        }
    }

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        final Context context = getContext().getApplicationContext();
        final String selfPkg = context.getPackageName();

        IO_EXECUTOR.execute(() -> {
            try {
                PackageManager pm = context.getPackageManager();
                Intent mainIntent = new Intent(Intent.ACTION_MAIN, null);
                mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);

                List<ResolveInfo> resolved = pm.queryIntentActivities(mainIntent, 0);
                Set<String> seen = new HashSet<>();
                List<JSObject> items = new ArrayList<>();

                for (ResolveInfo info : resolved) {
                    if (info.activityInfo == null) continue;
                    String pkg = info.activityInfo.packageName;
                    if (pkg == null || pkg.equals(selfPkg) || seen.contains(pkg)) continue;
                    seen.add(pkg);

                    CharSequence labelSeq = info.loadLabel(pm);
                    String appName = labelSeq != null ? labelSeq.toString().trim() : pkg;
                    if (appName.isEmpty()) appName = pkg;

                    String iconBase64 = "";
                    try {
                        Drawable icon = info.loadIcon(pm);
                        iconBase64 = drawableToBase64Png(icon, 48);
                    } catch (Exception ignored) {
                    }

                    JSObject entry = new JSObject();
                    entry.put("packageName", pkg);
                    entry.put("appName", appName);
                    entry.put("icon", iconBase64);
                    items.add(entry);
                }

                Collections.sort(items, (a, b) ->
                    a.optString("appName", "").compareToIgnoreCase(b.optString("appName", ""))
                );

                JSArray array = new JSArray();
                for (JSObject item : items) {
                    array.put(item);
                }
                JSObject result = new JSObject();
                result.put("apps", array);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to query installed apps", e);
            }
        });
    }

    private static String drawableToBase64Png(Drawable drawable, int sizePx) {
        if (drawable == null) return "";
        Bitmap bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        drawable.setBounds(0, 0, sizePx, sizePx);
        drawable.draw(canvas);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 90, out);
        bitmap.recycle();
        return "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
    }

    @PluginMethod
    public void saveGuardedApps(PluginCall call) {
        JSArray apps = call.getArray("apps", new JSArray());
        JSArray prompts = call.getArray("prompts", new JSArray());
        String locale = call.getString("locale", "en");
        String ambientSound = call.getString("ambientSound", "brown");
        Boolean haptics = call.getBoolean("hapticsEnabled", true);

        GatekeeperStore.saveConfig(
            getContext(),
            apps != null ? apps : new JSONArray(),
            prompts != null ? prompts : new JSONArray(),
            locale,
            ambientSound,
            haptics != null ? haptics : true
        );
        call.resolve();
    }

    @PluginMethod
    public void getPermissionStatus(PluginCall call) {
        Context ctx = getContext();
        boolean accessibility = isAccessibilityServiceEnabled(ctx);
        boolean overlay = Settings.canDrawOverlays(ctx);

        JSObject res = new JSObject();
        res.put("accessibility", accessibility);
        res.put("overlay", overlay);
        call.resolve(res);
    }

    @PluginMethod
    public void getDetailedPermissionStatus(PluginCall call) {
        Context ctx = getContext();
        boolean accessibilityEnabled = isAccessibilityServiceEnabled(ctx);
        boolean overlayEnabled = Settings.canDrawOverlays(ctx);
        boolean batteryOptimizationIgnored = false;
        PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            batteryOptimizationIgnored = pm.isIgnoringBatteryOptimizations(ctx.getPackageName());
        }

        JSObject res = new JSObject();
        res.put("accessibilityEnabled", accessibilityEnabled);
        res.put("overlayEnabled", overlayEnabled);
        res.put("batteryOptimizationIgnored", batteryOptimizationIgnored);
        res.put("androidSdkVersion", Build.VERSION.SDK_INT);
        call.resolve(res);
    }

    private static boolean isAccessibilityServiceEnabled(Context context) {
        int enabled = 0;
        try {
            enabled = Settings.Secure.getInt(
                context.getContentResolver(),
                Settings.Secure.ACCESSIBILITY_ENABLED
            );
        } catch (Settings.SettingNotFoundException ignored) {
        }
        if (enabled != 1) return false;

        String services = Settings.Secure.getString(
            context.getContentResolver(),
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        );
        if (services == null || services.isEmpty()) return false;

        ComponentName expected = new ComponentName(context, LobotomiGatekeeperService.class);
        String flatLong = expected.flattenToString();
        String flatShort = expected.flattenToShortString();

        TextUtils.SimpleStringSplitter splitter = new TextUtils.SimpleStringSplitter(':');
        splitter.setString(services);
        while (splitter.hasNext()) {
            String component = splitter.next();
            if (component.equalsIgnoreCase(flatLong) || component.equalsIgnoreCase(flatShort)) {
                return true;
            }
        }
        return false;
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        Intent intent = new Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:" + getContext().getPackageName())
        );
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void openAppDetailsSettings(PluginCall call) {
        Intent intent = new Intent(
            Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
            Uri.parse("package:" + getContext().getPackageName())
        );
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void requestIgnoreBatteryOptimization(PluginCall call) {
        Context ctx = getContext();
        try {
            Intent intent = new Intent(
                Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                Uri.parse("package:" + ctx.getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
        } catch (Exception e) {
            Intent fallback = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(fallback);
        }
        call.resolve();
    }

    @PluginMethod
    public void consumePendingData(PluginCall call) {
        JSONObject data = GatekeeperStore.consumePendingData(getContext());
        JSObject res = new JSObject();
        res.put("events", data.optJSONArray("events"));
        res.put("route", data.optString("route", ""));
        call.resolve(res);
    }
}
