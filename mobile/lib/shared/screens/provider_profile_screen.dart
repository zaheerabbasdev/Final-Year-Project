import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../features/provider/provider_service.dart';
import '../../shared/services/review_service.dart';
import '../../shared/widgets/review_card.dart';
import '../../core/api_client.dart';
import '../../core/providers/language_provider.dart';
import '../../core/theme.dart';
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
    final provider = await context.read<ProviderService>().getUserById(widget.providerId);
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
    final colors = Theme.of(context).appColors;
    final lang = context.watch<LanguageProvider>();
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_provider == null) {
      return Scaffold(
        appBar: AppBar(title: Text(lang.t('providerProfile.title'))),
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
                child: Text(lang.t('providerProfile.retry')),
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
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.surface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: colors.text),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(lang.t('providerProfile.title'), style: TextStyle(color: colors.text, fontWeight: FontWeight.bold)),
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
                  Text(_provider!['full_name'] ?? lang.t('common.unknown'), style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: colors.text)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.location_on_outlined, size: 16, color: colors.subtext),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          _provider!['location'] ?? lang.t('customerProfile.locationNotSet'),
                          style: TextStyle(color: colors.subtext, fontSize: 14),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  _buildStatsRow(profile, lang),
                  const SizedBox(height: 32),
                  if (profile?['bio'] != null && profile!['bio'].toString().isNotEmpty) ...[
                    Text(lang.t('providerProfile.about'), style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: colors.text)),
                    const SizedBox(height: 12),
                    Text(profile['bio'], style: TextStyle(color: colors.subtext, height: 1.6, fontSize: 14)),
                    const SizedBox(height: 32),
                  ],
                  if (profile?['skills'] != null) ...[
                    Text(lang.t('providerProfile.skills'), style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: colors.text)),
                    const SizedBox(height: 16),
                    _buildSkillsWrap(profile['skills'], lang),
                    const SizedBox(height: 32),
                  ],
                  _buildReviewsSection(lang),
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
    final isOnline = _provider?['profile']?['is_online'] == true || _provider?['profile']?['is_online'] == 1 || _provider?['profile']?['is_online'] == 'true';
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
          child: Stack(
            children: [
              Container(
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
                  backgroundColor: Theme.of(context).appColors.card,
                ),
              ),
              Positioned(
                bottom: 2,
                right: 2,
                child: Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: isOnline ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 3),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                ),
              ),
            ],
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

  Widget _buildStatsRow(Map<String, dynamic>? profile, LanguageProvider lang) {
    return Row(
      children: [
        Expanded(child: _buildStatCard(Icons.stars_outlined, (profile?['rating'] ?? '5.0').toString(), lang.t('providerProfile.rating'), const Color(0xFF10B981))),
        const SizedBox(width: 12),
        Expanded(child: _buildStatCard(Icons.work_outline, (profile?['jobs_completed'] ?? '0').toString(), lang.t('providerProfile.jobsDone'), const Color(0xFF6366F1))),
        const SizedBox(width: 12),
        Expanded(child: _buildStatCard(Icons.access_time, profile?['experience_years']?.toString() ?? '0', lang.t('provider.dashboard.yrs'), const Color(0xFFF59E0B))),
      ],
    );
  }

  Widget _buildStatCard(IconData icon, String value, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).appColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Theme.of(context).appColors.border),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Theme.of(context).appColors.text),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(color: Theme.of(context).appColors.subtext, fontSize: 10),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildSkillsWrap(dynamic skills, LanguageProvider lang) {
    List<String> skillsList = [];
    if (skills is List) {
      skillsList = List<String>.from(skills);
    } else if (skills is String) {
      // Assuming it might be a JSON string or comma separated
      skillsList = [skills];
    }

    if (skillsList.isEmpty) return Text(lang.t('providerProfile.noSkills'), style: TextStyle(color: Theme.of(context).appColors.subtext, fontStyle: FontStyle.italic));

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: skillsList.map((skill) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(color: Theme.of(context).appColors.card, borderRadius: BorderRadius.circular(12)),
        child: Text(skill, style: TextStyle(color: Theme.of(context).appColors.text, fontSize: 12, fontWeight: FontWeight.w600)),
      )).toList(),
    );
  }

  Widget _buildReviewsSection(LanguageProvider lang) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(lang.t('providerProfile.reviews'), style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Theme.of(context).appColors.text)),
            TextButton(
              onPressed: () => context.push('/provider-reviews/${widget.providerId}'),
              child: Text(lang.t('providerProfile.viewAll'), style: TextStyle(color: Theme.of(context).appColors.text, fontWeight: FontWeight.w600)),
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
                  color: Theme.of(context).appColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Theme.of(context).appColors.border),
                ),
                child: Center(
                  child: Text(lang.t('providerProfile.noReviews'), style: TextStyle(color: Theme.of(context).appColors.subtext)),
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
