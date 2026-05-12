import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../customer/job_service.dart';
import '../../../shared/services/booking_service.dart';
import '../../../core/api_client.dart';
import '../../../shared/widgets/notification_bell.dart';
import '../../../core/services/socket_service.dart';
import '../../../core/services/location_tracking_service.dart';

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
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          title: const Text(
            'My Bids',
            style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold, fontSize: 20),
          ),
          actions: [
            const NotificationBell(color: Color(0xFF1E293B)),
          ],
          bottom: TabBar(
            isScrollable: true,
            indicatorColor: const Color(0xFF6366F1),
            indicatorWeight: 3,
            labelColor: const Color(0xFF6366F1),
            unselectedLabelColor: const Color(0xFF64748B),
            labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
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
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (bids.isEmpty) return const Center(child: Text('No bids found.'));

    return ListView.builder(
      padding: const EdgeInsets.all(24),
      itemCount: bids.length,
      itemBuilder: (context, index) {
        final bid = bids[index];
        final status = bid['status'] as String;
        return Container(
          margin: const EdgeInsets.only(bottom: 24),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFFF1F5F9)),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      bid['job_title'] ?? 'Unknown Job',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                    ),
                  ),
                  _buildStatusBadge(bid),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                bid['cover_letter'] ?? 'No cover letter provide.',
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 13, height: 1.5),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  const Icon(Icons.access_time, size: 14, color: Color(0xFF94A3B8)),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      bid['estimated_time'] ?? 'N/A',
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 16),
                  const Text('Submitted ', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                  Text(
                    bid['created_at'] != null ? bid['created_at'].toString().split('T').first : 'Unknown',
                    style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Divider(color: Color(0xFFF1F5F9)),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Your Bid', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                      const SizedBox(height: 4),
                      Text(
                        '\$${bid['amount']}',
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF6366F1)),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text('Category', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                      const SizedBox(height: 4),
                      Text(
                        bid['category_name'] ?? 'N/A',
                        style: const TextStyle(
                          color: Color(0xFF64748B),
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
                            trackingService.stopTracking();
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
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isTrackingThisJob ? const Color(0xFFEF4444) : const Color(0xFF6366F1),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
                      if (trackingService.isTracking && trackingService.activeJobId == bid['job_id']) {
                        trackingService.stopTracking();
                      }
                      final success = await context.read<BookingService>().markJobCompletedOrAwaiting(
                        bid['job_id'],
                        'awaiting_confirmation',
                      );
                      
                      if (success && mounted) {
                        messenger.showSnackBar(
                          SnackBar(
                            content: const Text('Job marked as done! Waiting for customer confirmation.'),
                            backgroundColor: const Color(0xFF10B981),
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            margin: const EdgeInsets.all(12),
                          ),
                        );
                        await _loadBids();
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: const Text('Mark Job as Done', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16)),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusBadge(Map<String, dynamic> bid) {
    String status = bid['status'] as String;
    final String jobStatus = (bid['job_status'] ?? 'open').toString().toLowerCase();
    
    Color color = const Color(0xFF94A3B8);
    IconData icon = Icons.access_time_filled;
    String label = status;

    if (status == 'accepted') {
      if (jobStatus == 'completed') {
        color = const Color(0xFF10B981);
        icon = Icons.check_circle;
        label = 'completed';
      } else if (jobStatus == 'awaiting_confirmation') {
        color = const Color(0xFFF59E0B);
        icon = Icons.hourglass_top;
        label = 'awaiting confirmation';
      } else {
        color = const Color(0xFF10B981);
        icon = Icons.check_circle;
        label = 'active';
      }
    } else if (jobStatus == 'active' || jobStatus == 'completed' || jobStatus == 'awaiting_confirmation') {
      // The job was awarded to someone else, regardless of whether this bid is 'pending' or 'rejected'.
      color = const Color(0xFFF59E0B);
      icon = Icons.info_outline;
      label = 'service availed';
    } else if (status == 'pending') {
      color = const Color(0xFF6366F1);
      icon = Icons.access_time_filled;
      label = 'pending';
    } else if (status == 'rejected') {
      color = const Color(0xFFEF4444);
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
            style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}
