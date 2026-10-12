# Full-Length Audio Stream Resolver Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Yoinks Music from 30-second Deezer preview clips to full-length audio playback (3–5+ minutes) using a seamless background YouTube audio stream resolver while keeping Deezer's clean discography, album art, and anti-slop mobile UI intact.

**Architecture:** A native-safe YouTube search resolver extracts the matching `videoId` for any track title + artist using `CapacitorHttp`. An off-screen YouTube Iframe Player Bridge runs in the WebView (with Android `mediaPlaybackRequiresUserGesture(false)`) to play full-length audio, reporting real track durations (e.g. 5:13) and playback state to the existing two-tier vinyl player UI, while keeping HTML5 `<audio>` as a resilient offline/preview fallback.

**Tech Stack:** React 18, TypeScript, Capacitor 6 (`CapacitorHttp`, `@capacitor/preferences`), YouTube IFrame Player API, Android WebView WebSettings, Tailwind CSS, Lucide React.

---

### Task 1: YouTube Search Stream Resolver Service

**Files:**
- Create: `src/services/streamResolver.ts`
- Modify: `src/types/index.ts`
- Test: `tests/streamResolver.test.ts` or standalone verification script

- [x] **Step 1: Update types with stream resolution interfaces**
Add `resolvedVideoId?: string` and stream mode types to `src/types/index.ts`.

- [x] **Step 2: Implement `src/services/streamResolver.ts`**
- Universal query builder: combines `${artist} ${title} audio`.
- Uses `CapacitorHttp.get()` on native Android (zero CORS) with desktop Chrome `User-Agent`.
- Uses `fetch()` fallback in browser environment.
- Extracts candidate `videoId` from YouTube initial data / HTML regex `/"videoId":"([a-zA-Z0-9_-]{11})"/g`.
- Local caching in `@capacitor/preferences` keyed by `stream_${sanitized(artist)}_${sanitized(title)}` for instant O(1) cache hits on repeat plays.
- Defensive error handling returning `null` on network errors or timeouts.

- [x] **Step 3: Verify stream resolver functionality**
Run a node verification script resolving:
- `"John Carpenter"` + `"Primeval"` -> `CVayhgV_oNM`
- `"The Carpenters"` + `"Close to You"` -> `6yUq_-_v4rI`
Confirm fast resolution (< 1.5s).

- [x] **Step 4: Commit stream resolver service**

```bash
git add src/types/index.ts src/services/streamResolver.ts
git commit -m "feat(services): implement full-length YouTube stream resolver with native CORS bypass"
```

---

### Task 2: Native Android WebView Autoplay & Media Permissions

**Files:**
- Modify: `android/app/src/main/java/com/yoinks/music/MainActivity.java`
- Modify: `android/app/src/main/AndroidManifest.xml`

- [x] **Step 1: Configure Android WebView in `MainActivity.java`**
In `MainActivity.java`:
```java
package com.yoinks.music;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebSettings settings = this.bridge.getWebView().getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
        }
    }
}
```
This allows programmatic audio playback in Android WebView without requiring a direct touch inside the iframe.

- [x] **Step 2: Add Android permissions in `AndroidManifest.xml`**
Add `<uses-permission android:name="android.permission.WAKE_LOCK" />` and ensure `android:usesCleartextTraffic="true"` in `<application>`.

- [x] **Step 3: Verify clean Android Gradle compilation**
Run `./gradlew.bat assembleDebug` to verify native Java changes compile with zero errors.

- [x] **Step 4: Commit native Android configuration**

```bash
git add android/app/src/main/java/com/yoinks/music/MainActivity.java android/app/src/main/AndroidManifest.xml
git commit -m "feat(android): enable media playback without user gesture and wake lock"
```

---

### Task 3: Off-Screen YouTube Audio Bridge Component

**Files:**
- Create: `src/components/YouTubeAudioBridge.tsx`
- Modify: `src/components/index.ts`

- [x] **Step 1: Implement `YouTubeAudioBridge.tsx`**
- Loads the official YouTube IFrame API script (`https://www.youtube.com/iframe_api`) once.
- Renders an off-screen container:
  ```tsx
  <div
    id="yt-audio-player-host"
    className="fixed -left-[9999px] -top-[9999px] w-px h-px opacity-0 pointer-events-none"
    aria-hidden="true"
  />
  ```
