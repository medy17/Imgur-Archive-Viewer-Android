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

### Installation

1. Simply download and install the release apk. 

## License

This project is released under the Attribution-NonCommercial 4.0 International License (CC BY-NC-SA). You are free to use, modify, and distribute it as long as appropriate credit is given.

## Acknowledgements

-   A huge thank you to the **[Internet Archive](https://archive.org/)** for providing the public **[CDX Server API](https://github.com/internetarchive/wayback/tree/master/wayback-cdx-server)** that makes this tool possible.
