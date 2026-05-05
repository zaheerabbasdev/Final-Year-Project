import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class NotificationProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;

  List<dynamic> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;

  Future<void> fetchNotifications() async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiClient.dio.get('/notifications');
      if (response.statusCode == 200) {
        _notifications = response.data;
        _updateUnreadCount();
      }
    } catch (e) {
      print('Error fetching notifications: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchUnreadCount() async {
    try {
      final response = await _apiClient.dio.get('/notifications/unread-count');
      if (response.statusCode == 200) {
        _unreadCount = response.data['count'];
        notifyListeners();
      }
    } catch (e) {
      print('Error fetching unread count: $e');
    }
  }

  void addNotification(dynamic notification) {
    _notifications.insert(0, notification);
    _unreadCount++;
    notifyListeners();
  }

  Future<void> markAsRead(int id) async {
    try {
      final response = await _apiClient.dio.put('/notifications/$id/read');
      if (response.statusCode == 200) {
        final index = _notifications.indexWhere((n) => n['id'] == id);
        if (index != -1) {
          _notifications[index]['is_read'] = 1;
          if (_unreadCount > 0) _unreadCount--;
          notifyListeners();
        }
      }
    } catch (e) {
      print('Error marking notification as read: $e');
    }
  }

  Future<void> markAllAsRead() async {
    try {
      final response = await _apiClient.dio.put('/notifications/mark-all-read');
      if (response.statusCode == 200) {
        for (var n in _notifications) {
          n['is_read'] = 1;
        }
        _unreadCount = 0;
        notifyListeners();
      }
    } catch (e) {
      print('Error marking all as read: $e');
    }
  }

  void _updateUnreadCount() {
    _unreadCount = _notifications.where((n) => n['is_read'] == 0).length;
  }
}
