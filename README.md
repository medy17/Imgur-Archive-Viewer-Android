# Imgur Archive for Android

A native Android application to find and download archived images and videos from Imgur using the Internet Archive's Wayback Machine.

This project is a complete port and enhancement of an original Python/Tkinter desktop application, rebuilt from the ground up using React Native.


<img src="https://i.imgur.com/waFvp2l.png" alt="Alt text" width="360px" height="<height>">

## Features

-   **Flexible Input**: Download using a full Imgur URL or just the image ID (e.g., `aBXkg.jpg`).
-   **Single & Batch Mode**: Download a single file or provide a `.txt` file for batch processing.
-   **Best Quality Search**: An optional mode to prioritise finding video formats (`.mp4`, `.webm`) over static image thumbnails.
-   **Smart File Naming**: Automatically detects the correct file type (`.gif`, `.png`, etc.) from server headers and saves with the proper extension.
-   **Media Preview**: Displays a preview of the last downloaded image.
-   **Modern UI**: A clean, tab-based interface for easy navigation.

## Tech Stack

-   **Framework**: React Native
-   **Language**: TypeScript
-   **Navigation**: React Navigation (Material Top Tabs)
-   **File System**: `react-native-fs`
-   **File Picking**: `react-native-file-picker`
-   **File Viewing**: `react-native-file-viewer`

## How to Use

1. **Install the APK:**  
   Download and install the latest APK from [Releases](https://github.com/medy17/Imgur-Archive-Viewer-Android/releases).

2. **Single Download:**  
   - Enter an Imgur URL or just the image ID (e.g. `abc123` or `abc123.jpg`).
   - Tap **Download**.

3. **Batch Download:**  
   - Prepare a `.txt` file with one Imgur URL or ID per line.
   - Use the **Batch** tab to select your file and start downloading.

4. **Best Quality Mode:**  
   - Toggle the switch at the top to prioritise videos and high-res images.

5. **View Results:**  
   - Use the **Open Last File** button to view your most recent download.
   - Preview images directly in the app.

## Building from Source

1. **Clone the repository:**
```bash
git clone https://github.com/medy17/Imgur-Archive-Viewer-Android.git
cd Imgur-Archive-Viewer-Android
```

2. **Install dependencies:**  
```
npm install
```

3. **Run on Android:**
	- Start an emulator in Android Studio via Device Manager.
	- Run in the sidebar terminal:
```
npx react-native run-android
```

4. Build a release APK:
```
cd android
./gradlew assembleRelease
```
### Installation

1. Simply download and install the latest version from [releases](https://github.com/medy17/Imgur-Archive-Viewer-Android/releases). 

## License

This project is released under the Attribution-NonCommercial 4.0 International License (CC BY-NC-SA). You are free to use, modify, and distribute it as long as appropriate credit is given. Limited to non-commercial use. Read the included License in this repo for clarification.

## Acknowledgements

-   A huge thank you to the **[Internet Archive](https://archive.org/)** for providing the public **[CDX Server API](https://github.com/internetarchive/wayback/tree/master/wayback-cdx-server)** that makes this tool possible.
