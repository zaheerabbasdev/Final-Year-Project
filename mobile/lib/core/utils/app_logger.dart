import 'package:flutter/foundation.dart';

/// Debug-only logging — compiled out of release builds so request/response
/// payloads, tokens, and location data are never written to device logs in
/// production.
void logDebug(Object? message) {
  if (kDebugMode) {
    // ignore: avoid_print
    print(message);
  }
}
