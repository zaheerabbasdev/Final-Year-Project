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
    if (_isTracking) {
      debugPrint('[LocationTracking] Already tracking, returning');
      return;
    }

    _activeJobId = jobId;
    _activeCustomerId = customerId;
    _isTracking = true;
    notifyListeners();

    debugPrint('[LocationTracking] Started for job $jobId → customer $customerId');

    // Emit immediately (socket should be ready at this point)
    _emitOnce(socket);
    
    // Then emit on a timer
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

      debugPrint(
        '[LocationTracking] Emitting location: ${position.latitude}, ${position.longitude} for jobId: $_activeJobId, customerId: $_activeCustomerId',
      );

      socket.emitLocationUpdate(
        jobId: _activeJobId!,
        customerId: _activeCustomerId!,
        latitude: position.latitude,
        longitude: position.longitude,
      );

      debugPrint(
        '[LocationTracking] Emitted successfully',
      );
    } catch (e) {
      debugPrint('[LocationTracking] GPS error: $e');
    }
  }

  /// Stop streaming location.
  void stopTracking({SocketService? socket}) {
    // Notify customer that location sharing has stopped
    if (socket != null && _activeJobId != null && _activeCustomerId != null) {
      socket.emitLocationStopped(
        jobId: _activeJobId!,
        customerId: _activeCustomerId!,
      );
      debugPrint('[LocationTracking] Sent location_stopped event to customer $_activeCustomerId');
    }

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
