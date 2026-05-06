import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../customer/job_service.dart';
import '../../../core/api_client.dart';
import '../../auth/auth_service.dart';
import '../../../shared/services/navigation_service.dart';
import '../../../shared/providers/sync_provider.dart';

import '../../provider/provider_service.dart';
import '../../../core/services/location_service.dart';
import '../../notifications/notification_provider.dart';
import '../../../shared/widgets/notification_bell.dart';

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
    final String firstName = user?['full_name']?.split(' ').first ?? 'Mike';
    final avatarPath = user?['avatar'];
    final avatarUrl = ApiClient.getImageUrl(avatarPath);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Provider Dashboard',
              style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold, fontSize: 18),
            ),
            Text(
              'Welcome back, $firstName!',
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.normal),
            ),
          ],
        ),
        actions: [
          const NotificationBell(),
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: CircleAvatar(
              radius: 18,
              backgroundImage: avatarUrl != null 
                ? NetworkImage(avatarUrl)
                : const NetworkImage('https://i.pravatar.cc/150?u=mike'),
              backgroundColor: const Color(0xFFF1F5F9),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => context.read<SyncProvider>().syncAll(context),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (user != null && _shouldShowLocationWarning(user))
                _buildLocationWarning(),
              if (user != null && _shouldShowLocationWarning(user))
                const SizedBox(height: 24),
              _buildStatsGrid(),
              const SizedBox(height: 32),
              _buildSectionHeader('Quick Actions'),
              const SizedBox(height: 16),
              _buildQuickActions(),
              const SizedBox(height: 32),
              _buildEarningsCard(),
              const SizedBox(height: 32),
              _buildSectionHeader(
                _isNearMeEnabled ? 'Jobs Near You (20km)' : 'New Job Opportunities', 
                action: _isLocating ? 'Locating...' : (_isNearMeEnabled ? 'Show All' : 'Near Me'), 
                onAction: _toggleNearMe
              ),
              const SizedBox(height: 16),
              _buildOpportunitiesList(),
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
        Text(
          title,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
        ),
        if (action != null)
          TextButton(
            onPressed: onAction,
            child: Text(
              action,
              style: const TextStyle(color: Color(0xFF6366F1), fontWeight: FontWeight.w600),
            ),
          ),
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
          childAspectRatio: 1.1,
          children: [
            _buildStatCard('Active Jobs', activeJobsCount.toString(), Icons.work_outline, const Color(0xFF6366F1)),
            _buildStatCard('Rating', (stats?['rating'] ?? '0.0').toString(), Icons.star_outline, const Color(0xFF10B981)),
            _buildStatCard('Jobs Done', completedJobsCount.toString(), Icons.check_circle_outline, const Color(0xFFF59E0B)),
            _buildStatCard('Experience', '${stats?['experience_years'] ?? '0'} Yrs', Icons.access_time, const Color(0xFF6366F1).withOpacity(0.7)),
          ],
        );
      },
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Row(
      children: [
        Expanded(child: _buildActionItem(Icons.business_center_outlined, 'Browse Jobs', () => context.push('/browse-jobs'))),
        const SizedBox(width: 16),
        Expanded(child: _buildActionItem(Icons.trending_up, 'My Bids', () => context.read<NavigationService>().setIndex(2))),
      ],
    );
  }

  Widget _buildActionItem(IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFF1F5F9)),
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFF64748B), size: 24),
            const SizedBox(height: 12),
            Text(
              label,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1E293B)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEarningsCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "This Month's Earnings",
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
              ),
              TextButton(
                onPressed: () {},
                child: const Text('View All', style: TextStyle(color: Color(0xFF64748B), fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '\$${context.watch<ProviderService>().dashboardStats?['total_earnings'] ?? '0'}',
            style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF6366F1)),
          ),
          const SizedBox(height: 32),
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
              width: 12,
              height: 100 * heights[index],
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(height: 12),
            Text(days[index], style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10)),
          ],
        );
      }),
    );
  }

  Widget _buildOpportunitiesList() {
    return Consumer<JobService>(
      builder: (context, service, _) {
        final openJobs = service.jobs.take(3).toList();
        if (openJobs.isEmpty) return const Center(child: Text('No new opportunities.'));
        return Column(
          children: openJobs.map((job) => _buildOpportunityCard(job)).toList(),
        );
      },
    );
  }

  Widget _buildOpportunityCard(Map<String, dynamic> job) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  job['title'] ?? 'Job Title',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  job['category_name']?.toUpperCase() ?? 'CAT',
                  style: const TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            job['description'] ?? 'No description provided.',
            style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFF94A3B8)),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  '${job['location'] ?? 'Downtown'}${job['distance'] != null ? ' (${double.parse(job['distance'].toString()).toStringAsFixed(1)} km away)' : ''}',
                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 16),
              const Icon(Icons.access_time, size: 14, color: Color(0xFF94A3B8)),
              const SizedBox(width: 4),
              Text(
                job['created_at'] != null ? job['created_at'].toString().split('T').first : 'Unknown',
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '\$${job['budget'] ?? '150'}',
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF6366F1)),
              ),
              ElevatedButton.icon(
                onPressed: () => context.push('/job-detail/${job['id']}'),
                icon: const Icon(Icons.chevron_right, size: 16),
                label: const Text('Place Bid'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  bool _shouldShowLocationWarning(Map<String, dynamic>? user) {
    if (user == null) return false;
    final lat = user['latitude'];
    final lng = user['longitude'];
    
    // Show warning if coordinates are missing, null, or exactly zero
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
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Row(
        children: [
          const Icon(Icons.location_off_outlined, color: Color(0xFFEF4444)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Service Area Not Set',
                  style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF991B1B)),
                ),
                Text(
                  'Set your location in profile to see jobs near you automatically.',
                  style: TextStyle(fontSize: 12, color: const Color(0xFF991B1B).withOpacity(0.8)),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () => context.push('/profile', extra: true), // Open profile in edit mode
            child: const Text('Set Now', style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
