import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../features/notifications/notification_provider.dart';

class NotificationService {
  NotificationProvider? _provider;
  Future<void> Function()? onNewJobPosted;
  final GlobalKey<ScaffoldMessengerState> messengerKey = GlobalKey<ScaffoldMessengerState>();

  void setProvider(NotificationProvider provider) {
    _provider = provider;
  }

  void handleNewNotification(dynamic data) {
    if (_provider != null) {
      _provider!.addNotification(data);
    }

    if (data is Map &&
        (data['type'] == 'new_job_posted' || data['type'] == 'emergency_job_posted')) {
      onNewJobPosted?.call();
    }

    // Show a SnackBar or Toast
    _showAlert(data['title'], data['message']);
  }

  void _showAlert(String title, String message) {
    Fluttertoast.showToast(
      msg: "$title: $message",
      gravity: ToastGravity.TOP,
      timeInSecForIosWeb: 3,
      backgroundColor: Colors.blueAccent,
      textColor: Colors.white,
      fontSize: 16.0
    );
  }
}
