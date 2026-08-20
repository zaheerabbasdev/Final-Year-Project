import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'socket_service.dart';

/// Provider-side service that streams GPS position and emits coordinates
/// to the backend via Socket.io.
///
/// Uses [Geolocator.getPositionStream] instead of a Timer+getCurrentPosition
/// loop so updates arrive from an already-locked GPS receiver instead of
/// triggering a cold fix every interval.
///
/// A periodic heartbeat re-emits the last known position every
/// [_heartbeatInterval] seconds so that the customer's tracking screen
/// receives an update even when the provider is stationary (i.e. hasn't
/// moved the [distanceFilter] threshold to trigger a new stream event).
class LocationTrackingService extends ChangeNotifier {
  StreamSubscription<Position>? _positionSubscription;
  Timer? _heartbeatTimer;
  Position? _lastPosition;   // last GPS fix — re-emitted by the heartbeat
  SocketService? _socket;    // kept so the heartbeat can reach it

  static const Duration _heartbeatInterval = Duration(seconds: 10);

  bool _isTracking = false;
  int? _activeJobId;
  int? _activeCustomerId;
  String? _lastError;

  bool get isTracking => _isTracking;
  int? get activeJobId => _activeJobId;
  String? get lastError => _lastError;

  /// Begin streaming location to the customer via [socket].
  ///
  /// [distanceFilter] (metres) is the minimum distance the device must move
  /// before a new location is emitted — keeps traffic reasonable without
  /// sacrificing responsiveness.  5 m is a sensible default for on-foot work.
  ///
  /// Returns false (with [lastError] set) if GPS/permissions are unavailable,
  /// so the caller can show feedback instead of silently doing nothing.
  Future<bool> startTracking(
    SocketService socket, {
    required int jobId,
    required int customerId,
    int intervalSeconds = 5,     // retained in signature for API compatibility
    int distanceFilter = 5,      // metres
  }) async {
    if (_isTracking) {
      debugPrint('[LocationTracking] Already tracking, returning');
      return true;
    }

    _lastError = null;

    // ── Permission & service checks ─────────────────────────────────────────
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _lastError =
          'Location services are turned off. Please enable GPS to share your location.';
      notifyListeners();
      return false;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      _lastError =
          'Location permission is required to share your live location with the customer.';
      notifyListeners();
      return false;
    }

    _activeJobId = jobId;
    _activeCustomerId = customerId;
    _socket = socket;
    _isTracking = true;
    notifyListeners();

    debugPrint(
        '[LocationTracking] Started stream for job $jobId → customer $customerId');

    // ── Subscribe to the position stream ────────────────────────────────────
    // distanceFilter avoids flooding the socket when the provider is stationary.
    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: distanceFilter,
      ),
    ).listen(
      (position) {
        _lastPosition = position; // cache for the heartbeat

        debugPrint(
          '[LocationTracking] Stream update: ${position.latitude}, '
          '${position.longitude} for job $_activeJobId',
        );

        socket.emitLocationUpdate(
          jobId: _activeJobId!,
          customerId: _activeCustomerId!,
          latitude: position.latitude,
          longitude: position.longitude,
        );

        if (_lastError != null) {
          _lastError = null;
          notifyListeners();
        }
      },
      onError: (e) {
        debugPrint('[LocationTracking] GPS stream error: $e');
        _lastError = 'Lost GPS signal — retrying…';
        notifyListeners();
      },
      cancelOnError: false, // keep stream alive through transient errors
    );

    // ── Heartbeat timer ──────────────────────────────────────────────────────
    // Re-emits the last GPS fix every [_heartbeatInterval] seconds so the
    // customer's tracking screen stays up-to-date even when the provider is
    // standing still (no movement → no distanceFilter event).
    _heartbeatTimer = Timer.periodic(_heartbeatInterval, (_) {
      final pos = _lastPosition;
      if (pos != null && _isTracking && _socket != null) {
        debugPrint('[LocationTracking] Heartbeat → re-emitting last position');
        _socket!.emitLocationUpdate(
          jobId: _activeJobId!,
          customerId: _activeCustomerId!,
          latitude: pos.latitude,
          longitude: pos.longitude,
        );
      }
    });

    return true;
  }

  /// Stop streaming location and notify the customer.
  void stopTracking({SocketService? socket}) {
    final activeSocket = socket ?? _socket;
    if (activeSocket != null && _activeJobId != null && _activeCustomerId != null) {
      activeSocket.emitLocationStopped(
        jobId: _activeJobId!,
        customerId: _activeCustomerId!,
      );
      debugPrint(
          '[LocationTracking] Sent location_stopped to customer $_activeCustomerId');
    }

    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
    _positionSubscription?.cancel();
    _positionSubscription = null;
    _lastPosition = null;
    _socket = null;
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
