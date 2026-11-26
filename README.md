# Lobotomi

*Interrupt the scroll reflex.*

Lobotomi is a local-first, offline-first digital fasting and dopamine regulation application. All state, timers, audio synthesis, typography, and behavioral logs execute on-device with zero network requests, telemetry, or account infrastructure.

## Core Modules

- **Single-Focus Entry (`Pause`):** Minimalist home surface displaying local time context, today's accumulated quiet minutes, and a single primary action (`Interrupt Urge`).
- **Urge Surfing (3 / 5 Min):** Physiological sigh pacing (`4s` inhale -> `1s` top-up -> `6s` exhale) synchronized with Capacitor Haptics, procedural Web Audio brown/pink noise, inline scratchpad, trigger classification, and pre/post mental noise evaluation (`1–5`).
- **Boredom Fasting (3–45 Min):** Unstructured stillness timer with `@capacitor-community/keep-awake`, `#000000` OLED minimal mode, auto-hiding controls, and a procedural Web Audio singing bowl chime on completion.
- **Implementation Intentions (`Plan`):** Structured `If [trigger], then I will [action]` rule builder paired with an energy- and duration-filtered Low-Dopamine Menu (`Pick 1 for Me`).
- **Stimulation Ledger & Calm Dot Matrix (`Ledger`):** 90-day quiet-minute dot matrix (without streak penalties), 7-day Slow vs. Fast stimulation ratio, mean mental noise shift, and an ephemeral Brain Dump scratchpad supporting immediate erasure or local archiving.
- **Data Sovereignty:** Full JSON backup/restore and Markdown (`.md`) journal export.

## Architecture & Stack

- **UI / State:** Preact, TypeScript, `@preact/signals`, `@radix-ui/react-{dialog,tabs,slider,switch}` via `preact/compat`, `lucide-preact` (`strokeWidth=1.5`), Tailwind CSS v4.
- **Storage:** IndexedDB via `idb` (`sessions`, `rules`, `menuItems`, `ledger`, `dumps`, `meta`).
- **Typography & Audio:** Locally bundled `.woff2` fonts (`Instrument Serif`, `Plus Jakarta Sans`, `JetBrains Mono`) and procedural Web Audio API synthesis (zero external CDNs or audio files).
- **Platforms:** Offline PWA (`vite-plugin-pwa`, Workbox `generateSW`) and Android via Capacitor (`com.lobotomi.app`).

## Local Development

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Cloudflare Pages Deployment

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- SPA routing (`public/_redirects`) and cache/security headers (`public/_headers`) are included in `public/`.

## Android Build (Capacitor)

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

## Automated Signed APK Release

Pushing a tag matching `v*` triggers `.github/workflows/release.yml`, which compiles the web bundle, syncs Capacitor Android, signs `app-release.apk`, and publishes the APK with its `.sha256` checksum to GitHub Releases.

Required repository secrets:

- `ANDROID_KEYSTORE_BASE64`: Base64-encoded PKCS12/JKS release keystore.
- `ANDROID_KEYSTORE_PASSWORD`: Keystore password.
- `ANDROID_KEY_ALIAS`: Signing key alias.
- `ANDROID_KEY_PASSWORD`: Signing key password.

## License

GNU General Public License v3.0 (`GPL-3.0-only`). See [LICENSE](./LICENSE).
