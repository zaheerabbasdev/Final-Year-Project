import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../customer/job_service.dart';
import '../../customer/category_service.dart';
import '../../../core/services/location_service.dart';
import '../../../shared/widgets/notification_bell.dart';
import '../../../core/theme.dart';

class BrowseJobsScreen extends StatefulWidget {
  const BrowseJobsScreen({super.key});

  @override
  State<BrowseJobsScreen> createState() => _BrowseJobsScreenState();
}

class _BrowseJobsScreenState extends State<BrowseJobsScreen> {
  final _searchController = TextEditingController();
  String selectedCategory = 'All Categories';
  String selectedSort = 'Most Recent';
  Timer? _debounce;
  bool _isNearMeEnabled = false;
  bool _isLocating = false;
  final LocationService _locationService = LocationService();

  bool _checkIsEmergency(dynamic val) {
    if (val == null) return false;
    if (val is bool) return val;
    if (val is int) return val == 1;
    final str = val.toString().toLowerCase();
    return str == '1' || str == 'true';
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      final filters = <String, dynamic>{'status': 'open'};
      if (query.isNotEmpty) filters['search'] = query;
      if (selectedCategory != 'All Categories') {
        final categories = context.read<CategoryService>().categories;
        final cat = categories.firstWhere((c) => c['name'] == selectedCategory, orElse: () => null);
        if (cat != null) filters['category_id'] = cat['id'];
      }
      if (_isNearMeEnabled) {
        _performNearMeSearch(filters);
      } else {
        context.read<JobService>().fetchJobs(filters: filters);
      }
    });
  }

  Future<void> _performNearMeSearch(Map<String, dynamic> baseFilters) async {
    try {
      final pos = await _locationService.getCurrentLocation();
      if (pos != null) {
        baseFilters.addAll({
          'lat': pos.latitude,
          'lng': pos.longitude,
          'radius': 20,
        });
        context.read<JobService>().fetchJobs(filters: baseFilters);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString(), style: GoogleFonts.outfit()),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  Future<void> _toggleNearMe() async {
    if (_isNearMeEnabled) {
      setState(() => _isNearMeEnabled = false);
      context.read<JobService>().fetchJobs(filters: {'status': 'open'});
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
          'radius': 20,
          'status': 'open',
        });
      }
    } catch (e) {
      setState(() => _isLocating = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString(), style: GoogleFonts.outfit()),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
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
      context.read<JobService>().fetchJobs(filters: {'status': 'open'});
      context.read<CategoryService>().fetchCategories();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.white,
        scrolledUnderElevation: 0,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.textColor),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Browse Jobs',
          style: GoogleFonts.outfit(color: AppTheme.textColor, fontWeight: FontWeight.bold, fontSize: 20),
        ),
        actions: const [
          NotificationBell(color: AppTheme.textColor),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          _buildFilterRow(),
          _buildResultsHeader(),
          Expanded(
            child: Consumer<JobService>(
              builder: (context, service, _) {
                if (service.isLoading) {
                  return const Center(
                    child: CircularProgressIndicator(color: AppTheme.primaryColor),
                  );
                }
                if (service.jobs.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.search_off_rounded, size: 64, color: AppTheme.subtextColor.withOpacity(0.3)),
                        const SizedBox(height: 16),
                        Text(
                          'No open jobs found',
                          style: GoogleFonts.outfit(
                            color: AppTheme.subtextColor,
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  itemCount: service.jobs.length,
                  itemBuilder: (context, index) {
                    final job = service.jobs[index];
                    return _buildJobCard(job);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppTheme.textColor.withOpacity(0.02),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: TextField(
          controller: _searchController,
          onChanged: _onSearchChanged,
          style: GoogleFonts.outfit(color: AppTheme.textColor, fontSize: 15),
          decoration: InputDecoration(
            hintText: 'Search jobs...',
            hintStyle: GoogleFonts.outfit(color: AppTheme.subtextColor.withOpacity(0.7)),
            prefixIcon: const Icon(Icons.search, color: AppTheme.subtextColor),
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppTheme.secondaryColor, width: 1.5),
            ),
            contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
          ),
        ),
      ),
    );
  }

  Widget _buildFilterRow() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: _buildFilterButton(
              label: selectedCategory,
              onTap: _showCategoryPicker,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _buildFilterButton(
              label: selectedSort,
              onTap: _showSortPicker,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterButton({required String label, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.outfit(fontSize: 14, color: AppTheme.textColor, fontWeight: FontWeight.w600),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const Icon(Icons.keyboard_arrow_down, size: 18, color: AppTheme.subtextColor),
          ],
        ),
      ),
    );
  }

  void _showSortPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (context) {
        final options = ['Most Recent', 'Highest Budget', 'Lowest Budget'];
        return SingleChildScrollView(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(height: 24),
              Text(
                'Sort By',
                style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textColor),
              ),
              const SizedBox(height: 16),
              ...options.map((opt) => ListTile(
                title: Text(
                  opt,
                  style: GoogleFonts.outfit(
                    color: selectedSort == opt ? AppTheme.primaryColor : AppTheme.textColor,
                    fontWeight: selectedSort == opt ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
                trailing: selectedSort == opt ? const Icon(Icons.check, color: AppTheme.primaryColor) : null,
                onTap: () {
                  setState(() => selectedSort = opt);
                  Navigator.pop(context);
                },
              )),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Widget _buildResultsHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Consumer<JobService>(
            builder: (context, service, _) => Text(
              '${service.jobs.length} ${_isNearMeEnabled ? 'nearby ' : ''}jobs found',
              style: GoogleFonts.outfit(color: AppTheme.subtextColor, fontSize: 13, fontWeight: FontWeight.w500),
            ),
          ),
          TextButton.icon(
            onPressed: _toggleNearMe,
            icon: Icon(_isNearMeEnabled ? Icons.location_off : Icons.near_me, size: 16, color: AppTheme.secondaryColor),
            label: Text(
              _isLocating ? 'Locating...' : (_isNearMeEnabled ? 'Show All' : 'Near Me'), 
              style: GoogleFonts.outfit(color: AppTheme.secondaryColor, fontSize: 14, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  void _showCategoryPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (context) {
        final categories = context.read<CategoryService>().categories;
        return Container(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.6),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(2)),
                ),
                const SizedBox(height: 24),
                Text(
                  'Select Category',
                  style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textColor),
                ),
                const SizedBox(height: 16),
                ListTile(
                  leading: const Icon(Icons.grid_view, color: AppTheme.primaryColor),
                  title: Text('All Categories', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
                  onTap: () {
                    setState(() => selectedCategory = 'All Categories');
                    context.read<JobService>().fetchJobs(filters: {'status': 'open'});
                    Navigator.pop(context);
                  },
                ),
                const Divider(color: Color(0xFFF1F5F9)),
                ...categories.map((cat) => ListTile(
                  leading: const Icon(Icons.category_outlined, color: AppTheme.primaryColor),
                  title: Text(cat['name'] as String, style: GoogleFonts.outfit(fontWeight: FontWeight.w500)),
                  onTap: () {
                    setState(() => selectedCategory = cat['name'] as String);
                    context.read<JobService>().fetchJobs(filters: {
                      'category_id': cat['id'],
                      'status': 'open',
                    });
                    Navigator.pop(context);
                  },
                )),
                const SizedBox(height: 16),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildJobCard(Map<String, dynamic> job) {
    final isEmergency = _checkIsEmergency(job['is_emergency']);
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppTheme.textColor.withOpacity(0.03),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
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
                    job['title'] ?? 'Job Title',
                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textColor),
                  ),
                ),
                if (isEmergency)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.errorColor.withOpacity(0.2)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.bolt, color: AppTheme.errorColor, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          'EMERGENCY',
                          style: GoogleFonts.outfit(color: AppTheme.errorColor, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              job['description'] ?? 'No description provided.',
              style: GoogleFonts.outfit(color: AppTheme.subtextColor, fontSize: 13, height: 1.5),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.secondaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                job['category_name']?.toUpperCase() ?? 'CAT',
                style: GoogleFonts.outfit(color: AppTheme.secondaryColor, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.calendar_today_outlined, size: 14, color: AppTheme.subtextColor),
                const SizedBox(width: 6),
                Text(
                  job['created_at'] != null ? job['created_at'].toString().split('T').first : 'Unknown',
                  style: GoogleFonts.outfit(color: AppTheme.subtextColor, fontSize: 12, fontWeight: FontWeight.w500),
                ),
                const SizedBox(width: 16),
                const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.subtextColor),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    '${job['location'] ?? 'Downtown'}${job['distance'] != null ? ' (${double.parse(job['distance'].toString()).toStringAsFixed(1)} km away)' : ''}',
                    style: GoogleFonts.outfit(color: AppTheme.subtextColor, fontSize: 12, fontWeight: FontWeight.w500),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(color: Color(0xFFF1F5F9), height: 1),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Budget',
                        style: GoogleFonts.outfit(color: AppTheme.subtextColor, fontSize: 11, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 2),
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(
                            '\$${job['budget'] ?? '0'}',
                            style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800, color: AppTheme.primaryColor),
                          ),
                          if (job['is_negotiable'].toString() == '1' || job['is_negotiable'] == true || job['is_negotiable'].toString() == 'true')
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryColor.withOpacity(0.08),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'NEGOTIABLE',
                                style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: () => context.push('/job-detail/${job['id']}'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isEmergency ? AppTheme.errorColor : AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(110, 48),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text(
                    isEmergency ? 'Accept Instantly' : 'Place Bid',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
