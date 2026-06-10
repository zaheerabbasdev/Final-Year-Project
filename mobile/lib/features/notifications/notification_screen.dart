import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import 'notification_provider.dart';
import '../../core/theme.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() =>
        context.read<NotificationProvider>().fetchNotifications());
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).appColors;
    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.surface,
        elevation: 0,
        scrolledUnderElevation: 0,
        iconTheme: IconThemeData(color: colors.text),
        title: Text(
          'Notifications',
          style: GoogleFonts.outfit(
            color: colors.text,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all_rounded, color: AppTheme.primaryColor),
            tooltip: 'Mark all as read',
            onPressed: () => context.read<NotificationProvider>().markAllAsRead(),
          ),
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.notifications.isEmpty) {
            return const Center(
              child: CircularProgressIndicator(color: AppTheme.primaryColor),
            );
          }

          if (provider.notifications.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withOpacity(0.05),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.notifications_none_rounded,
                        size: 64,
                        color: AppTheme.primaryColor.withOpacity(0.8),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'No notifications yet',
                      style: GoogleFonts.outfit(
                        fontSize: 20,
                        color: colors.text,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Any alerts about your jobs or account will appear here.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        color: colors.subtext,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          return RefreshIndicator(
            color: AppTheme.primaryColor,
            onRefresh: provider.fetchNotifications,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: provider.notifications.length,
              itemBuilder: (context, index) {
                final notification = provider.notifications[index];
                final bool isRead = notification['is_read'] == 1;

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: colors.surface,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: colors.text.withOpacity(0.02),
                        blurRadius: 15,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    leading: Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: _getTypeColor(notification['type']).withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        _getTypeIcon(notification['type']),
                        color: _getTypeColor(notification['type']),
                        size: 22,
                      ),
                    ),
                    title: Text(
                      notification['title'],
                      style: GoogleFonts.outfit(
                        fontWeight: isRead ? FontWeight.w500 : FontWeight.bold,
                        color: colors.text,
                        fontSize: 15,
                      ),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4),
                        Text(
                          notification['message'],
                          style: GoogleFonts.outfit(
                            color: colors.subtext,
                            fontSize: 13,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _formatDate(notification['created_at']),
                          style: GoogleFonts.outfit(
                            fontSize: 11,
                            color: colors.subtext.withOpacity(0.8),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    trailing: !isRead
                        ? Container(
                            width: 10,
                            height: 10,
                            decoration: const BoxDecoration(
                              color: AppTheme.secondaryColor,
                              shape: BoxShape.circle,
                            ),
                          )
                        : null,
                    onTap: () async {
                      await showDialog(
                        context: context,
                        builder: (ctx) => _buildNotificationModal(notification),
                      );
                      if (!isRead) {
                        provider.markAsRead(notification['id']);
                      }
                    },
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildNotificationModal(Map<String, dynamic> notification) {
    final typeColor = _getTypeColor(notification['type']);
    final typeIcon = _getTypeIcon(notification['type']);

    final colors = Theme.of(context).appColors;
    return Dialog(
      backgroundColor: colors.surface,
      insetPadding: const EdgeInsets.symmetric(horizontal: 28, vertical: 28),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: colors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            // Icon
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: typeColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(typeIcon, color: typeColor, size: 30),
            ),
            const SizedBox(height: 20),
            // Title
            Text(
              notification['title'] ?? 'Notification',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: colors.text,
              ),
            ),
            const SizedBox(height: 12),
            // Message
            Text(
              notification['message'] ?? '',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                fontSize: 15,
                color: colors.subtext,
                height: 1.6,
              ),
            ),
            const SizedBox(height: 16),
            // Date
            Text(
              _formatDate(notification['created_at'] ?? ''),
              style: GoogleFonts.outfit(
                fontSize: 12,
                color: colors.subtext.withOpacity(0.7),
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 24),
            // Close button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: Text(
                  'Close',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'new_bid':
        return Icons.gavel_rounded;
      case 'bid_accepted':
        return Icons.check_circle_rounded;
      case 'booking':
        return Icons.calendar_today_rounded;
      case 'payment':
        return Icons.payment_rounded;
      case 'new_job_posted':
        return Icons.work_outline_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  Color _getTypeColor(String type) {
    final colors = Theme.of(context).appColors;
    switch (type) {
      case 'new_bid':
        return AppTheme.warningColor;
      case 'bid_accepted':
        return AppTheme.successColor;
      case 'booking':
        return AppTheme.secondaryColor;
      case 'payment':
        return Colors.purple;
      case 'new_job_posted':
        return Colors.teal;
      default:
        return colors.subtext;
    }
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat.yMMMd().add_jm().format(date);
    } catch (e) {
      return dateStr;
    }
  }
}
