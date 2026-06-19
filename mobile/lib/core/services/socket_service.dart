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

  // Location tracking callbacks
  Function(Map<String, dynamic>)? _onProviderLocation;
  Function(Map<String, dynamic>)? _onProviderLocationStopped;

  SocketService(this._notificationService, this._chatProvider) {
    _chatProvider.onEmitTyping = (data) {
      _socket?.emit('typing', data);
    };
    _chatProvider.onEmitStopTyping = (data) {
      _socket?.emit('stop_typing', data);
    };
  }



  void connect(dynamic userId) {
    // Force to int if it's a double/number to avoid "user_1.0" room names
    if (userId is double) {
      userId = userId.toInt();
    } else if (userId is String) {
      userId = int.tryParse(userId) ?? userId;
    }

    logDebug('SocketService.connect called with userId: $userId (type: ${userId.runtimeType})');

    if (_socket != null && _socket!.connected) {
      logDebug('Socket already connected, re-emitting join_room');
      _socket!.emit('join_room', userId);
      return;
    }

    // Fetch the auth token before opening the connection — the backend
    // rejects the handshake without it.
    TokenStorage.getToken().then((token) => _establishConnection(token));
  }

  void _establishConnection(String? token) {
    if (_socket != null && _socket!.connected) return;

    final serverUrl = ApiClient.baseUrl.replaceAll('/api', '');

    _socket = IO.io(serverUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'auth': {'token': token},
    });

    _socket!.connect();

    _socket!.onConnect((_) {
      logDebug('Socket connected: ${_socket!.id}');
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
      if (_onProviderLocation != null) {
        _onProviderLocation!(data);
      }
    });

    _socket!.on('provider_location_stopped', (data) {
      logDebug('Provider location stopped: $data');
      if (_onProviderLocationStopped != null) {
        _onProviderLocationStopped!(data);
      }
    });

    _socket!.onDisconnect((_) {
      logDebug('Socket disconnected');
    });

    _socket!.onConnectError((err) => logDebug('Socket Connect Error: $err'));
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

    _socket?.emit('location_update', {
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
    _socket?.disconnect();
    _socket = null;
  }
}
