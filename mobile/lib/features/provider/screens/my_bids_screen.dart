import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../customer/job_service.dart';
import '../../../shared/services/booking_service.dart';
import '../../../core/api_client.dart';
import '../../../shared/widgets/notification_bell.dart';
import '../../../core/services/socket_service.dart';
import '../../../core/services/location_tracking_service.dart';
import '../../../core/theme.dart';

class MyBidsScreen extends StatefulWidget {
  const MyBidsScreen({super.key});

  @override
  State<MyBidsScreen> createState() => _MyBidsScreenState();
}

class _MyBidsScreenState extends State<MyBidsScreen> {
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBids();
  }

  Future<void> _loadBids() async {
    setState(() => _isLoading = true);
    await context.read<JobService>().fetchProviderBids();
    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final _allBids = context.watch<JobService>().providerBids;
    
    final pendingCount = _allBids.where((b) {
      if (b['status'] == 'accepted') return false;
      final js = (b['job_status'] ?? 'open').toString().toLowerCase();
      return js == 'open' && b['status'] == 'pending';
    }).length;

    // Active: accepted bid + job is still in progress
    final activeCount = _allBids.where((b) {
      if (b['status'] != 'accepted') return false;
      final js = (b['job_status'] ?? '').toString().toLowerCase();
      return js == 'active' || js == 'awaiting_confirmation';
    }).length;

    // Completed: accepted bid + job is fully done
    final completedCount = _allBids.where((b) {
      if (b['status'] != 'accepted') return false;
      final js = (b['job_status'] ?? '').toString().toLowerCase();
      return js == 'completed';
    }).length;

    final availedCount = _allBids.where((b) {
      if (b['status'] == 'accepted') return false;
      final js = (b['job_status'] ?? 'open').toString().toLowerCase();
      return js == 'active' || js == 'completed';
    }).length;

    return DefaultTabController(
      length: 5,
      child: Scaffold(
        backgroundColor: AppTheme.backgroundColor,
        appBar: AppBar(
          backgroundColor: Colors.white,
          scrolledUnderElevation: 0,
          elevation: 0,
          title: Text(
            'My Bids',
            style: GoogleFonts.outfit(color: AppTheme.textColor, fontWeight: FontWeight.bold, fontSize: 22),
          ),
          actions: const [
            NotificationBell(color: AppTheme.textColor),
          ],
          bottom: TabBar(
            isScrollable: true,
            indicatorColor: AppTheme.primaryColor,
            indicatorWeight: 3,
            labelColor: AppTheme.primaryColor,
            unselectedLabelColor: AppTheme.subtextColor,
            labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14),
            unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w500, fontSize: 14),
            tabs: [
              Tab(text: 'All (${_allBids.length})'),
              Tab(text: 'Pending ($pendingCount)'),
              Tab(text: 'Active ($activeCount)'),
              Tab(text: 'Completed ($completedCount)'),
              Tab(text: 'Availed ($availedCount)'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildBidsList(_allBids),
            // Pending
            _buildBidsList(_allBids.where((b) {
              if (b['status'] == 'accepted') return false;
              final js = (b['job_status'] ?? 'open').toString().toLowerCase();
              return js == 'open' && b['status'] == 'pending';
            }).toList()),
            // Active (in progress)
            _buildBidsList(_allBids.where((b) {
              if (b['status'] != 'accepted') return false;
              final js = (b['job_status'] ?? '').toString().toLowerCase();
              return js == 'active' || js == 'awaiting_confirmation';
            }).toList()),
            // Completed
            _buildBidsList(_allBids.where((b) {
              if (b['status'] != 'accepted') return false;
              final js = (b['job_status'] ?? '').toString().toLowerCase();
              return js == 'completed';
            }).toList()),
            // Availed (lost bids)
            _buildBidsList(_allBids.where((b) {
              if (b['status'] == 'accepted') return false;
              final js = (b['job_status'] ?? 'open').toString().toLowerCase();
              return js == 'active' || js == 'completed';
            }).toList()),
          ],
        ),
      ),
    );
  }

  Widget _buildBidsList(List<dynamic> bids) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor));
    }
    if (bids.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.assignment_outlined, size: 64, color: AppTheme.subtextColor.withOpacity(0.3)),
            const SizedBox(height: 16),
            Text(
              'No bids found',
              style: GoogleFonts.outfit(
                color: AppTheme.subtextColor,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      itemCount: bids.length,
      itemBuilder: (context, index) {
        final bid = bids[index];
        final status = bid['status'] as String;
        return Container(
          margin: const EdgeInsets.only(bottom: 20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: AppTheme.textColor.withOpacity(0.03),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        bid['job_title'] ?? 'Unknown Job',
                        style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textColor),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _buildStatusBadge(bid),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  bid['cover_letter'] ?? 'No cover letter provided.',
                  style: GoogleFonts.outfit(color: AppTheme.subtextColor, fontSize: 13, height: 1.5),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Icon(Icons.access_time, size: 14, color: AppTheme.subtextColor),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        bid['estimated_time'] ?? 'N/A',
                        style: GoogleFonts.outfit(color: AppTheme.subtextColor, fontSize: 12, fontWeight: FontWeight.w500),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Text(
                      'Submitted ',
                      style: GoogleFonts.outfit(color: AppTheme.subtextColor, fontSize: 12, fontWeight: FontWeight.w500),
                    ),
                    Text(
                      bid['created_at'] != null ? bid['created_at'].toString().split('T').first : 'Unknown',
                      style: GoogleFonts.outfit(color: AppTheme.subtextColor, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(color: Color(0xFFF1F5F9), height: 1),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Your Bid',
                          style: GoogleFonts.outfit(color: AppTheme.subtextColor, fontSize: 11, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '\$${bid['amount']}',
                          style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800, color: AppTheme.primaryColor),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          'Category',
                          style: GoogleFonts.outfit(color: AppTheme.subtextColor, fontSize: 11, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          bid['category_name'] ?? 'N/A',
                          style: GoogleFonts.outfit(
                            color: AppTheme.textColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                if (status == 'accepted' && bid['job_status'] == 'active') ...[
                  const SizedBox(height: 20),
                  // ─── Share Location Toggle ───────────────────────────────
                  Consumer<LocationTrackingService>(
                    builder: (context, trackingService, _) {
                      final isTrackingThisJob = trackingService.isTracking && trackingService.activeJobId == bid['job_id'];
                      return SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton.icon(
                          onPressed: () {
                            if (isTrackingThisJob) {
                              final socket = context.read<SocketService>();
                              trackingService.stopTracking(socket: socket);
                            } else {
                              final socket = context.read<SocketService>();
                              final custId = bid['client_id'] ?? bid['customer_id'] ?? 0;
                              debugPrint('DEBUG: Starting location tracking for jobId: ${bid['job_id']}, customerId: $custId');
                              trackingService.startTracking(
                                socket,
                                jobId: bid['job_id'],
                                customerId: custId,
                              );
                            }
                          },
                          icon: Icon(
                            isTrackingThisJob ? Icons.location_off : Icons.share_location,
                            size: 18,
                          ),
                          label: Text(
                            isTrackingThisJob ? 'Stop Sharing Location' : 'Share Live Location',
                            style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: isTrackingThisJob ? AppTheme.errorColor : AppTheme.primaryColor,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            elevation: 0,
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 12),
                  // ─── Mark Job as Done ────────────────────────────────────
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () async {
                        final messenger = ScaffoldMessenger.of(context);
                        // Stop location tracking if running for this job
                        final trackingService = context.read<LocationTrackingService>();
                        final socket = context.read<SocketService>();
                        if (trackingService.isTracking && trackingService.activeJobId == bid['job_id']) {
                          trackingService.stopTracking(socket: socket);
                        }
                        final success = await context.read<BookingService>().markJobCompletedOrAwaiting(
                          bid['job_id'],
                          'awaiting_confirmation',
                        );
                        
                        if (success && mounted) {
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text('Job marked as done! Waiting for customer confirmation.', style: GoogleFonts.outfit()),
                              backgroundColor: AppTheme.successColor,
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              margin: const EdgeInsets.all(12),
                            ),
                          );
                          await _loadBids();
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.successColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 0,
                      ),
                      child: Text('Mark Job as Done', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusBadge(Map<String, dynamic> bid) {
    String status = bid['status'] as String;
    final String jobStatus = (bid['job_status'] ?? 'open').toString().toLowerCase();
    
    Color color = AppTheme.subtextColor;
    IconData icon = Icons.access_time_filled;
    String label = status;

    if (status == 'accepted') {
      if (jobStatus == 'completed') {
        color = AppTheme.successColor;
        icon = Icons.check_circle;
        label = 'completed';
      } else if (jobStatus == 'awaiting_confirmation') {
        color = AppTheme.warningColor;
        icon = Icons.hourglass_top;
        label = 'awaiting confirmation';
      } else {
        color = AppTheme.successColor;
        icon = Icons.check_circle;
        label = 'active';
      }
    } else if (jobStatus == 'active' || jobStatus == 'completed' || jobStatus == 'awaiting_confirmation') {
      // The job was awarded to someone else, regardless of whether this bid is 'pending' or 'rejected'.
      color = AppTheme.warningColor;
      icon = Icons.info_outline;
      label = 'service availed';
    } else if (status == 'pending') {
      color = AppTheme.secondaryColor;
      icon = Icons.access_time_filled;
      label = 'pending';
    } else if (status == 'rejected') {
      color = AppTheme.errorColor;
      icon = Icons.cancel;
      label = 'rejected';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 6),
          Text(
            label.toUpperCase(),
            style: GoogleFonts.outfit(color: color, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
          ),
        ],
      ),
    );
  }
}
