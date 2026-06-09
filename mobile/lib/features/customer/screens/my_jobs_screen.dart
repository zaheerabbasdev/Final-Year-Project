import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../job_service.dart';
import '../../../shared/services/booking_service.dart';
import '../../../features/auth/auth_service.dart';
import '../../../shared/widgets/notification_bell.dart';
import '../../../core/theme.dart';
import '../screens/track_provider_screen.dart';

class MyJobsScreen extends StatelessWidget {
  const MyJobsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).appColors;
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: colors.background,
        appBar: AppBar(
          backgroundColor: colors.surface,
          scrolledUnderElevation: 0,
          elevation: 0,
          title: Text(
            'My Jobs',
            style: GoogleFonts.outfit(
              color: colors.text,
              fontWeight: FontWeight.bold,
              fontSize: 22,
            ),
          ),
          actions: [
            NotificationBell(color: colors.text),
          ],
          bottom: TabBar(
            isScrollable: true,
            indicatorColor: AppTheme.primaryColor,
            indicatorWeight: 3,
            labelColor: AppTheme.primaryColor,
            unselectedLabelColor: colors.subtext,
            labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14),
            unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w500, fontSize: 14),
            tabs: const [
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
    final colors = Theme.of(context).appColors;
    return Consumer<JobService>(
      builder: (context, service, _) {
        if (service.isLoading) {
          return const Center(
            child: CircularProgressIndicator(
              color: AppTheme.primaryColor,
            ),
          );
        }
        
        final jobs = service.jobs;
        final filteredJobs = widget.statusFilter == null 
            ? jobs 
            : jobs.where((j) => (j['status'] as String).toLowerCase() == widget.statusFilter!.toLowerCase()).toList();

        if (filteredJobs.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.assignment_outlined, size: 64, color: colors.subtext.withOpacity(0.3)),
                const SizedBox(height: 16),
                Text(
                  'No jobs found',
                  style: GoogleFonts.outfit(
                    color: colors.subtext,
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          itemCount: filteredJobs.length,
          itemBuilder: (context, index) {
            final job = filteredJobs[index];
            final status = (job['status'] as String).toLowerCase();
            
            Color statusColor;
            switch (status) {
              case 'open':
                statusColor = AppTheme.secondaryColor;
                break;
              case 'active':
                statusColor = AppTheme.warningColor;
                break;
              case 'completed':
                statusColor = AppTheme.successColor;
                break;
              default:
                statusColor = colors.subtext;
            }

            return Container(
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: colors.surface,
                borderRadius: BorderRadius.circular(26),
                boxShadow: [
                  BoxShadow(
                    color: colors.text.withOpacity(0.06),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                borderRadius: BorderRadius.circular(24),
                child: InkWell(
                  onTap: () => context.push('/job-detail/${job['id']}'),
                  borderRadius: BorderRadius.circular(24),
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
                                  job['title'] as String,
                                  style: GoogleFonts.outfit(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: colors.text,
                                  ),
                                ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: statusColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                status.toUpperCase(),
                                style: GoogleFonts.outfit(
                                  color: statusColor,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          job['description'] as String,
                          style: GoogleFonts.outfit(color: colors.subtext, fontSize: 14),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Icon(Icons.calendar_today_outlined, size: 14, color: colors.subtext),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                job['created_at'] != null ? job['created_at'].toString().split('T').first : 'Unknown',
                                style: GoogleFonts.outfit(color: colors.subtext, fontSize: 12, fontWeight: FontWeight.w500),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Icon(Icons.location_on_outlined, size: 14, color: colors.subtext),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                job['location'] ?? 'Not specified',
                                style: GoogleFonts.outfit(color: colors.subtext, fontSize: 12, fontWeight: FontWeight.w500),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Divider(color: colors.border, height: 1),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Flexible(
                              child: Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      'PKR ${(double.tryParse(job['budget']?.toString() ?? '0') ?? 0).toInt()}',
                                      style: GoogleFonts.outfit(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.primaryColor,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Budget',
                                    style: GoogleFonts.outfit(color: colors.subtext, fontSize: 13, fontWeight: FontWeight.w500),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.trending_up, size: 16, color: AppTheme.secondaryColor),
                                const SizedBox(width: 4),
                                Flexible(
                                  child: Text(
                                    'View Details',
                                    style: GoogleFonts.outfit(
                                      color: AppTheme.secondaryColor,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 14,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        // ─── Track Live button for active jobs ─────────────────────
                        if (status == 'active' && (job['booking_status'] as String?) != 'awaiting_confirmation') ...[
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
                              label: Text(
                                'Track Live Location',
                                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryColor,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
                                      content: Text('Job completed! Please leave a review.', style: GoogleFonts.outfit()),
                                      backgroundColor: AppTheme.primaryColor,
                                      behavior: SnackBarBehavior.floating,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      margin: const EdgeInsets.all(12),
                                    ),
                                  );
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryColor,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                elevation: 0,
                              ),
                              child: Text(
                                'Confirm Completion & Review',
                                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                            ),
                          ),
                        ] else if (status == 'completed' && job['review_id'] == null) ...[
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
                                side: const BorderSide(color: AppTheme.primaryColor),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              child: Text(
                                'Leave a Review',
                                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}
