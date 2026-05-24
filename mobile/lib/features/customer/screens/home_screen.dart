import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/api_client.dart';
import '../../../core/theme.dart';
import '../../auth/auth_service.dart';
import '../category_service.dart';
import '../job_service.dart';
import '../../provider/provider_service.dart';
import '../../notifications/notification_provider.dart';
import '../../../shared/widgets/notification_bell.dart';
import '../../../shared/widgets/wallet_bottom_sheet.dart';

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
    final userName = context.watch<AuthService>().user?['full_name'] ?? 'User';
    final avatarPath = context.watch<AuthService>().user?['avatar'];
    final avatarUrl = ApiClient.getImageUrl(avatarPath);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        child: RefreshIndicator(
          color: const Color(0xFF003B95),
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
                const SizedBox(height: 20),
                _buildHeader(avatarUrl),
                const SizedBox(height: 20),
                _buildSearchBar(),
                const SizedBox(height: 24),
                if (_isSearching) ...[
                  _buildSectionHeader('Search Results', '', () {}),
                  const SizedBox(height: 16),
                  _buildSearchResults(),
                ] else ...[
                  _buildWalletCard(userName),
                  const SizedBox(height: 24),
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
    final firstName = userName.split(' ').first;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome Back,',
              style: GoogleFonts.outfit(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              '$firstName 👋',
              style: GoogleFonts.outfit(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF1E293B),
              ),
            ),
          ],
        ),
        Row(
          children: [
            const NotificationBell(color: Color(0xFF1E293B)),
            const SizedBox(width: 12),
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
                radius: 22,
                backgroundImage: avatarUrl != null 
                  ? NetworkImage(avatarUrl)
                  : const NetworkImage('https://i.pravatar.cc/150?u=zubair'),
                backgroundColor: const Color(0xFFF1F5F9),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18),
      decoration: BoxDecoration(
        color: AppTheme.surfaceColor,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: AppTheme.textColor.withOpacity(0.04),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: TextField(
        controller: _searchController,
        onChanged: _onSearchChanged,
        decoration: InputDecoration(
          hintText: 'Search services or providers...',
          hintStyle: GoogleFonts.outfit(color: const Color(0xFF94A3B8), fontSize: 15),
          prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8)),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear_rounded, color: Color(0xFF94A3B8)),
                  onPressed: () {
                    _searchController.clear();
                    _onSearchChanged('');
                  },
                )
              : null,
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 16),
        ),
        style: GoogleFonts.outfit(fontSize: 15, color: const Color(0xFF1E293B)),
      ),
    );
  }

  Widget _buildWalletCard(String userName) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF003B95), Color(0xFF0A84FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF003B95).withOpacity(0.22),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      padding: const EdgeInsets.all(22),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.account_balance_wallet_rounded, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Kaarkun Wallet',
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'ACTIVE',
                  style: GoogleFonts.outfit(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Available Balance',
                    style: GoogleFonts.outfit(color: Colors.white70, fontSize: 12),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'PKR 12,500.00',
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              ElevatedButton(
                onPressed: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (context) => WalletBottomSheet(userName: userName),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: const Color(0xFF003B95),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: Text(
                  'Manage',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
            ],
          ),
        ],
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
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                leading: CircleAvatar(
                  backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                  child: avatarUrl == null ? Text(provider['full_name']?[0] ?? 'P') : null,
                ),
                title: Text(provider['full_name'] ?? 'Unknown Provider', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                subtitle: Text(provider['bio'] ?? 'No bio provided', maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.outfit()),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star_rounded, color: Colors.amber, size: 18),
                    const SizedBox(width: 4),
                    Text(
                      (provider['rating'] ?? 5.0).toString(),
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                onTap: () {},
              ),
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
          colors: [Color(0xFF003B95), Color(0xFF0A84FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF003B95).withOpacity(0.22),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Need a Service?',
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: 220,
            child: Text(
              'Post your job request instantly and receive bids from pre-verified professional workers.',
              style: GoogleFonts.outfit(color: Colors.white70, fontSize: 13, height: 1.4),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => context.push('/post-job'),
            icon: const Icon(Icons.add_circle_outline_rounded, size: 18),
            label: const Text('Post a Job Request'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF003B95),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
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
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1E293B),
          ),
        ),
        if (action.isNotEmpty)
          GestureDetector(
            onTap: onAction,
            child: Text(
              action,
              style: GoogleFonts.outfit(
                color: const Color(0xFF0A84FF),
                fontWeight: FontWeight.bold,
                fontSize: 13,
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
            crossAxisSpacing: 12,
            childAspectRatio: 0.82,
          ),
          itemCount: categories.length,
          itemBuilder: (context, index) {
            final cat = categories[index];
            final iconData = _getIconData(cat['icon']);
            
            // Premium colored containers for categories
            final List<Color> bgColors = [
              const Color(0xFF003B95).withOpacity(0.06),
              const Color(0xFF0A84FF).withOpacity(0.06),
              const Color(0xFF2ECC71).withOpacity(0.06),
              const Color(0xFFFFB020).withOpacity(0.06),
            ];
            
            final List<Color> iconColors = [
              const Color(0xFF003B95),
              const Color(0xFF0A84FF),
              const Color(0xFF2ECC71),
              const Color(0xFFFFB020),
            ];
            
            final colorIdx = index % 4;

            return InkWell(
              onTap: () {},
              borderRadius: BorderRadius.circular(20),
              child: Column(
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: bgColors[colorIdx],
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: iconColors[colorIdx].withOpacity(0.12), width: 1.5),
                    ),
                    alignment: Alignment.center,
                    child: Icon(iconData, color: iconColors[colorIdx], size: 26),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    cat['name'] as String,
                    style: GoogleFonts.outfit(
                      fontSize: 11, 
                      fontWeight: FontWeight.w600, 
                      color: const Color(0xFF1E293B),
                    ),
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
      case 'plumber_icon': return Icons.plumbing_rounded;
      case 'electrician_icon': return Icons.electrical_services_rounded;
      case 'carpenter_icon': return Icons.handyman_rounded;
      case 'painter_icon': return Icons.format_paint_rounded;
      case 'cleaner_icon': return Icons.cleaning_services_rounded;
      case 'gardener_icon': return Icons.yard_rounded;
      case 'ac_repair_icon': return Icons.ac_unit_rounded;
      case 'appliance_repair_icon': return Icons.kitchen_rounded;
      default: return Icons.home_repair_service_rounded;
    }
  }

  Widget _buildRecentJobsList() {
    return Consumer<JobService>(
      builder: (context, service, _) {
        if (service.isLoading) return const Center(child: CircularProgressIndicator());
        if (service.jobs.isEmpty) {
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
                'No jobs posted yet. Create one to begin!',
                style: GoogleFonts.outfit(color: const Color(0xFF94A3B8), fontSize: 14),
              ),
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
            isEmergency: job['is_emergency'] == 1 || job['is_emergency'] == true,
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
    required bool isEmergency,
  }) {
    Color statusBgColor = const Color(0xFF0A84FF).withOpacity(0.08);
    Color statusTextColor = const Color(0xFF0A84FF);
    if (status.toLowerCase() == 'completed') {
      statusBgColor = const Color(0xFF2ECC71).withOpacity(0.08);
      statusTextColor = const Color(0xFF2ECC71);
    } else if (status.toLowerCase() == 'active') {
      statusBgColor = const Color(0xFFFFB020).withOpacity(0.08);
      statusTextColor = const Color(0xFFFFB020);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceColor,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: AppTheme.textColor.withOpacity(0.04),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: InkWell(
        onTap: () => context.push('/job-detail/$id'),
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: GoogleFonts.outfit(
                        fontSize: 16, 
                        fontWeight: FontWeight.bold, 
                        color: const Color(0xFF1E293B),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusBgColor,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      status.toUpperCase(),
                      style: GoogleFonts.outfit(
                        color: statusTextColor, 
                        fontSize: 10, 
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  if (isEmergency) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Color(0xFFFEF2F2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.flash_on_rounded, color: Color(0xFFEF4444), size: 14),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 8),
              Text(
                description,
                style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontSize: 13, height: 1.4),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Text(
                    'PKR ${price.toStringAsFixed(0)}',
                    style: GoogleFonts.outfit(
                      fontSize: 16, 
                      fontWeight: FontWeight.bold, 
                      color: const Color(0xFF003B95),
                    ),
                  ),
                  if (isNegotiable) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFF003B95).withOpacity(0.08),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'NEGOTIABLE',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF003B95), 
                          fontSize: 9, 
                          fontWeight: FontWeight.bold, 
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                  const Spacer(),
                  const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFF94A3B8)),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      location,
                      style: GoogleFonts.outfit(color: const Color(0xFF94A3B8), fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Icon(Icons.trending_up_rounded, size: 14, color: Color(0xFF2ECC71)),
                  const SizedBox(width: 4),
                  Text(
                    '$bids bids', 
                    style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ],
          ),
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
          height: 180,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: providers.length,
            itemBuilder: (context, index) {
              final provider = providers[index];
              final avatarUrl = ApiClient.getImageUrl(provider['avatar']);
              return Container(
                width: 150,
                margin: const EdgeInsets.only(right: 16, bottom: 8),
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceColor,
                  borderRadius: BorderRadius.circular(26),
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
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFF0A84FF).withOpacity(0.2), width: 2),
                      ),
                      child: CircleAvatar(
                        radius: 28,
                        backgroundImage: avatarUrl != null 
                          ? NetworkImage(avatarUrl)
                          : const NetworkImage('https://i.pravatar.cc/150?u=provider'),
                        backgroundColor: const Color(0xFFF1F5F9),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      provider['full_name'] as String,
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14, color: const Color(0xFF1E293B)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFB020).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star_rounded, color: Color(0xFFFFB020), size: 14),
                          const SizedBox(width: 4),
                          Text(
                            (provider['rating'] ?? 5.0).toString(),
                            style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 11, color: const Color(0xFFB45309)),
                          ),
                        ],
                      ),
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
