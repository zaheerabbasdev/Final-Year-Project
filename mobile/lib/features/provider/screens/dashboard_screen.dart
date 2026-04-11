import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../customer/job_service.dart';
import '../../../core/api_client.dart';
import '../../auth/auth_service.dart';

import '../../provider/provider_service.dart';

class ProviderDashboardScreen extends StatefulWidget {
  const ProviderDashboardScreen({super.key});

  @override
  State<ProviderDashboardScreen> createState() => _ProviderDashboardScreenState();
}

class _ProviderDashboardScreenState extends State<ProviderDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<JobService>().fetchJobs();
      context.read<ProviderService>().fetchDashboardStats();
    });
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStatsGrid(),
            const SizedBox(height: 32),
            _buildSectionHeader('Quick Actions'),
            const SizedBox(height: 16),
            _buildQuickActions(),
            const SizedBox(height: 32),
            _buildEarningsCard(),
            const SizedBox(height: 32),
            _buildSectionHeader('New Job Opportunities', action: 'See All', onAction: () => context.push('/browse-jobs')),
            const SizedBox(height: 16),
            _buildOpportunitiesList(),
          ],
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
        return GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 1.1,
          children: [
            _buildStatCard('Active Jobs', '0', Icons.work_outline, const Color(0xFF6366F1)), // Need booking service for this
            _buildStatCard('Rating', (stats?['rating'] ?? '0.0').toString(), Icons.star_outline, const Color(0xFF10B981)),
            _buildStatCard('Jobs Done', (stats?['total_jobs'] ?? '0').toString(), Icons.check_circle_outline, const Color(0xFFF59E0B)),
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
        Expanded(child: _buildActionItem(Icons.trending_up, 'My Bids', () => context.push('/my-bids'))),
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
                  job['location'] ?? 'Downtown',
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
}
