import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../features/customer/category_service.dart';
import '../../features/customer/job_service.dart';
import '../../features/provider/provider_service.dart';
import '../../features/notifications/notification_provider.dart';
import '../../features/chat/providers/chat_provider.dart';
import '../../features/auth/auth_service.dart';

class SyncProvider extends ChangeNotifier {
  bool _isSyncing = false;
  DateTime? _lastSyncTime;
  bool get isSyncing => _isSyncing;

  /// Minimum gap between background syncs (e.g. on app resume).
  /// Explicit pull-to-refresh calls bypass this check.
  static const _syncCooldown = Duration(seconds: 30);

  Future<void> syncAll(BuildContext context, {bool force = false}) async {
    final authService = Provider.of<AuthService>(context, listen: false);
    if (!authService.isAuthenticated) return;

    // Skip if synced recently, unless the caller forces it (e.g. pull-to-refresh).
    if (!force && _lastSyncTime != null &&
        DateTime.now().difference(_lastSyncTime!) < _syncCooldown) {
      return;
    }

    _isSyncing = true;
    notifyListeners();

    try {
      final List<Future<dynamic>> futures = [
        context.read<NotificationProvider>().fetchUnreadCount(),
        context.read<ChatProvider>().fetchChatList(),
      ];

      // Add role-specific syncs
      if (authService.role == 'customer') {
        futures.add(context.read<CategoryService>().fetchCategories());
        futures.add(context.read<JobService>().fetchJobs());
        futures.add(context.read<ProviderService>().fetchTopProviders());
      } else if (authService.role == 'provider') {
        futures.add(context.read<JobService>().fetchJobs());
        futures.add(context.read<JobService>().fetchProviderBids());
        futures.add(context.read<ProviderService>().fetchDashboardStats());
      }

      await Future.wait(futures);
      _lastSyncTime = DateTime.now();
    } catch (e) {
      debugPrint('Global sync error: $e');
    } finally {
      _isSyncing = false;
      notifyListeners();
    }
  }
}
