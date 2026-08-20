import 'dart:async';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:geolocator/geolocator.dart';

// ── Background isolate entry point ────────────────────────────────────────────
// @pragma('vm:entry-point') prevents the Dart compiler from tree-shaking this
// function.  flutter_foreground_task calls it when the Android foreground
// service starts its background Dart isolate.
@pragma('vm:entry-point')
void startLocationCallback() {
  FlutterForegroundTask.setTaskHandler(LocationForegroundHandler());
}

// ── Task handler ─────────────────────────────────────────────────────────────
// Runs inside the Android foreground service's background Dart isolate.
// Because the OS treats the process as a foreground process (persistent
// notification is shown), Android will not pause or kill this isolate even
// when the provider locks their screen.
//
// GPS stream fires on movement ≥ 3 m (distanceFilter).
// onRepeatEvent fires every 4 s and re-sends the last known position so the
// customer's map stays live even when the provider is stationary.
class LocationForegroundHandler extends TaskHandler {
  StreamSubscription<Position>? _posSub;
  double? _lastLat;
  double? _lastLng;

  @override
  Future<void> onStart(DateTime timestamp, TaskStarter starter) async {
    _posSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 3, // metres — ignores GPS jitter, fires on real movement
      ),
    ).listen((pos) {
      _lastLat = pos.latitude;
      _lastLng = pos.longitude;

      // Immediately relay the new position to the main isolate
      FlutterForegroundTask.sendDataToMain({
        'type': 'position',
        'lat': pos.latitude,
        'lng': pos.longitude,
      });

      // Keep the persistent notification text fresh so the provider can
      // see their coordinates without opening the app
      FlutterForegroundTask.updateService(
        notificationText:
            '📍 ${pos.latitude.toStringAsFixed(4)}, ${pos.longitude.toStringAsFixed(4)}',
      );
    });
  }

  // Called every 4 000 ms by ForegroundTaskOptions.eventAction.
  // This is the heartbeat: re-sends the last GPS fix so the customer's tracking
  // screen receives a position update even if the provider hasn't moved 3 m
  // since the last stream event (standing at a door, stuck in traffic, etc.).
  @override
  void onRepeatEvent(DateTime timestamp) {
    final lat = _lastLat;
    final lng = _lastLng;
    if (lat == null || lng == null) return;

    FlutterForegroundTask.sendDataToMain({
      'type': 'heartbeat',
      'lat': lat,
      'lng': lng,
    });
  }

  @override
  Future<void> onDestroy(DateTime timestamp) async {
    await _posSub?.cancel();
    _posSub = null;
  }
}
