pluginManagement {
    val flutterSdkPath =
        run {
            val properties = java.util.Properties()
            file("local.properties").inputStream().use { properties.load(it) }
            val flutterSdkPath = properties.getProperty("flutter.sdk")
            require(flutterSdkPath != null) { "flutter.sdk not set in local.properties" }
            flutterSdkPath
        }

    includeBuild("$flutterSdkPath/packages/flutter_tools/gradle")

    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

plugins {
    id("dev.flutter.flutter-plugin-loader") version "1.0.0"
    id("com.android.application") version "8.11.1" apply false
    id("org.jetbrains.kotlin.android") version "2.2.20" apply false
}

include(":app")

// Override NDK version for all subprojects so NDK 28 is never requested
gradle.afterProject {
    extensions.findByName("android")?.let { android ->
        try {
            val ndkVersionSetter = android.javaClass.methods.firstOrNull { it.name == "setNdkVersion" && it.parameterCount == 1 }
            ndkVersionSetter?.invoke(android, "25.2.9519653")
        } catch (e: Exception) {}
    }
}
