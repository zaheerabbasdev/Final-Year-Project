import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_client.dart';
import '../../auth/auth_service.dart';
import '../category_service.dart';
import '../job_service.dart';
import '../../provider/provider_service.dart';

class CustomerHomeScreen extends StatefulWidget {
  const CustomerHomeScreen({super.key});

  @override
  State<CustomerHomeScreen> createState() => _CustomerHomeScreenState();
}

class _CustomerHomeScreenState extends State<CustomerHomeScreen> {
  final _searchController = TextEditingController();
  Timer? _debounce;
  bool _isSearching = false;

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      setState(() => _isSearching = query.isNotEmpty);
      if (query.isNotEmpty) {
        context.read<ProviderService>().searchProviders(query);
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CategoryService>().fetchCategories();
      context.read<JobService>().fetchJobs();
      context.read<ProviderService>().fetchTopProviders();
    });
  }

  @override
  Widget build(BuildContext context) {
    final avatarPath = context.watch<AuthService>().user?['avatar'];
    final avatarUrl = ApiClient.getImageUrl(avatarPath);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await Future.wait([
              context.read<CategoryService>().fetchCategories(),
              context.read<JobService>().fetchJobs(),
              context.read<ProviderService>().fetchTopProviders(),
            ]);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                _buildHeader(avatarUrl),
                const SizedBox(height: 20),
                _buildSearchBar(),
                const SizedBox(height: 24),
                if (_isSearching) ...[
                  _buildSectionHeader('Search Results', '', () {}),
                  const SizedBox(height: 16),
                  _buildSearchResults(),
                ] else ...[
                  _buildPromoCard(context),
                  const SizedBox(height: 32),
                  _buildSectionHeader('Browse Categories', 'See All', () {}),
                  const SizedBox(height: 16),
                  _buildCategoryGrid(),
                  const SizedBox(height: 32),
                  _buildSectionHeader('Your Recent Jobs', 'View All', () {}),
                  const SizedBox(height: 16),
                  _buildRecentJobsList(),
                  const SizedBox(height: 32),
                  _buildSectionHeader('Top Rated Providers', 'See All', () {}),
                  const SizedBox(height: 16),
                  _buildTopProvidersList(),
                ],
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(String? avatarUrl) {
    final userName = context.watch<AuthService>().user?['full_name'] ?? 'User';
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Customer Dashboard',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E293B),
              ),
            ),
            Text(
              'Welcome back, $userName!',
              style: const TextStyle(fontSize: 14, color: Color(0xFF64748B)),
            ),
          ],
        ),
        CircleAvatar(
          radius: 22,
          backgroundImage: avatarUrl != null 
            ? NetworkImage(avatarUrl)
            : const NetworkImage('https://i.pravatar.cc/150?u=zubair'),
          backgroundColor: const Color(0xFFF1F5F9),
        ),
      ],
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: TextField(
        controller: _searchController,
        onChanged: _onSearchChanged,
        decoration: InputDecoration(
          hintText: 'Search services or providers...',
          hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 16),
          prefixIcon: const Icon(Icons.search, color: Color(0xFF94A3B8)),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear, color: Color(0xFF94A3B8)),
                  onPressed: () {
                    _searchController.clear();
                    _onSearchChanged('');
                  },
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
    );
  }

  Widget _buildSearchResults() {
    return Consumer<ProviderService>(
      builder: (context, service, _) {
        if (service.isLoading) return const Center(child: CircularProgressIndicator());
        if (service.searchResults.isEmpty) {
          return const Center(child: Text('No providers found matching your search.'));
        }
        return ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: service.searchResults.length,
          itemBuilder: (context, index) {
            final provider = service.searchResults[index];
            final avatarUrl = ApiClient.getImageUrl(provider['avatar']);
            return ListTile(
              contentPadding: const EdgeInsets.symmetric(vertical: 8),
              leading: CircleAvatar(
                backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                child: avatarUrl == null ? Text(provider['full_name']?[0] ?? 'P') : null,
              ),
              title: Text(provider['full_name'] ?? 'Unknown Provider', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(provider['bio'] ?? 'No bio provided', maxLines: 1, overflow: TextOverflow.ellipsis),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.star, color: Colors.amber, size: 16),
                  const SizedBox(width: 4),
                  Text((provider['rating'] ?? 5.0).toString()),
                ],
              ),
              onTap: () {}, // Navigate to provider profile if exists
            );
          },
        );
      },
    );
  }

  Widget _buildPromoCard(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF6366F1), Color(0xFF10B981)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6366F1).withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Need a Service?',
            style: TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const SizedBox(
            width: 200,
            child: Text(
              'Post your job and get bids from qualified providers',
              style: TextStyle(color: Colors.white70, fontSize: 14),
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: () => context.push('/post-job'),
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Post a Job'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF6366F1),
              minimumSize: const Size(120, 44),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, String action, VoidCallback onAction) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1E293B),
          ),
        ),
        GestureDetector(
          onTap: onAction,
          child: Text(
            action,
            style: const TextStyle(
              color: Color(0xFF6366F1),
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCategoryGrid() {
    return Consumer<CategoryService>(
      builder: (context, service, _) {
        if (service.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        final categories = service.categories;
        if (categories.isEmpty) {
          return const Center(child: Text('No categories available'));
        }

        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 0.8,
          ),
          itemCount: categories.length,
          itemBuilder: (context, index) {
            final cat = categories[index];
            final iconData = _getIconData(cat['icon']);
            return InkWell(
              onTap: () {},
              borderRadius: BorderRadius.circular(16),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF6366F1).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(iconData, color: const Color(0xFF6366F1)),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    cat['name'] as String,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF475569)),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  IconData _getIconData(String? iconName) {
    switch (iconName) {
      case 'plumber_icon': return Icons.build_outlined;
      case 'electrician_icon': return Icons.bolt_outlined;
      case 'carpenter_icon': return Icons.handyman_outlined;
      case 'painter_icon': return Icons.format_paint_outlined;
      case 'cleaner_icon': return Icons.cleaning_services_outlined;
      case 'gardener_icon': return Icons.eco_outlined;
      case 'ac_repair_icon': return Icons.ac_unit_outlined;
      case 'appliance_repair_icon': return Icons.electrical_services_outlined;
      default: return Icons.home_repair_service_outlined;
    }
  }

  Widget _buildRecentJobsList() {
    return Consumer<JobService>(
      builder: (context, service, _) {
        if (service.isLoading) return const Center(child: CircularProgressIndicator());
        if (service.jobs.isEmpty) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Text('No recent jobs found.', style: TextStyle(color: Color(0xFF94A3B8))),
            ),
          );
        }
        return Column(
          children: service.jobs.take(3).map((job) => _buildJobCard(
            id: job['id'],
            title: job['title'],
            description: job['description'] ?? 'No description provided.',
            price: double.tryParse(job['budget'].toString()) ?? 0.0,
            location: job['location'] ?? 'Unknown',
            bids: job['bid_count'] ?? 0,
            status: job['status'],
            isNegotiable: job['is_negotiable'] == 1 || job['is_negotiable'] == true,
          )).toList(),
        );
      },
    );
  }

  Widget _buildJobCard({
    required int id,
    required String title,
    required String description,
    required double price,
    required String location,
    required int bids,
    required String status,
    required bool isNegotiable,
  }) {
    return InkWell(
      onTap: () => context.push('/job-detail/$id'),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
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
                    title,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF6366F1).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    status.toUpperCase(),
                    style: const TextStyle(color: Color(0xFF6366F1), fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              description,
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Text(
                  '\$$price',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF6366F1)),
                ),
                if (isNegotiable) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF6366F1).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'NEGOTIABLE',
                      style: TextStyle(color: Color(0xFF6366F1), fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                    ),
                  ),
                ],
                const SizedBox(width: 16),
                const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFF94A3B8)),
                const SizedBox(width: 4),
                Flexible(
                  child: Text(
                    location,
                    style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const Spacer(),
                const Icon(Icons.trending_up, size: 14, color: Color(0xFF94A3B8)),
                const SizedBox(width: 4),
                Text('$bids bids', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopProvidersList() {
    return Consumer<ProviderService>(
      builder: (context, service, _) {
        if (service.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        final providers = service.topProviders;
        if (providers.isEmpty) {
          return const Center(child: Text('No top providers found'));
        }

        return SizedBox(
          height: 170,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: providers.length,
            itemBuilder: (context, index) {
              final provider = providers[index];
              final avatarUrl = ApiClient.getImageUrl(provider['avatar']);
              return Container(
                width: 160,
                margin: const EdgeInsets.only(right: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFF1F5F9)),
                ),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundImage: avatarUrl != null 
                        ? NetworkImage(avatarUrl)
                        : const NetworkImage('https://i.pravatar.cc/150?u=provider'),
                      backgroundColor: const Color(0xFFF1F5F9),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      provider['full_name'] as String,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          (provider['rating'] ?? 0.0).toString(),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }
}
