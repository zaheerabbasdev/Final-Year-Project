import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../features/provider/provider_service.dart';
import '../../shared/services/review_service.dart';
import '../../shared/widgets/review_card.dart';
import '../../core/api_client.dart';
import 'package:go_router/go_router.dart';

class ProviderProfileScreen extends StatefulWidget {
  final int providerId;
  const ProviderProfileScreen({super.key, required this.providerId});

  @override
  State<ProviderProfileScreen> createState() => _ProviderProfileScreenState();
}

class _ProviderProfileScreenState extends State<ProviderProfileScreen> {
  Map<String, dynamic>? _provider;
  bool _isLoading = true;
  Future<List<dynamic>>? _reviewsFuture;

  @override
  void initState() {
    super.initState();
    _loadProvider();
  }

  void _loadReviews() {
    _reviewsFuture = context.read<ReviewService>().fetchProviderReviews(widget.providerId, limit: 3);
  }

  Future<void> _loadProvider() async {
    setState(() => _isLoading = true);
    final provider = await context.read<ProviderService>().getProviderById(widget.providerId);
    if (mounted) {
      setState(() {
        _provider = provider;
        _isLoading = false;
      });
      _loadReviews();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_provider == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Profile')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Provider not found (ID: ${widget.providerId})'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => _loadProvider(),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    final avatarPath = _provider!['avatar'];
    final avatarUrl = ApiClient.getImageUrl(avatarPath);
    final profile = _provider!['profile'];
    final categoryName = profile?['category_name'] ?? _provider!['category_name'] ?? 'Provider';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1E293B)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Provider Profile', style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildHeader(avatarUrl, categoryName),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_provider!['full_name'] ?? 'No Name', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 16, color: Color(0xFF64748B)),
                      const SizedBox(width: 4),
                      Text(_provider!['location'] ?? 'Location not specified', style: const TextStyle(color: Color(0xFF64748B), fontSize: 14)),
                    ],
                  ),
                  const SizedBox(height: 32),
                  _buildStatsRow(profile),
                  const SizedBox(height: 32),
                  if (profile?['bio'] != null && profile!['bio'].toString().isNotEmpty) ...[
                    const Text('About', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                    const SizedBox(height: 12),
                    Text(profile['bio'], style: const TextStyle(color: Color(0xFF64748B), height: 1.6, fontSize: 14)),
                    const SizedBox(height: 32),
                  ],
                  if (profile?['skills'] != null) ...[
                    const Text('Specialized Skills', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                    const SizedBox(height: 16),
                    _buildSkillsWrap(profile['skills']),
                    const SizedBox(height: 32),
                  ],
                  _buildReviewsSection(),
                  const SizedBox(height: 48),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(String? avatarUrl, String categoryName) {
    return Stack(
      alignment: Alignment.center,
      children: [
        Column(
          children: [
            Container(
              height: 140,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF10B981)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
            ),
            const SizedBox(height: 60),
          ],
        ),
        Positioned(
          top: 80,
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 4),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4))],
            ),
            child: CircleAvatar(
              radius: 50,
              backgroundImage: avatarUrl != null 
                ? NetworkImage(avatarUrl) as ImageProvider
                : const NetworkImage('https://i.pravatar.cc/150?u=mike'),
              backgroundColor: const Color(0xFFF1F5F9),
            ),
          ),
        ),
        Positioned(
          top: 170,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(color: const Color(0xFF10B981), borderRadius: BorderRadius.circular(20)),
            child: Text(categoryName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
          ),
        ),
      ],
    );
  }

  Widget _buildStatsRow(Map<String, dynamic>? profile) {
    return Row(
      children: [
        Expanded(child: _buildStatCard(Icons.stars_outlined, (profile?['rating'] ?? '5.0').toString(), 'Rating', const Color(0xFF10B981))),
        const SizedBox(width: 12),
        Expanded(child: _buildStatCard(Icons.work_outline, (profile?['jobs_completed'] ?? '0').toString(), 'Jobs Done', const Color(0xFF6366F1))),
        const SizedBox(width: 12),
        Expanded(child: _buildStatCard(Icons.access_time, '${profile?['experience_years']?.toString() ?? '0'} Yrs', 'Experience', const Color(0xFFF59E0B))),
      ],
    );
  }

  Widget _buildStatCard(IconData icon, String value, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10)),
        ],
      ),
    );
  }

  Widget _buildSkillsWrap(dynamic skills) {
    List<String> skillsList = [];
    if (skills is List) {
      skillsList = List<String>.from(skills);
    } else if (skills is String) {
      // Assuming it might be a JSON string or comma separated
      skillsList = [skills];
    }

    if (skillsList.isEmpty) return const Text('No skills listed', style: TextStyle(color: Color(0xFF94A3B8), fontStyle: FontStyle.italic));

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: skillsList.map((skill) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(12)),
        child: Text(skill, style: const TextStyle(color: Color(0xFF475569), fontSize: 12, fontWeight: FontWeight.w600)),
      )).toList(),
    );
  }

  Widget _buildReviewsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Reviews', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
            TextButton(
              onPressed: () => context.push('/provider-reviews/${widget.providerId}'),
              child: const Text('View All', style: TextStyle(color: Color(0xFF6366F1))),
            ),
          ],
        ),
        const SizedBox(height: 8),
        FutureBuilder<List<dynamic>>(
          future: _reviewsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError || !snapshot.hasData || snapshot.data!.isEmpty) {
              return Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Center(
                  child: Text('No reviews yet', style: TextStyle(color: Color(0xFF94A3B8))),
                ),
              );
            }

            return Column(
              children: snapshot.data!.map((review) => ReviewCard(review: review)).toList(),
            );
          },
        ),
      ],
    );
  }
}
