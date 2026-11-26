package com.lobotomi.app;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GatekeeperPlugin.class);
        super.onCreate(savedInstanceState);
        handleIncomingRoute(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingRoute(intent);
    }

    private void handleIncomingRoute(Intent intent) {
        if (intent == null) return;
        String route = intent.getStringExtra("lobotomi_route");
        if (route != null && !route.isEmpty()) {
            GatekeeperStore.setPendingRoute(this, route);
            GatekeeperPlugin.notifyRoute(route);
            intent.removeExtra("lobotomi_route");
        }
    }
}
