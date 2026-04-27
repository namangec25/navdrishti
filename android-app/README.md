# Navdrishti Android Wrapper

This is an Android application that wraps the Navdrishti web application using a WebView.

## Prerequisites

- Android Studio or Gradle installed
- Java 8 or higher
- Android SDK

## Building the App

1. Ensure the web application is built and assets are copied to `app/src/main/assets/www/`
2. Run `./gradlew build` (on Windows, `gradlew.bat build`)

## Running the App

### Option 1: Using Android Studio (Recommended)
1. Open Android Studio
2. Select "Open" and choose the `android-app` folder
3. Wait for Gradle sync to complete
4. Connect an Android device via USB (enable USB debugging) or start an Android Virtual Device (AVD)
5. Click the "Run" button (green play icon) or press Shift+F10
6. Select your device/emulator and the app will install and launch automatically

### Option 2: Using Command Line
1. Ensure you have Android Debug Bridge (ADB) installed and in your PATH
2. Build the app: `./gradlew assembleDebug` (Windows: `gradlew.bat assembleDebug`)
3. Connect an Android device or start an emulator
4. Install the APK: `adb install app/build/outputs/apk/debug/app-debug.apk`
5. Launch the app: `adb shell am start -n com.example.navdrishti/.MainActivity`

### Prerequisites for Running
- Android device with USB debugging enabled, or
- Android Virtual Device (AVD) created in Android Studio
- For command line: ADB tools installed

The app will load the web application from local assets and display it in a full-screen WebView.

## Notes

- The web app is served locally from assets, so no internet connection is required for the UI
- If the web app needs to connect to the server, ensure the server is running separately or modify the app to include server functionality