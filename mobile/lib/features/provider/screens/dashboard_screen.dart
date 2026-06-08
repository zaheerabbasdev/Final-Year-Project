import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../customer/job_service.dart';
import '../../../core/api_client.dart';
import '../../auth/auth_service.dart';
import '../../../shared/services/navigation_service.dart';
import '../../../shared/providers/sync_provider.dart';
import '../../provider/provider_service.dart';
import '../../../core/services/location_service.dart';
import '../../notifications/notification_provider.dart';
import '../../../shared/widgets/notification_bell.dart';
import '../../../core/theme.dart';

class ProviderDashboardScreen extends StatefulWidget {
  const ProviderDashboardScreen({super.key});

  @override
  State<ProviderDashboardScreen> createState() => _ProviderDashboardScreenState();
}

class _ProviderDashboardScreenState extends State<ProviderDashboardScreen> {
  bool _isNearMeEnabled = false;
  final LocationService _locationService = LocationService();
  bool _isLocating = false;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<JobService>().fetchJobs();
      context.read<JobService>().fetchProviderBids();
      context.read<ProviderService>().fetchDashboardStats();
    });
  }

  Future<void> _toggleNearMe() async {
    if (_isNearMeEnabled) {
      setState(() => _isNearMeEnabled = false);
      context.read<JobService>().fetchJobs();
      return;
    }

    setState(() => _isLocating = true);
    try {
      final pos = await _locationService.getCurrentLocation();
      if (pos != null) {
        setState(() {
          _isNearMeEnabled = true;
          _isLocating = false;
        });
        context.read<JobService>().fetchJobs(filters: {
          'lat': pos.latitude,
          'lng': pos.longitude,
          // 'radius': 20, // Backend now defaults to 20km for providers
        });
      }
    } catch (e) {
      setState(() => _isLocating = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthService>().user;
    final String fullName = user?['full_name'] ?? 'Provider';
    final String firstName = fullName.split(' ').first;
    final avatarPath = user?['avatar'];
    final avatarUrl = ApiClient.getImageUrl(avatarPath);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FB),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF5F7FB),
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Provider Console',
              style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontWeight: FontWeight.bold, fontSize: 18),
            ),
            Text(
              'Welcome back, $firstName!',
              style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w500),
            ),
          ],
        ),
        actions: [
          const NotificationBell(color: Color(0xFF1E293B)),
          Padding(
            padding: const EdgeInsets.only(right: 16.0, left: 8.0),
            child: GestureDetector(
              onTap: () => context.push('/profile'),
              child: Stack(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: CircleAvatar(
                      radius: 18,
                      backgroundImage: avatarUrl != null 
                        ? NetworkImage(avatarUrl)
                        : const NetworkImage('https://i.pravatar.cc/150?u=mike'),
                      backgroundColor: const Color(0xFFF1F5F9),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: context.watch<ProviderService>().isOnline
                            ? const Color(0xFF10B981) 
                            : const Color(0xFF94A3B8),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 1.5),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: const Color(0xFF003B95),
        onRefresh: () => context.read<SyncProvider>().syncAll(context),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (user != null && _shouldShowLocationWarning(user))
                _buildLocationWarning(),
              if (user != null && _shouldShowLocationWarning(user))
                const SizedBox(height: 24),
              _buildStatsGrid(),
              const SizedBox(height: 32),
              _buildSectionHeader('Quick Console'),
              const SizedBox(height: 16),
              _buildQuickActions(),
              const SizedBox(height: 32),
              _buildEarningsCard(fullName),
              const SizedBox(height: 32),
              _buildSectionHeader(
                _isNearMeEnabled ? 'Jobs Near You (20km)' : 'New Job Opportunities', 
                action: _isLocating ? 'Locating...' : (_isNearMeEnabled ? 'Show All' : 'Near Me'), 
                onAction: _toggleNearMe
              ),
              const SizedBox(height: 16),
              _buildOpportunitiesList(),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, {String? action, VoidCallback? onAction}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(
            title,
            style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        if (action != null) ...[
          const SizedBox(width: 8),
          TextButton(
            onPressed: onAction,
            child: Text(
              action,
              style: GoogleFonts.outfit(color: const Color(0xFF0A84FF), fontWeight: FontWeight.bold, fontSize: 13),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildStatsGrid() {
    return Consumer<ProviderService>(
      builder: (context, service, _) {
        final stats = service.dashboardStats;
        final allBids = context.watch<JobService>().providerBids;
        
        final activeJobsCount = allBids.where((b) {
          if (b['status'] != 'accepted') return false;
          final js = (b['job_status'] ?? '').toString().toLowerCase();
          return js == 'active' || js == 'awaiting_confirmation';
        }).length;

        final completedJobsCount = allBids.where((b) {
          if (b['status'] != 'accepted') return false;
          final js = (b['job_status'] ?? '').toString().toLowerCase();
          return js == 'completed';
        }).length;
            
        return GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 1.15,
          children: [
            _buildStatCard('Active Jobs', activeJobsCount.toString(), Icons.assignment_rounded, const Color(0xFF0A84FF)),
            _buildStatCard('Rating', (stats?['rating'] ?? '5.0').toString(), Icons.star_rounded, const Color(0xFFFFB020)),
            _buildStatCard('Jobs Done', completedJobsCount.toString(), Icons.check_circle_rounded, const Color(0xFF2ECC71)),
            _buildStatCard('Experience', '${stats?['experience_years'] ?? '0'} Yrs', Icons.military_tech_rounded, const Color(0xFF003B95)),
          ],
        );
      },
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.01),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const Spacer(),
          Text(
            value,
            style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: GoogleFonts.outfit(fontSize: 11, color: const Color(0xFF64748B), fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Row(
      children: [
        Expanded(child: _buildActionItem(Icons.search_rounded, 'Browse Opportunities', () => context.push('/browse-jobs'))),
        const SizedBox(width: 16),
        Expanded(child: _buildActionItem(Icons.gavel_rounded, 'My Bids Console', () => context.read<NavigationService>().setIndex(2))),
      ],
    );
  }

  Widget _buildActionItem(IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
        decoration: BoxDecoration(
          color: AppTheme.surfaceColor,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: AppTheme.textColor.withOpacity(0.03),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF003B95).withOpacity(0.06),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: const Color(0xFF003B95), size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              label,
              style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEarningsCard(String fullName) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF003B95), Color(0xFF0A84FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF003B95).withOpacity(0.25),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "This Month's Earnings",
            style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white.withOpacity(0.92)),
          ),
          const SizedBox(height: 4),
          Text(
            'PKR ${(double.tryParse(context.watch<ProviderService>().dashboardStats?['total_earnings']?.toString() ?? '0') ?? 0).toInt()}',
            style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 0.5),
          ),
          const SizedBox(height: 24),
          Text(
            'Weekly Performance Stats',
            style: GoogleFonts.outfit(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 16),
          _buildWeeklyChart(),
        ],
      ),
    );
  }

  Widget _buildWeeklyChart() {
    final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final heights = [0.4, 0.7, 0.5, 0.8, 0.3, 0.6, 0.4];

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: List.generate(days.length, (index) {
        return Column(
          children: [
            Container(
              width: 14,
              height: 80 * heights[index],
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.25),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              days[index], 
              style: GoogleFonts.outfit(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.w500),
            ),
          ],
        );
      }),
    );
  }

  Widget _buildOpportunitiesList() {
    return Consumer<JobService>(
      builder: (context, service, _) {
        final openJobs = service.jobs.take(3).toList();
        if (openJobs.isEmpty) {
          return Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Center(
              child: Text(
                'No new opportunities available right now.',
                style: GoogleFonts.outfit(color: const Color(0xFF94A3B8), fontSize: 14),
              ),
            ),
          );
        }
        return Column(
          children: openJobs.map((job) => _buildOpportunityCard(job)).toList(),
        );
      },
    );
  }

  Widget _buildOpportunityCard(Map<String, dynamic> job) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceColor,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: AppTheme.textColor.withOpacity(0.04),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        job['title'] ?? 'Job Title',
                        style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2ECC71).withOpacity(0.08),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        job['category_name']?.toUpperCase() ?? 'CAT',
                        style: GoogleFonts.outfit(color: const Color(0xFF2ECC71), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  job['description'] ?? 'No description provided.',
                  style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontSize: 13, height: 1.4),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      flex: 5,
                      child: Row(
                        children: [
                          const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFF94A3B8)),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              '${job['location'] ?? 'Downtown'}${job['distance'] != null ? ' (${double.parse(job['distance'].toString()).toStringAsFixed(1)} km away)' : ''}',
                              style: GoogleFonts.outfit(color: const Color(0xFF94A3B8), fontSize: 12),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 4,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          const Icon(Icons.access_time_rounded, size: 14, color: Color(0xFF94A3B8)),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              job['created_at'] != null ? job['created_at'].toString().split('T').first : 'Unknown',
                              style: GoogleFonts.outfit(color: const Color(0xFF94A3B8), fontSize: 12),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Text(
                        'PKR ${(double.tryParse(job['budget'].toString()) ?? 150.0).toInt()}',
                        style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF003B95)),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () => context.push('/job-detail/${job['id']}'),
                      style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: Text(
                        'Bid Console',
                        style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  bool _shouldShowLocationWarning(Map<String, dynamic>? user) {
    if (user == null) return false;
    final lat = user['latitude'];
    final lng = user['longitude'];
    
    if (lat == null || lng == null) return true;
    
    final dLat = double.tryParse(lat.toString()) ?? 0.0;
    final dLng = double.tryParse(lng.toString()) ?? 0.0;
    
    return dLat == 0.0 && dLng == 0.0;
  }

  Widget _buildLocationWarning() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFECACA), width: 1.5),
      ),
      child: Row(
        children: [
          const Icon(Icons.location_off_outlined, color: Color(0xFFEF4444), size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Service Area Not Configured',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF991B1B), fontSize: 14),
                ),
                const SizedBox(height: 2),
                Text(
                  'Configure your default coordinates to find matching customer jobs around you.',
                  style: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF991B1B).withOpacity(0.85), height: 1.3),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: () => context.push('/profile', extra: true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            child: Text('Set Now', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 11)),
          ),
        ],
      ),
    );
  }
}