- Exposes imperative methods via ref or callback props:
  - `loadAndPlay(videoId: string)`
  - `play()`
  - `pause()`
  - `seekTo(seconds: number)`
  - `setVolume(volume0to1: number)`
- Emits events:
  - `onReady()`
  - `onStateChange(state: 'playing' | 'paused' | 'buffering' | 'ended')`
  - `onTimeUpdate(currentTime: number, duration: number)`
  - `onError(error: any)`

- [x] **Step 2: Export `YouTubeAudioBridge` from `src/components/index.ts`**
Export component for integration in root application.

- [x] **Step 3: Verify component compilation with `npm run build`**

- [x] **Step 4: Commit YouTube Audio Bridge**

```bash
git add src/components/YouTubeAudioBridge.tsx src/components/index.ts
git commit -m "feat(player): create off-screen YouTube audio bridge component"
```

---

### Task 4: Root Application Dual-Mode Audio Engine & UI Integration

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/MobileTopHeader.tsx`
- Modify: `src/components/MobilePlayerSheet.tsx`
- Modify: `src/components/MobileDockedPlayer.tsx`

- [x] **Step 1: Integrate Stream Resolver & YouTube Bridge in `src/App.tsx`**
- Mount `<YouTubeAudioBridge>` at root.
- In `handlePlayTrack(track)`:
  - Immediately set `activeTrack` and start resolving `resolveStream(track.title, artistName)`.
  - While resolving, HTML5 `<audio>` can begin Deezer preview instantly so there is 0ms delay.
  - When `videoId` resolves, seamlessly switch playback to full-length YouTube audio bridge and update `duration` to the full song duration (e.g. 5:13).
  - Synchronize pause, resume, seek, volume, and queue auto-advance (`handleNext`).
- If track is an offline local track or stream resolution fails, keep playing HTML5 `<audio>`.

- [x] **Step 2: Update Format Badges in Header & Player Sheet**
- Show `FULL AUDIO` pill (emerald) when playing via full-length stream resolver, or `PREVIEW` (slate) when playing 30s preview.
- Add audio source toggle in Settings: "Full-Length Audio (Stream Resolver)" vs "Fast 30s Previews".

- [x] **Step 3: Verify TypeScript compilation & Vite build**
Run `npm run build` and ensure 0 errors.

- [x] **Step 4: Commit dual-mode audio engine**

```bash
git add src/App.tsx src/components/MobileTopHeader.tsx src/components/MobilePlayerSheet.tsx src/components/MobileDockedPlayer.tsx
git commit -m "feat(app): integrate dual-mode audio engine with full-length streaming and UI indicators"
```

---

### Task 5: End-to-End Build, LDPlayer Verification & Audio Playback

**Files:**
- Modify: `capacitor.config.ts` (if needed)
- Output: `D:\Jiggy_Files\YoinksMusic.apk`

- [x] **Step 1: Build production assets and sync Capacitor**
```bash
npm run build
npx cap sync android
```

- [x] **Step 2: Compile updated debug APK with Gradle**
```powershell
$env:JAVA_HOME = "D:\Jiggy_Files\JDK25"
cd android
.\gradlew.bat assembleDebug
cd ..
Copy-Item "android\app\build\outputs\apk\debug\app-debug.apk" "D:\Jiggy_Files\YoinksMusic.apk" -Force
```

- [x] **Step 3: Install updated APK on LDPlayer**
```powershell
& "D:\Android\Sdk\platform-tools\adb.exe" install -r "D:\Jiggy_Files\YoinksMusic.apk"
```

- [x] **Step 4: Launch and verify live playback in LDPlayer**
- Launch `com.yoinks.music/.MainActivity`.
- Search or select a track (e.g. "Primeval" or "Close to You").
- Verify that the scrubber duration reflects the **full length** (e.g., > 3 to 5 minutes, NOT 0:29).
- Verify audio plays past 30 seconds smoothly in LDPlayer.
- Capture screen verifying full-length player and badges.

- [x] **Step 5: Final Git commit & push**
Push all commits to `https://github.com/jiggy025/yoinks-music.git` on branch `main`.

