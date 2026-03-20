### Install dependencies

```bash
npm install
```

### Start Metro bundler

```bash
npx react-native start
```

### Run on an emulator or device

```bash
npx react-native run-android
```

> **Physical device over USB?** Run `adb reverse tcp:8081 tcp:8081` first so the device can reach Metro.


## Release Builds

### Local APK

**macOS / Linux:**
```bash
cd android && ./gradlew assembleRelease
```

**Windows (PowerShell):**
```powershell
cd android; .\gradlew.bat assembleRelease
```

The unsigned APK is output to `android/app/build/outputs/apk/release/`.

### GitHub Actions

The workflow at [`.github/workflows/android-builds.yml`](./.github/workflows/android-builds.yml) builds four APK variants:

| Variant       | ABI        |
|---------------|------------|
| Universal     | all        |
| `arm64-v8a`   | 64-bit ARM |
| `armeabi-v7a` | 32-bit ARM |
| `x86_64`      | 64-bit x86 |

**Trigger behaviour:**

| Trigger               | Result                                     |
|-----------------------|--------------------------------------------|
| Push to `main`        | Builds APKs, uploads as workflow artifacts |
| Push tag `v<version>` | Builds APKs + creates a GitHub Release     |
| Manual dispatch       | Builds APKs + creates a GitHub Release     |

The release version is read from `package.json`. The job will fail if the version already has a
published release or if it regresses behind the latest published semver tag.


## Tech Stack

- [React Native](https://reactnative.dev/) 0.80 · [React](https://react.dev/) 19 · TypeScript
- [React Native Paper](https://callstack.github.io/react-native-paper/) — Material Design 3 UI components
- [react-native-fs](https://github.com/itinance/react-native-fs) — filesystem & download API
- [react-native-video](https://github.com/TheWidlarzGroup/react-native-video) — video playback in the gallery
- [react-native-vector-icons](https://github.com/oblador/react-native-vector-icons) — Material Community Icons

