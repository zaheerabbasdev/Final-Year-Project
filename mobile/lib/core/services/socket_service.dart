import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../api_client.dart';
import 'notification_service.dart';

class SocketService {
  IO.Socket? _socket;
  final NotificationService _notificationService;

  SocketService(this._notificationService);

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

    _socket!.onDisconnect((_) {
      print('Socket disconnected');
    });

    _socket!.onConnectError((err) => print('Socket Connect Error: $err'));
    _socket!.onError((err) => print('Socket Error: $err'));
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}
