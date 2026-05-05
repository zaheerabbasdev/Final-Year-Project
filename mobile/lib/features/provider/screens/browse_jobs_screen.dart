import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../customer/job_service.dart';
import '../../customer/category_service.dart';
import '../../../core/services/location_service.dart';
import '../../../shared/widgets/notification_bell.dart';

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
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
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
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
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
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1E293B)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Browse Jobs',
          style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          const NotificationBell(color: Color(0xFF1E293B)),
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
                if (service.isLoading) return const Center(child: CircularProgressIndicator());
                if (service.jobs.isEmpty) return const Center(child: Text('No jobs found.'));
                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
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
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(16),
        ),
        child: TextField(
          controller: _searchController,
          onChanged: _onSearchChanged,
          decoration: const InputDecoration(
            hintText: 'Search jobs...',
            hintStyle: TextStyle(color: Color(0xFF94A3B8)),
            prefixIcon: Icon(Icons.search, color: Color(0xFF94A3B8)),
            border: InputBorder.none,
            contentPadding: EdgeInsets.symmetric(vertical: 16),
          ),
        ),
      ),
    );
  }

  Widget _buildFilterRow() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
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
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(child: Text(label, style: const TextStyle(fontSize: 14, color: Color(0xFF1E293B)), overflow: TextOverflow.ellipsis)),
            const Icon(Icons.keyboard_arrow_down, size: 18, color: Color(0xFF64748B)),
          ],
        ),
      ),
    );
  }

  void _showSortPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        final options = ['Most Recent', 'Highest Budget', 'Lowest Budget'];
        return SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(height: 24),
              const Text('Sort By', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              ...options.map((opt) => ListTile(
                title: Text(opt, style: TextStyle(
                  color: selectedSort == opt ? const Color(0xFF6366F1) : const Color(0xFF1E293B),
                  fontWeight: selectedSort == opt ? FontWeight.bold : FontWeight.normal,
                )),
                trailing: selectedSort == opt ? const Icon(Icons.check, color: Color(0xFF6366F1)) : null,
                onTap: () {
                  setState(() => selectedSort = opt);
                  Navigator.pop(context);
                },
              )),
              const SizedBox(height: 24),
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
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
            ),
          ),
          TextButton.icon(
            onPressed: _toggleNearMe,
            icon: Icon(_isNearMeEnabled ? Icons.location_off : Icons.near_me, size: 16, color: const Color(0xFF6366F1)),
            label: Text(
              _isLocating ? 'Locating...' : (_isNearMeEnabled ? 'Show All' : 'Near Me'), 
              style: const TextStyle(color: Color(0xFF6366F1), fontSize: 14, fontWeight: FontWeight.bold)
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
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        final categories = context.read<CategoryService>().categories;
        return SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(height: 24),
              const Text('Select Category', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.grid_view, color: Color(0xFF6366F1)),
                title: const Text('All Categories'),
                onTap: () {
                  setState(() => selectedCategory = 'All Categories');
                  context.read<JobService>().fetchJobs(filters: {'status': 'open'});
                  Navigator.pop(context);
                },
              ),
              ...categories.map((cat) => ListTile(
                leading: const Icon(Icons.category_outlined, color: Color(0xFF6366F1)),
                title: Text(cat['name'] as String),
                onTap: () {
                  setState(() => selectedCategory = cat['name'] as String);
                  context.read<JobService>().fetchJobs(filters: {
                    'category_id': cat['id'],
                    'status': 'open',
                  });
                  Navigator.pop(context);
                },
              )),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  Widget _buildJobCard(Map<String, dynamic> job) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            job['title'] ?? 'Job Title',
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
          ),
          const SizedBox(height: 8),
          Text(
            job['description'] ?? 'No description provided.',
            style: const TextStyle(color: Color(0xFF64748B), fontSize: 13, height: 1.5),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Text(
              job['category_name']?.toUpperCase() ?? 'CAT',
              style: const TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.calendar_today_outlined, size: 14, color: Color(0xFF94A3B8)),
              const SizedBox(width: 4),
              Text(
                job['created_at'] != null ? job['created_at'].toString().split('T').first : 'Unknown',
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
              ),
              const SizedBox(width: 16),
              const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFF94A3B8)),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  '${job['location'] ?? 'Downtown'}${job['distance'] != null ? ' (${double.parse(job['distance'].toString()).toStringAsFixed(1)} km away)' : ''}',
                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Divider(color: Color(0xFFF1F5F9)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Budget', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                  Row(
                    children: [
                      Text(
                        '\$${job['budget'] ?? '0'}',
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF6366F1)),
                      ),
                      if (job['is_negotiable'].toString() == '1' || job['is_negotiable'] == true || job['is_negotiable'].toString() == 'true') ...[
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
                    ],
                  ),
                ],
              ),
              ElevatedButton(
                onPressed: () => context.push('/job-detail/${job['id']}'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                  minimumSize: const Size(120, 48),
                ),
                child: const Text('Place Bid'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
