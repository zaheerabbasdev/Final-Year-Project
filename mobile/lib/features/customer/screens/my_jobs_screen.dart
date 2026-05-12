import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../job_service.dart';
import '../../../shared/services/booking_service.dart';
import '../../../features/auth/auth_service.dart';
import '../../../shared/widgets/notification_bell.dart';
import '../screens/track_provider_screen.dart';

class MyJobsScreen extends StatelessWidget {
  const MyJobsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          title: const Text(
            'My Jobs',
            style: TextStyle(
              color: Color(0xFF1E293B),
              fontWeight: FontWeight.bold,
              fontSize: 20,
            ),
          ),
          actions: [
            const NotificationBell(color: Color(0xFF1E293B)),
          ],
          bottom: const TabBar(
            isScrollable: true,
            indicatorColor: Color(0xFF6366F1),
            indicatorWeight: 3,
            labelColor: Color(0xFF6366F1),
            unselectedLabelColor: Color(0xFF64748B),
            labelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
            tabs: [
              Tab(text: 'All'),
              Tab(text: 'Open'),
              Tab(text: 'Active'),
              Tab(text: 'Completed'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            _JobsListView(),
            _JobsListView(statusFilter: 'open'),
            _JobsListView(statusFilter: 'active'),
            _JobsListView(statusFilter: 'completed'),
          ],
        ),
      ),
    );
  }
}

class _JobsListView extends StatefulWidget {
  final String? statusFilter;
  const _JobsListView({this.statusFilter});

  @override
  State<_JobsListView> createState() => _JobsListViewState();
}

class _JobsListViewState extends State<_JobsListView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<JobService>().fetchJobs();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<JobService>(
      builder: (context, service, _) {
        if (service.isLoading) return const Center(child: CircularProgressIndicator());
        
        final jobs = service.jobs;
        final filteredJobs = widget.statusFilter == null 
            ? jobs 
            : jobs.where((j) => (j['status'] as String).toLowerCase() == widget.statusFilter!.toLowerCase()).toList();

        if (filteredJobs.isEmpty) return const Center(child: Text('No jobs found.'));

        return ListView.builder(
          padding: const EdgeInsets.all(20),
          itemCount: filteredJobs.length,
          itemBuilder: (context, index) {
            final job = filteredJobs[index];
            final status = job['status'] as String;
            final statusColor = status == 'open' ? const Color(0xFF6366F1) : (status == 'active' ? Colors.orange : Colors.green);

            return InkWell(
              onTap: () => context.push('/job-detail/${job['id']}'),
              borderRadius: BorderRadius.circular(24),
              child: Container(
                margin: const EdgeInsets.only(bottom: 20),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFF1F5F9)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.02),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
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
                            job['title'] as String,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1E293B),
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            status.toUpperCase(),
                            style: TextStyle(
                              color: statusColor,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      job['description'] as String,
                      style: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Icon(Icons.calendar_today_outlined, size: 14, color: Color(0xFF94A3B8)),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            job['created_at'] != null ? job['created_at'].toString().split('T').first : 'Unknown',
                            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 16),
                        const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFF94A3B8)),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            job['location'] ?? 'Not specified',
                            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Divider(color: Color(0xFFF1F5F9)),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Text(
                              '\$${job['budget']}',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF6366F1),
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Text(
                              'Budget',
                              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                            ),
                          ],
                        ),
                        Row(
                          children: [
                            const Icon(Icons.trending_up, size: 16, color: Color(0xFF10B981)),
                            const SizedBox(width: 4),
                            const Text(
                              'View Details',
                              style: TextStyle(
                                color: Color(0xFF10B981),
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    // ─── Track Live button for active jobs ─────────────────────
                    if (status.toLowerCase() == 'active' && (job['booking_status'] as String?) != 'awaiting_confirmation') ...[
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton.icon(
                          onPressed: () {
                            final user = context.read<AuthService>().user;
                            context.push('/track-provider', extra: {
                              'jobId': job['id'],
                              'customerId': user?['id'] ?? 0,
                              'providerId': job['provider_id'] ?? 0,
                              'providerName': job['provider_name'] ?? 'Service Provider',
                            });
                          },
                          icon: const Icon(Icons.share_location, size: 18),
                          label: const Text(
                            'Track Live Location',
                            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF6366F1),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                        ),
                      ),
                    ],
                    if ((job['booking_status'] as String?) == 'awaiting_confirmation') ...[
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: () async {
                            final success = await context.read<BookingService>().markJobCompletedOrAwaiting(
                                  job['id'],
                                  'completed',
                                );
                            if (success && context.mounted) {
                              context.read<JobService>().fetchJobs();
                              context.push('/submit-review', extra: {
                                'bookingId': job['booking_id'],
                                'jobId': job['id'],
                                'providerId': job['provider_id'],
                                'providerName': job['provider_name'] ?? 'Service Provider',
                                'providerAvatar': job['provider_avatar'],
                              });

                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: const Text('Job completed! Please leave a review.'),
                                  backgroundColor: const Color(0xFF6366F1),
                                  behavior: SnackBarBehavior.floating,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  margin: const EdgeInsets.all(12),
                                ),
                              );
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF6366F1),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          child: const Text(
                            'Confirm Completion & Review',
                            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ),
                      ),
                    ] else if ((job['status'] as String).toLowerCase() == 'completed' && job['review_id'] == null) ...[
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: OutlinedButton(
                          onPressed: () {
                            context.push('/submit-review', extra: {
                              'bookingId': job['booking_id'],
                              'jobId': job['id'],
                              'providerId': job['provider_id'],
                              'providerName': job['provider_name'] ?? 'Service Provider',
                              'providerAvatar': job['provider_avatar'],
                            });
                          },
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFF6366F1)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text(
                            'Leave a Review',
                            style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF6366F1)),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
