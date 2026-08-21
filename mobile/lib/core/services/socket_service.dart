import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../api_client.dart';
import '../utils/token_storage.dart';
import '../utils/app_logger.dart';
import 'notification_service.dart';
import '../../features/chat/providers/chat_provider.dart';
import '../../features/chat/models/chat_message.dart';


class SocketService {
  IO.Socket? _socket;
  final NotificationService _notificationService;
  final ChatProvider _chatProvider;

  // Stored so we can re-emit join_room after reconnect
  dynamic _lastUserId;

  // Prevents duplicate socket creation (build() is called on every rebuild)
  bool _isCreating = false;

  // Location tracking callbacks
  Function(Map<String, dynamic>)? _onProviderLocation;
  Function(Map<String, dynamic>)? _onProviderLocationStopped;

  SocketService(this._notificationService, this._chatProvider) {
    _chatProvider.onEmitTyping = (data) => _socket?.emit('typing', data);
    _chatProvider.onEmitStopTyping = (data) => _socket?.emit('stop_typing', data);
  }

  bool get isConnected => _socket?.connected == true;

  void connect(dynamic userId) {
    // Normalise to int to avoid "user_1.0" room names
    if (userId is double) {
      userId = userId.toInt();
    } else if (userId is String) {
      userId = int.tryParse(userId) ?? userId;
    }

    _lastUserId = userId;
    logDebug('SocketService.connect called with userId: $userId (type: ${userId.runtimeType})');

    if (_socket != null && _socket!.connected) {
      // Already up — just re-join the room (safe to call repeatedly)
      logDebug('Socket already connected, re-emitting join_room');
      _socket!.emit('join_room', userId);
      return;
    }

    if (_socket != null && !_socket!.connected) {
      // Socket exists but is in the middle of socket.io's own reconnection
      // back-off loop.  Do NOT touch it — onConnect will fire when ready.
      logDebug('Socket reconnecting via built-in retry — will join_room on connect');
      return;
    }

    // _socket == null: first connection or after an explicit disconnect()
    if (_isCreating) {
      logDebug('Socket creation already in progress — skipping duplicate');
      return;
    }

    _isCreating = true;
    TokenStorage.getToken().then((token) => _createSocket(token));
  }

  void _createSocket(String? token) {
    _isCreating = false;
    if (_socket != null) return; // lost the race to another call

    final serverUrl = ApiClient.baseUrl.replaceAll('/api', '');
    logDebug('Creating socket → $serverUrl');

    _socket = IO.io(serverUrl, <String, dynamic>{
      // The ALB routes /api/* to the backend; the default /socket.io path
      // can otherwise be handled by the frontend service.
      'path': '/api/socket.io',
      // Start with polling so the ALB can route the handshake, then
      // upgrade to websocket.  websocket-only skips polling and the
      // ALB drops the upgrade when the backend task is under load.
      'transports': ['polling', 'websocket'],
      'autoConnect': false,
      'auth': {'token': token},
      // Exponential back-off: 2 s → 60 s max.
      // The old 1 s / 10 s setting caused a reconnect storm that
      // made the backend even slower.
      'reconnection': true,
      'reconnectionDelay': 2000,
      'reconnectionDelayMax': 60000,
      'randomizationFactor': 0.5,
      // Abort a single connect attempt after 20 s instead of waiting forever.
      'timeout': 20000,
    });

    _socket!.connect();

    _socket!.onConnect((_) {
      logDebug('Socket connected: ${_socket!.id}');
      // Re-join user room on every connect and reconnect
      if (_lastUserId != null) _socket!.emit('join_room', _lastUserId);
    });

    _socket!.on('reconnect', (_) {
      // Belt-and-suspenders: some socket.io versions fire this instead
      // of (or in addition to) onConnect after a reconnect
      logDebug('Socket reconnect event — re-joining room');
      if (_lastUserId != null) _socket!.emit('join_room', _lastUserId);
    });

    _socket!.on('new_notification', (data) {
      logDebug('New notification received: $data');
      _notificationService.handleNewNotification(data);
    });

    _socket!.on('new_message', (data) {
      logDebug('New message received: $data');
      final message = ChatMessage.fromJson(data);
      _chatProvider.receiveMessage(message);
    });

    _socket!.on('user_typing', (data) {
      logDebug('User typing: $data');
      _chatProvider.setOtherTyping(true, data['jobId']);
    });

    _socket!.on('user_stop_typing', (data) {
      logDebug('User stop typing: $data');
      _chatProvider.setOtherTyping(false, data['jobId']);
    });

    // ─── Live Location Tracking Listeners ───────────────────────────────
    _socket!.on('provider_location', (data) {
      logDebug('Provider location received: $data');
      _onProviderLocation?.call(data);
    });

    _socket!.on('provider_location_stopped', (data) {
      logDebug('Provider location stopped: $data');
      _onProviderLocationStopped?.call(data);
    });

    _socket!.onDisconnect((_) {
      // Do NOT null _socket here — socket.io's built-in reconnection needs
      // the existing socket object to retry.  onConnect will fire again
      // when the connection is restored.
      logDebug('Socket disconnected — built-in reconnection will retry');
    });

    _socket!.onConnectError((err) {
      // Same: don't destroy the socket.  socket.io will back off and retry.
      logDebug('Socket Connect Error: $err — socket.io will retry');
    });

    _socket!.onError((err) => logDebug('Socket Error: $err'));
  }

  // ─── Live Location Tracking ─────────────────────────────────────────────

  /// Provider calls this every N seconds while sharing location.
  void emitLocationUpdate({
    required int jobId,
    required int customerId,
    required double latitude,
    required double longitude,
  }) {
    logDebug('emitLocationUpdate - socket connected: ${_socket?.connected}');

    if (_socket?.connected != true) {
      // Socket is in socket.io's reconnection back-off loop.
      // Skip this GPS update — the next one will arrive in a few seconds
      // and will find the socket ready once it reconnects.
      logDebug('emitLocationUpdate - socket reconnecting, update skipped');
      return;
    }

    _socket!.emit('location_update', {
      'jobId': jobId,
      'customerId': customerId,
      'latitude': latitude,
      'longitude': longitude,
    });
  }

  /// Provider calls this to notify customer that location sharing has stopped.
  void emitLocationStopped({
    required int jobId,
    required int customerId,
  }) {
    _socket?.emit('location_stopped', {
      'jobId': jobId,
      'customerId': customerId,
    });
  }

  /// Customer calls this once to start listening for provider location.
  void listenProviderLocation(void Function(Map<String, dynamic>) onUpdate) {
    _onProviderLocation = onUpdate;
  }

  /// Customer calls this to listen for when provider stops sharing location.
  void listenProviderLocationStopped(void Function(Map<String, dynamic>) onStop) {
    _onProviderLocationStopped = onStop;
  }

  /// Customer calls this to stop listening.
  void stopListeningProviderLocation() {
    _onProviderLocation = null;
    _onProviderLocationStopped = null;
  }

  void disconnect() {
    _isCreating = false;
    _lastUserId = null;
    _socket?.disconnect();
    _socket = null;
  }
}
