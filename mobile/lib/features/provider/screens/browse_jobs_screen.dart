import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../customer/job_service.dart';
import '../../customer/category_service.dart';
import '../../../core/services/location_service.dart';
import '../../../shared/widgets/notification_bell.dart';
import '../../../core/providers/currency_provider.dart';
import '../../../core/providers/language_provider.dart';
import '../../../core/theme.dart';

class BrowseJobsScreen extends StatefulWidget {
  const BrowseJobsScreen({super.key});

  @override
  State<BrowseJobsScreen> createState() => _BrowseJobsScreenState();
}

class _BrowseJobsScreenState extends State<BrowseJobsScreen> {
  final _searchController = TextEditingController();
  // Internal keys — kept in English for comparison logic
  String selectedCategory = 'All Categories';
  String selectedSort = 'AI Recommended';
  Timer? _debounce;
  bool _isNearMeEnabled = false;
  bool _isLocating = false;
  final LocationService _locationService = LocationService();

  /// Translate sort key to display label
  String _sortLabel(String key, LanguageProvider lang) {
    switch (key) {
      case 'AI Recommended':
        return lang.t('provider.browseJobs.aiRecommended');
      case 'Most Recent':
        return lang.t('provider.browseJobs.mostRecent');
      case 'Highest Budget':
        return lang.t('provider.browseJobs.highestBudget');
      case 'Lowest Budget':
        return lang.t('provider.browseJobs.lowestBudget');
      default:
        return key;
    }
  }

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
      if (selectedSort == 'AI Recommended') {
        filters['recommended'] = true;
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
      context.read<JobService>().fetchJobs(filters: {'status': 'open', 'recommended': true});
      context.read<CategoryService>().fetchCategories();
    });
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).appColors;
    final lang = context.watch<LanguageProvider>();
    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.surface,
        scrolledUnderElevation: 0,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: colors.text),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          lang.t('provider.browseJobs.title'),
          style: GoogleFonts.outfit(color: colors.text, fontWeight: FontWeight.bold, fontSize: 20),
        ),
        actions: [
          NotificationBell(color: colors.text),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(colors, lang),
          _buildFilterRow(colors, lang),
          _buildResultsHeader(colors, lang),
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
                        Icon(Icons.search_off_rounded, size: 64, color: colors.subtext.withOpacity(0.3)),
                        const SizedBox(height: 16),
                        Text(
                          lang.t('provider.browseJobs.noJobsFound'),
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

                // Copy and sort jobs list locally
                final jobsList = List<dynamic>.from(service.jobs);
                if (selectedSort == 'Highest Budget') {
                  jobsList.sort((a, b) {
                    final budgetA = double.tryParse(a['budget']?.toString() ?? '0') ?? 0.0;
                    final budgetB = double.tryParse(b['budget']?.toString() ?? '0') ?? 0.0;
                    return budgetB.compareTo(budgetA);
                  });
                } else if (selectedSort == 'Lowest Budget') {
                  jobsList.sort((a, b) {
                    final budgetA = double.tryParse(a['budget']?.toString() ?? '0') ?? 0.0;
                    final budgetB = double.tryParse(b['budget']?.toString() ?? '0') ?? 0.0;
                    return budgetA.compareTo(budgetB);
                  });
                } else if (selectedSort == 'Most Recent') {
                  jobsList.sort((a, b) {
                    final dateA = DateTime.tryParse(a['created_at']?.toString() ?? '') ?? DateTime(1970);
                    final dateB = DateTime.tryParse(b['created_at']?.toString() ?? '') ?? DateTime(1970);
                    return dateB.compareTo(dateA);
                  });
                }

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  itemCount: jobsList.length,
                  itemBuilder: (context, index) {
                    final job = jobsList[index];
                    return _buildJobCard(job, colors, lang);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar(AppColors colors, LanguageProvider lang) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
      child: Container(
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: colors.text.withOpacity(0.04),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: TextField(
          controller: _searchController,
          onChanged: _onSearchChanged,
          style: GoogleFonts.outfit(color: colors.text, fontSize: 15),
          decoration: InputDecoration(
            hintText: lang.t('provider.browseJobs.searchHint'),
            hintStyle: GoogleFonts.outfit(color: colors.subtext.withOpacity(0.7)),
            prefixIcon: Icon(Icons.search, color: colors.subtext),
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

  Widget _buildFilterRow(AppColors colors, LanguageProvider lang) {
    final catLabel = selectedCategory == 'All Categories'
        ? lang.t('provider.browseJobs.allCategories')
        : selectedCategory;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: _buildFilterButton(
              label: catLabel,
              onTap: () => _showCategoryPicker(lang),
              colors: colors,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _buildFilterButton(
              label: _sortLabel(selectedSort, lang),
              onTap: () => _showSortPicker(lang),
              colors: colors,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterButton({required String label, required VoidCallback onTap, required AppColors colors}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: colors.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.outfit(fontSize: 14, color: colors.text, fontWeight: FontWeight.w600),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Icon(Icons.keyboard_arrow_down, size: 18, color: colors.subtext),
          ],
        ),
      ),
    );
  }

  void _showSortPicker(LanguageProvider lang) {
    final colors = Theme.of(context).appColors;
    // keys → display labels
    final options = [
      {'key': 'AI Recommended', 'label': lang.t('provider.browseJobs.aiRecommended')},
      {'key': 'Most Recent', 'label': lang.t('provider.browseJobs.mostRecent')},
      {'key': 'Highest Budget', 'label': lang.t('provider.browseJobs.highestBudget')},
      {'key': 'Lowest Budget', 'label': lang.t('provider.browseJobs.lowestBudget')},
    ];
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (context) {
        return SingleChildScrollView(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(color: colors.border, borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(height: 24),
              Text(
                lang.t('provider.browseJobs.sortBy'),
                style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colors.text),
              ),
              const SizedBox(height: 16),
              ...options.map((opt) => ListTile(
                title: Text(
                  opt['label']!,
                  style: GoogleFonts.outfit(
                    color: selectedSort == opt['key'] ? AppTheme.primaryColor : colors.text,
                    fontWeight: selectedSort == opt['key'] ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
                trailing: selectedSort == opt['key'] ? const Icon(Icons.check, color: AppTheme.primaryColor) : null,
                onTap: () {
                  setState(() => selectedSort = opt['key']!);
                  Navigator.pop(context);
                  _onSearchChanged(_searchController.text);
                },
              )),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Widget _buildResultsHeader(AppColors colors, LanguageProvider lang) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Consumer<JobService>(
            builder: (context, service, _) => Text(
              '${service.jobs.length} ${_isNearMeEnabled ? '${lang.t('provider.browseJobs.nearbyJobs')} ' : ''}${lang.t('provider.browseJobs.jobsFound')}',
              style: GoogleFonts.outfit(color: colors.subtext, fontSize: 13, fontWeight: FontWeight.w500),
            ),
          ),
          TextButton.icon(
            onPressed: _toggleNearMe,
            icon: Icon(_isNearMeEnabled ? Icons.location_off : Icons.near_me, size: 16, color: AppTheme.secondaryColor),
            label: Text(
              _isLocating
                  ? lang.t('provider.browseJobs.locating')
                  : (_isNearMeEnabled ? lang.t('provider.browseJobs.showAll') : lang.t('provider.browseJobs.nearMe')),
              style: GoogleFonts.outfit(color: AppTheme.secondaryColor, fontSize: 14, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  void _showCategoryPicker(LanguageProvider lang) {
    final colors = Theme.of(context).appColors;
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.surface,
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
                  decoration: BoxDecoration(color: colors.border, borderRadius: BorderRadius.circular(2)),
                ),
                const SizedBox(height: 24),
                Text(
                  lang.t('provider.browseJobs.selectCategory'),
                  style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colors.text),
                ),
                const SizedBox(height: 16),
                ListTile(
                  leading: const Icon(Icons.grid_view, color: AppTheme.primaryColor),
                  title: Text(
                    lang.t('provider.browseJobs.allCategories'),
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w600, color: colors.text),
                  ),
                  onTap: () {
                    setState(() => selectedCategory = 'All Categories');
                    context.read<JobService>().fetchJobs(filters: {'status': 'open'});
                    Navigator.pop(context);
                  },
                ),
                Divider(color: colors.border),
                ...categories.map((cat) => ListTile(
                  leading: const Icon(Icons.category_outlined, color: AppTheme.primaryColor),
                  title: Text(cat['name'] as String, style: GoogleFonts.outfit(fontWeight: FontWeight.w500, color: colors.text)),
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

  Widget _buildJobCard(Map<String, dynamic> job, AppColors colors, LanguageProvider lang) {
    final isEmergency = _checkIsEmergency(job['is_emergency']);
    final int? matchScore = job['match_score'] != null ? int.tryParse(job['match_score'].toString()) : null;
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(26),
        boxShadow: [
          BoxShadow(
            color: colors.text.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
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
                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colors.text),
                  ),
                ),
                if (matchScore != null)
                  Container(
                    margin: const EdgeInsets.only(left: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.psychology, color: AppTheme.primaryColor, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          '${matchScore}% Match',
                          style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                if (isEmergency)
                  Container(
                    margin: const EdgeInsets.only(left: 8),
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
                          lang.t('provider.browseJobs.emergency'),
                          style: GoogleFonts.outfit(color: AppTheme.errorColor, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              job['description'] ?? lang.t('common.noDescription'),
              style: GoogleFonts.outfit(color: colors.subtext, fontSize: 13, height: 1.5),
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
                Icon(Icons.calendar_today_outlined, size: 14, color: colors.subtext),
                const SizedBox(width: 6),
                Text(
                  job['created_at'] != null ? job['created_at'].toString().split('T').first : lang.t('common.unknown'),
                  style: GoogleFonts.outfit(color: colors.subtext, fontSize: 12, fontWeight: FontWeight.w500),
                ),
                const SizedBox(width: 16),
                Icon(Icons.location_on_outlined, size: 14, color: colors.subtext),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    '${job['location'] ?? 'Downtown'}${job['distance'] != null ? ' (${double.parse(job['distance'].toString()).toStringAsFixed(1)} km away)' : ''}',
                    style: GoogleFonts.outfit(color: colors.subtext, fontSize: 12, fontWeight: FontWeight.w500),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Divider(color: colors.border, height: 1),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        lang.t('provider.browseJobs.budget'),
                        style: GoogleFonts.outfit(color: colors.subtext, fontSize: 11, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 2),
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(
                            context.watch<CurrencyProvider>().format(job['budget']),
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
                                lang.t('provider.browseJobs.negotiable'),
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
                    isEmergency ? lang.t('provider.browseJobs.acceptInstantly') : lang.t('provider.browseJobs.placeBid'),
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
