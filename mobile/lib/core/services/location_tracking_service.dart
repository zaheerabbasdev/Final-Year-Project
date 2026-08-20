import 'package:flutter/material.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:geolocator/geolocator.dart';
import 'socket_service.dart';
import 'foreground_location_task.dart';

/// Provider-side service that obtains GPS position via an Android foreground
/// service and relays coordinates to the customer through Socket.IO.
///
/// Architecture
/// ────────────
/// All GPS work runs inside [LocationForegroundHandler], which lives in the
/// Android foreground service's background Dart isolate.  That isolate stays
/// alive even when the provider locks their screen because the OS treats any
/// process with an active foreground service as a foreground process.
///
///   Background isolate (foreground service)
///     GPS stream (distanceFilter 3 m) ─► sendDataToMain({'lat','lng'})
///     onRepeatEvent every 4 s ──────────► sendDataToMain({'type':'heartbeat'})
///
///   Main isolate
///     _onReceiveTaskData ──────────────► socket.emitLocationUpdate()
///
/// The heartbeat covers the stationary case: when the provider hasn't moved
/// 3 m since the last stream event (standing at a door, waiting in traffic),
/// the customer's map still receives a position update every 4 seconds.
class LocationTrackingService extends ChangeNotifier {
  bool _isTracking = false;
  int? _activeJobId;
  int? _activeCustomerId;
  String? _lastError;
  SocketService? _socket;

  bool get isTracking => _isTracking;
  int? get activeJobId => _activeJobId;
  String? get lastError => _lastError;

  // ── One-time app-level init ────────────────────────────────────────────────

  /// Call once from [main] before [runApp] so the IPC communication port is
  /// registered before any foreground service can send data, and the Android
  /// notification channel is configured.
  static void initForegroundTask() {
    FlutterForegroundTask.initCommunicationPort();
    FlutterForegroundTask.init(
      androidNotificationOptions: AndroidNotificationOptions(
        channelId: 'kaarkun_location_channel',
        channelName: 'Kaarkun Location',
        channelImportance: NotificationChannelImportance.LOW,
        priority: NotificationPriority.LOW,
      ),
      iosNotificationOptions: const IOSNotificationOptions(
        showNotification: false,
        playSound: false,
      ),
      foregroundTaskOptions: ForegroundTaskOptions(
        eventAction: ForegroundTaskEventAction.repeat(4000), // 4 s heartbeat
        autoRunOnBoot: false,
      ),
    );
  }

  // ── Start / stop ───────────────────────────────────────────────────────────

  /// Begin GPS tracking and notify the customer via [socket].
  ///
  /// Starts the Android foreground service so the process survives a locked
  /// screen, registers the IPC data callback, then returns.  GPS events
  /// and heartbeats arrive asynchronously via [_onReceiveTaskData].
  Future<bool> startTracking(
    SocketService socket, {
    required int jobId,
    required int customerId,
    int intervalSeconds = 5,  // kept for API compatibility — unused
    int distanceFilter = 3,   // hardcoded in foreground_location_task.dart
  }) async {
    if (_isTracking) return true;
    _lastError = null;

    // ── Permission & service checks ────────────────────────────────────────
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _lastError = 'Location services are off. Please enable GPS.';
      notifyListeners();
      return false;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      _lastError = 'Location permission is required to share your live location.';
      notifyListeners();
      return false;
    }

    _activeJobId    = jobId;
    _activeCustomerId = customerId;
    _socket         = socket;
    _isTracking     = true;
    notifyListeners();

    // Register callback BEFORE starting the service so no position events
    // are missed between service start and callback registration.
    FlutterForegroundTask.addTaskDataCallback(_onReceiveTaskData);

    // Start the foreground service.  This creates the persistent notification
    // ("Kaarkun is sharing your location") and launches the background isolate
    // that runs LocationForegroundHandler and opens the GPS stream.
    await FlutterForegroundTask.startService(
      notificationTitle: 'Kaarkun',
      notificationText: 'Sharing your location with the customer...',
      callback: startLocationCallback,
    );

    debugPrint('[LocationTracking] Foreground service started — '
        'job $jobId → customer $customerId');
    return true;
  }

  /// Receives position and heartbeat data from the foreground task isolate
  /// and relays them to the customer via Socket.IO.
  void _onReceiveTaskData(dynamic data) {
    if (data is! Map) return;
    final lat = (data['lat'] as num?)?.toDouble();
    final lng = (data['lng'] as num?)?.toDouble();
    if (lat == null || lng == null || !_isTracking || _socket == null) return;

    debugPrint('[LocationTracking] ${data['type'] ?? 'position'}: $lat, $lng');

    _socket!.emitLocationUpdate(
      jobId:      _activeJobId!,
      customerId: _activeCustomerId!,
      latitude:   lat,
      longitude:  lng,
    );
  }

  /// Stop sharing location, notify the customer that tracking has ended,
  /// and tear down the foreground service.
  void stopTracking({SocketService? socket}) {
    final activeSocket = socket ?? _socket;
    if (activeSocket != null &&
        _activeJobId != null &&
        _activeCustomerId != null) {
      activeSocket.emitLocationStopped(
        jobId:      _activeJobId!,
        customerId: _activeCustomerId!,
      );
      debugPrint('[LocationTracking] Sent location_stopped to customer '
          '$_activeCustomerId');
    }

    FlutterForegroundTask.removeTaskDataCallback(_onReceiveTaskData);
    FlutterForegroundTask.stopService();

    _isTracking       = false;
    _activeJobId      = null;
    _activeCustomerId = null;
    _socket           = null;
    _lastError        = null;
    notifyListeners();
    debugPrint('[LocationTracking] Stopped, foreground service stopped');
  }

  @override
  void dispose() {
    if (_isTracking) stopTracking();
    super.dispose();
  }
}
