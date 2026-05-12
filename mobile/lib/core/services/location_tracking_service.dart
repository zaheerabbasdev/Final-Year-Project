import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'socket_service.dart';

/// Provider-side service that periodically reads GPS and emits
/// coordinates to the backend via Socket.io.
class LocationTrackingService extends ChangeNotifier {
  Timer? _timer;
  bool _isTracking = false;
  int? _activeJobId;
  int? _activeCustomerId;

  bool get isTracking => _isTracking;
  int? get activeJobId => _activeJobId;

  /// Begin streaming location every [intervalSeconds] seconds.
  void startTracking(
    SocketService socket, {
    required int jobId,
    required int customerId,
    int intervalSeconds = 5,
  }) {
    if (_isTracking) return;

    _activeJobId = jobId;
    _activeCustomerId = customerId;
    _isTracking = true;
    notifyListeners();

    debugPrint('[LocationTracking] Started for job $jobId → customer $customerId');

    // Emit immediately, then on a timer
    _emitOnce(socket);
    _timer = Timer.periodic(Duration(seconds: intervalSeconds), (_) {
      _emitOnce(socket);
    });
  }

  Future<void> _emitOnce(SocketService socket) async {
    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );

      socket.emitLocationUpdate(
        jobId: _activeJobId!,
        customerId: _activeCustomerId!,
        latitude: position.latitude,
        longitude: position.longitude,
      );

      debugPrint(
        '[LocationTracking] Emitted: ${position.latitude}, ${position.longitude}',
      );
    } catch (e) {
      debugPrint('[LocationTracking] GPS error: $e');
    }
  }

  /// Stop streaming location.
  void stopTracking() {
    _timer?.cancel();
    _timer = null;
    _isTracking = false;
    _activeJobId = null;
    _activeCustomerId = null;
    notifyListeners();
    debugPrint('[LocationTracking] Stopped');
  }

  @override
  void dispose() {
    stopTracking();
    super.dispose();
  }
}
