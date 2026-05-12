import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../api_client.dart';
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
    
    print('DEBUG: SocketService.connect called with userId: $userId (type: ${userId.runtimeType})');
    
    if (_socket != null && _socket!.connected) {
      print('DEBUG: Socket already connected, re-emitting join_room');
      _socket!.emit('join_room', userId);
      return;
    }

    final serverUrl = ApiClient.baseUrl.replaceAll('/api', '');
    
    _socket = IO.io(serverUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });

    _socket!.connect();

    _socket!.onConnect((_) {
      print('Socket connected: ${_socket!.id}');
      _socket!.emit('join_room', userId);
    });

    _socket!.on('new_notification', (data) {
      print('New notification received: $data');
      _notificationService.handleNewNotification(data);
    });

    _socket!.on('new_message', (data) {
      print('New message received: $data');
      final message = ChatMessage.fromJson(data);
      _chatProvider.receiveMessage(message);
    });

    _socket!.on('user_typing', (data) {
      print('User typing: $data');
      _chatProvider.setOtherTyping(true, data['jobId']);
    });

    _socket!.on('user_stop_typing', (data) {
      print('User stop typing: $data');
      _chatProvider.setOtherTyping(false, data['jobId']);
    });

    // ─── Live Location Tracking Listeners ───────────────────────────────
    _socket!.on('provider_location', (data) {
      print('Provider location received: $data');
      if (_onProviderLocation != null) {
        _onProviderLocation!(data);
      }
    });

    _socket!.on('provider_location_stopped', (data) {
      print('Provider location stopped: $data');
      if (_onProviderLocationStopped != null) {
        _onProviderLocationStopped!(data);
      }
    });

    _socket!.onDisconnect((_) {
      print('Socket disconnected');
    });

    _socket!.onConnectError((err) => print('Socket Connect Error: $err'));
    _socket!.onError((err) => print('Socket Error: $err'));
  }

  // ─── Live Location Tracking ─────────────────────────────────────────────

  /// Provider calls this every N seconds while sharing location.
  void emitLocationUpdate({
    required int jobId,
    required int customerId,
    required double latitude,
    required double longitude,
  }) {
    print('DEBUG: emitLocationUpdate - socket connected: ${_socket?.connected}');
    print('DEBUG: emitLocationUpdate - jobId: $jobId, customerId: $customerId, lat: $latitude, lng: $longitude');
    
    _socket?.emit('location_update', {
      'jobId': jobId,
      'customerId': customerId,
      'latitude': latitude,
      'longitude': longitude,
    });
    
    print('DEBUG: location_update event emitted');
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
    print('DEBUG: listenProviderLocation callback registered');
    _onProviderLocation = onUpdate;
  }

  /// Customer calls this to listen for when provider stops sharing location.
  void listenProviderLocationStopped(void Function(Map<String, dynamic>) onStop) {
    print('DEBUG: listenProviderLocationStopped callback registered');
    _onProviderLocationStopped = onStop;
  }

  /// Customer calls this to stop listening.
  void stopListeningProviderLocation() {
    print('DEBUG: stopListeningProviderLocation called');
    _onProviderLocation = null;
    _onProviderLocationStopped = null;
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}
