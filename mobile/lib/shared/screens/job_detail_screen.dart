import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../features/customer/job_service.dart';
import '../../features/auth/auth_service.dart';
import '../../shared/services/booking_service.dart';
import '../../../core/api_client.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../shared/widgets/notification_bell.dart';
import '../../core/providers/currency_provider.dart';
import '../../core/providers/language_provider.dart';
import '../../core/theme.dart';

class JobDetailScreen extends StatefulWidget {
  final int jobId;
  const JobDetailScreen({super.key, required this.jobId});

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  Map<String, dynamic>? _job;
  Map<String, dynamic>? _booking;
  List<dynamic> _bids = [];
  bool _isLoading = true;

  bool _checkIsEmergency(dynamic val) {
    if (val == null) return false;
    if (val is bool) return val;
    if (val is int) return val == 1;
    final str = val.toString().toLowerCase();
    return str == '1' || str == 'true';
  }

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final jobService = context.read<JobService>();
    final bookingService = context.read<BookingService>();
    
    final job = await jobService.getJobById(widget.jobId);
    final bids = await jobService.fetchJobBids(widget.jobId);
    
    Map<String, dynamic>? booking;
    if (job != null && job['status'] != 'open') {
      booking = await bookingService.getBookingByJobId(widget.jobId);
    }

    if (mounted) {
      print('DEBUG: Job Detail Data: $job');
      print('DEBUG: Booking Detail Data: $booking');
      setState(() {
        _job = job;
        _booking = booking;
        _bids = bids;
        _isLoading = false;
      });
    }
  }

  Future<void> _showCancelDialog() async {
    final lang = context.read<LanguageProvider>();
    final colors = Theme.of(context).appColors;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(
          lang.t('jobDetail.cancelBookingTitle'),
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colors.text),
        ),
        content: Text(
          lang.t('jobDetail.cancelBookingContent'),
          style: GoogleFonts.outfit(color: colors.subtext),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(lang.t('jobDetail.keepBooking'), style: GoogleFonts.outfit(color: colors.subtext, fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(lang.t('jobDetail.yesCancel'), style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm == true && _booking != null) {
      final bookingService = context.read<BookingService>();
      final success = await bookingService.cancelBooking(_booking!['id']);
      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(lang.t('jobDetail.cancelledSuccess'), style: GoogleFonts.outfit(color: Colors.white)),
              backgroundColor: AppTheme.successColor,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              margin: const EdgeInsets.all(12),
            ),
          );
          _loadData();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(lang.t('jobDetail.cancelledFailed'), style: GoogleFonts.outfit(color: Colors.white)),
              backgroundColor: AppTheme.errorColor,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              margin: const EdgeInsets.all(12),
            ),
          );
        }
      }
    }
  }

  Future<void> _showCancelJobDialog() async {
    final lang = context.read<LanguageProvider>();
    final colors = Theme.of(context).appColors;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(
          lang.t('jobDetail.cancelJobTitle'),
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colors.text),
        ),
        content: Text(
          lang.t('jobDetail.cancelJobContent'),
          style: GoogleFonts.outfit(color: colors.subtext),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(lang.t('jobDetail.keepJob'), style: GoogleFonts.outfit(color: colors.subtext, fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(lang.t('jobDetail.yesCancel'), style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final jobService = context.read<JobService>();
      final success = await jobService.cancelJob(widget.jobId);
      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(lang.t('jobDetail.jobCancelledSuccess'), style: GoogleFonts.outfit(color: Colors.white)),
              backgroundColor: AppTheme.successColor,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              margin: const EdgeInsets.all(12),
            ),
          );
          _loadData();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(lang.t('jobDetail.jobCancelledFailed'), style: GoogleFonts.outfit(color: Colors.white)),
              backgroundColor: AppTheme.errorColor,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              margin: const EdgeInsets.all(12),
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();
    final role = authService.role;
    final userId = authService.user?['id'];

    if (role == 'provider') {
      return _buildProviderView(userId);
    }

    final colors = Theme.of(context).appColors;
    final lang = context.watch<LanguageProvider>();
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: colors.background,
        appBar: AppBar(
          backgroundColor: colors.surface,
          elevation: 0,
          scrolledUnderElevation: 0,
          leading: IconButton(
            icon: Icon(Icons.arrow_back_ios_new_rounded, color: colors.text, size: 20),
            onPressed: () => Navigator.pop(context),
          ),
          title: Text(
            lang.t('jobDetail.title'),
            style: GoogleFonts.outfit(color: colors.text, fontWeight: FontWeight.bold, fontSize: 18),
          ),
          actions: [
            NotificationBell(color: colors.text),
          ],
          bottom: TabBar(
            indicatorColor: AppTheme.primaryColor,
            indicatorWeight: 3,
            labelColor: AppTheme.primaryColor,
            unselectedLabelColor: colors.subtext,
            labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14),
            tabs: [
              Tab(text: lang.t('jobDetail.tabDetails')),
              Tab(text: '${lang.t('jobDetail.bids')} (${_bids.length})'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildDetailsTab(role),
            _buildBidsTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildProviderView(dynamic currentUserId) {
    final lang = context.read<LanguageProvider>();
    // Check if current provider has already placed a bid
    final bool hasAlreadyBidded = _bids.any((bid) => bid['provider_id'] == currentUserId);
    final String jobStatus = (_job?['status'] ?? 'open').toLowerCase();
    final bool isJobOpen = jobStatus == 'open';

    String buttonText = lang.t('jobDetail.placeYourBid');
    Color buttonColor = const Color(0xFF2563EB);
    bool isButtonEnabled = true;

    if (hasAlreadyBidded) {
      buttonText = lang.t('jobDetail.alreadyBidded');
      buttonColor = const Color(0xFF94A3B8);
      isButtonEnabled = false;
    } else if (!isJobOpen) {
      buttonText = lang.t('jobDetail.jobNotOpen');
      buttonColor = const Color(0xFF94A3B8);
      isButtonEnabled = false;
    } else if (_checkIsEmergency(_job?['is_emergency'])) {
      buttonText = lang.t('jobDetail.acceptInstantly');
      buttonColor = const Color(0xFFB91C1C);
      isButtonEnabled = true;
    }
    final colors = Theme.of(context).appColors;
    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.surface,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: colors.text, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          lang.t('jobDetail.title'),
          style: GoogleFonts.outfit(color: colors.text, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          NotificationBell(color: colors.text),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: colors.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: colors.border),
                boxShadow: [
                  BoxShadow(
                    color: colors.text.withOpacity(0.02),
                    blurRadius: 15,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          _job?['title'] ?? 'No Title',
                          style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: colors.text),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          (_job?['status'] ?? 'OPEN').toUpperCase(),
                          style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                      if (_checkIsEmergency(_job?['is_emergency'])) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.errorColor.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.errorColor.withOpacity(0.2)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.bolt_rounded, color: AppTheme.errorColor, size: 14),
                              const SizedBox(width: 4),
                              Text(
                                'EMERGENCY',
                                style: GoogleFonts.outfit(color: AppTheme.errorColor, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.successColor.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      (_job?['category_name'] ?? 'General').toUpperCase(),
                      style: GoogleFonts.outfit(color: AppTheme.successColor, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(Icons.access_time_rounded, size: 16, color: colors.subtext),
                      const SizedBox(width: 8),
                      Text(
                        '${lang.t('jobDetail.posted')} ${_job?['created_at']?.toString().split('T').first ?? 'Unknown'}',
                        style: GoogleFonts.outfit(color: colors.subtext, fontSize: 13, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Divider(color: colors.border),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(28),
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.04),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(lang.t('jobDetail.clientBudget'), style: GoogleFonts.outfit(color: colors.subtext, fontSize: 12, fontWeight: FontWeight.w500)),
                        const SizedBox(height: 6),
                        Text(
                          context.watch<CurrencyProvider>().format(_job?['budget']),
                          style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(child: _buildSimpleStat(Icons.location_on_outlined, lang.t('jobDetail.location'), _job?['location'] ?? 'Not specified', colors)),
                      Expanded(child: _buildSimpleStat(Icons.people_outline_rounded, lang.t('jobDetail.totalBids'), '${_bids.length} ${lang.t('jobDetail.bids')}', colors)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            if (_checkIsEmergency(_job?['is_emergency']))
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: AppTheme.errorColor.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppTheme.errorColor.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.bolt_rounded, color: AppTheme.errorColor, size: 32),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            lang.t('jobDetail.emergencyRequest'),
                            style: GoogleFonts.outfit(color: AppTheme.errorColor, fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          Text(
                            lang.t('jobDetail.emergencyRequestDesc'),
                            style: GoogleFonts.outfit(color: AppTheme.errorColor.withOpacity(0.9), fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            if (_job?['latitude'] != null && _job?['longitude'] != null)
              _buildProviderDetailSection(lang.t('jobDetail.jobLocation'), _buildMapCard(
                double.parse(_job!['latitude'].toString()),
                double.parse(_job!['longitude'].toString()),
                colors,
              ), colors),
            const SizedBox(height: 24),
            _buildProviderDetailSection(lang.t('jobDetail.jobDescription'), Container(
              padding: const EdgeInsets.all(24),
              width: double.infinity,
              decoration: BoxDecoration(
                color: colors.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: colors.border),
                boxShadow: [
                  BoxShadow(
                    color: colors.text.withOpacity(0.02),
                    blurRadius: 15,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Text(
                _job?['description'] ?? 'No description provided.',
                style: GoogleFonts.outfit(color: colors.text.withOpacity(0.8), height: 1.6, fontSize: 14),
              ),
            ), colors),
            const SizedBox(height: 24),
            _buildProviderDetailSection(lang.t('jobDetail.attachedImages'), _buildImageGallery(_job?['images'], colors), colors),
            const SizedBox(height: 24),
            _buildProviderDetailSection(lang.t('jobDetail.clientInfo'), _buildClientInfoCard(colors), colors),
            const SizedBox(height: 24),
            _buildProviderDetailSection(lang.t('jobDetail.biddingCompetition'), _buildCompetitionCard(colors), colors),
            const SizedBox(height: 32),
            if (_booking != null && _booking!['status'] == 'confirmed' && _booking!['provider_id'] == currentUserId) ...[
              Container(
                padding: const EdgeInsets.all(20),
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppTheme.primaryColor.withOpacity(0.2)),
                ),
                child: Column(
                  children: [
                    Text(
                      lang.t('jobDetail.youAreHired'),
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          final result = await context.push('/handshake', extra: {
                            'bookingId': _booking!['id'],
                            'isProvider': true,
                          });
                          if (result == true) {
                            _loadData();
                          }
                        },
                        icon: const Icon(Icons.qr_code_rounded, color: Colors.white),
                        label: Text(lang.t('jobDetail.showQR'), style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            // Cancel Booking Button for Provider (visible for confirmed or in_progress)
            if (_booking != null && ['confirmed', 'in_progress'].contains(_booking!['status']) && _booking!['provider_id'] == currentUserId) ...[
              SizedBox(
                width: double.infinity,
                height: 52,
                child: OutlinedButton.icon(
                  onPressed: () => _showCancelDialog(),
                  icon: const Icon(Icons.cancel_outlined, size: 18),
                  label: Text(lang.t('jobDetail.cancelBooking'), style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.errorColor,
                    side: BorderSide(color: AppTheme.errorColor.withOpacity(0.5)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: isButtonEnabled 
                  ? () async {
                      if (_checkIsEmergency(_job?['is_emergency'])) {
                        final confirm = await showDialog<bool>(
                          context: context,
                          builder: (ctx) {
                            final dLang = ctx.read<LanguageProvider>();
                            final dColors = Theme.of(ctx).appColors;
                            return AlertDialog(
                              backgroundColor: dColors.surface,
                              surfaceTintColor: Colors.transparent,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                              title: Text(dLang.t('jobDetail.acceptEmergency'), style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: dColors.text)),
                              content: Text(dLang.t('jobDetail.acceptEmergencyContent'), style: GoogleFonts.outfit(color: dColors.subtext)),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(dLang.t('jobDetail.keepJob'), style: GoogleFonts.outfit(color: dColors.subtext, fontWeight: FontWeight.bold))),
                                ElevatedButton(
                                  onPressed: () => Navigator.pop(ctx, true),
                                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.errorColor, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                                  child: Text(dLang.t('jobDetail.acceptNow'), style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            );
                          },
                        );

                        if (confirm == true) {
                          final success = await context.read<JobService>().expressAccept(widget.jobId);
                          if (success) {
                            _loadData();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(lang.t('jobDetail.jobAccepted'), style: GoogleFonts.outfit(color: Colors.white)),
                                backgroundColor: AppTheme.successColor,
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                margin: const EdgeInsets.all(12),
                              ),
                            );
                          }
                        }
                      } else {
                        context.push('/place-bid/${widget.jobId}');
                      }
                    }
                  : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: isButtonEnabled ? buttonColor : const Color(0xFFE2E8F0),
                  foregroundColor: isButtonEnabled ? Colors.white : const Color(0xFF94A3B8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: Text(buttonText, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: colors.border),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: Text(lang.t('jobDetail.saveForLater'), style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: colors.text)),
              ),
            ),
            const SizedBox(height: 24),
            _buildBiddingTips(colors),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }

  Widget _buildProviderDetailSection(String title, Widget content, AppColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colors.text)),
        const SizedBox(height: 16),
        content,
      ],
    );
  }

  Widget _buildClientInfoCard(AppColors colors) {
    final lang = context.read<LanguageProvider>();
    final avatarUrl = ApiClient.getImageUrl(_job?['customer_avatar']);
    final customerName = _job?['customer_name'] ?? 'Unknown User';
    final initials = customerName.isNotEmpty ? customerName[0].toUpperCase() : '?';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.border),
        boxShadow: [
          BoxShadow(
            color: colors.text.withOpacity(0.02),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
            child: avatarUrl != null
                ? ClipOval(
                    child: Image.network(
                      avatarUrl,
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Text(
                        initials,
                        style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontWeight: FontWeight.bold, fontSize: 20),
                      ),
                    ),
                  )
                : Text(initials, style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontWeight: FontWeight.bold, fontSize: 20)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  customerName,
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: colors.text),
                ),
                const SizedBox(height: 4),
                Text(lang.t('jobDetail.verifiedClient'), style: GoogleFonts.outfit(color: colors.subtext, fontSize: 13, fontWeight: FontWeight.w500)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    InkWell(
                      onTap: () {
                        final cId = _job!['customer_id'];
                        print('DEBUG: Navigating to customer profile from ClientInfoCard. Customer ID: $cId');
                        if (cId != null) {
                          context.push('/customer-profile/$cId');
                        } else {
                          print('DEBUG: customer_id is NULL in ClientInfoCard!');
                        }
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          children: [
                            const Icon(Icons.person_outline_rounded, size: 14, color: AppTheme.primaryColor),
                            const SizedBox(width: 4),
                            Text(
                              lang.t('jobDetail.viewProfile'),
                              style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    InkWell(
                      onTap: () {
                        context.push('/chat-room', extra: {
                          'jobId': widget.jobId,
                          'otherUserId': _job!['customer_id'],
                          'otherUserName': customerName,
                          'otherUserAvatar': avatarUrl,
                        });
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          children: [
                            const Icon(Icons.chat_bubble_outline_rounded, size: 14, color: AppTheme.primaryColor),
                            const SizedBox(width: 4),
                            Text(
                              lang.t('jobDetail.chatBtn'),
                              style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ],
                        ),
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

  Widget _buildCompetitionCard(AppColors colors) {
    final lang = context.read<LanguageProvider>();
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.border),
        boxShadow: [
          BoxShadow(
            color: colors.text.withOpacity(0.02),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildCompetitionRow(lang.t('jobDetail.totalBids'), '${_bids.length}', colors),
          const SizedBox(height: 16),
          _buildCompetitionRow(lang.t('jobDetail.yourStatus'), (_job?['status'] ?? 'Open').toUpperCase(), colors, valueColor: AppTheme.successColor),
          const SizedBox(height: 16),
          _buildCompetitionRow(lang.t('jobDetail.category'), _job?['category_name'] ?? 'N/A', colors),
        ],
      ),
    );
  }

  Widget _buildCompetitionRow(String label, String value, AppColors colors, {Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.outfit(color: colors.subtext, fontSize: 14, fontWeight: FontWeight.w500)),
        Text(value, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: valueColor ?? colors.text)),
      ],
    );
  }

  Widget _buildBiddingTips(AppColors colors) {
    final lang = context.read<LanguageProvider>();
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.04),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.lightbulb_outline_rounded, color: AppTheme.primaryColor, size: 24),
              const SizedBox(width: 12),
              Text(lang.t('jobDetail.biddingTips'), style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: colors.text)),
            ],
          ),
          const SizedBox(height: 16),
          _buildTipItem(lang.t('jobDetail.tip1'), colors),
          _buildTipItem(lang.t('jobDetail.tip2'), colors),
          _buildTipItem(lang.t('jobDetail.tip3'), colors),
          _buildTipItem(lang.t('jobDetail.tip4'), colors),
        ],
      ),
    );
  }

  Widget _buildTipItem(String tip, AppColors colors) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('• ', style: TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold)),
          Expanded(child: Text(tip, style: GoogleFonts.outfit(color: colors.subtext, fontSize: 13, fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, AppColors colors) {
    return Text(
      title,
      style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: colors.text),
    );
  }

  Widget _buildSimpleStat(IconData icon, String label, String value, AppColors colors) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppTheme.primaryColor),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: GoogleFonts.outfit(color: colors.subtext, fontSize: 11, fontWeight: FontWeight.w500)),
              const SizedBox(height: 2),
              Text(
                value,
                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: colors.text),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDetailsTab(String? role) {
    final colors = Theme.of(context).appColors;
    final lang = context.read<LanguageProvider>();
    if (_isLoading) return const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor));
    if (_job == null) return Center(child: Text(lang.t('jobDetail.jobNotFound'), style: GoogleFonts.outfit(color: colors.subtext)));

    final title = _job!['title'] ?? 'No Title';
    final category = _job!['category_name'] ?? 'General';
    final status = _job!['status'] ?? 'open';
    final description = _job!['description'] ?? 'No description provided.';
    final budget = _job!['budget']?.toString() ?? '0';
    final location = _job!['location'] ?? 'Not specified';
    final createdAt = _job!['created_at'] != null 
        ? _job!['created_at'].toString().split('T').first 
        : 'Unknown';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildJobMainCard(title, category, status, colors),
          const SizedBox(height: 24),
          _buildInfoSection(lang.t('jobDetail.description'), description, colors),
          const SizedBox(height: 24),
          _buildStatsGrid(budget, location, createdAt, _bids.length, colors, lang),
          const SizedBox(height: 24),
          if (_job!['latitude'] != null && _job!['longitude'] != null)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildInfoSectionTitle(lang.t('jobDetail.jobLocation'), colors),
                const SizedBox(height: 16),
                _buildMapCard(
                  double.parse(_job!['latitude'].toString()),
                  double.parse(_job!['longitude'].toString()),
                  colors,
                ),
                const SizedBox(height: 24),
              ],
            ),
          _buildInfoSectionTitle(lang.t('jobDetail.images'), colors),
          const SizedBox(height: 16),
          _buildImageGallery(_job!['images'], colors),
          const SizedBox(height: 24),
          if (_booking != null && _booking!['status'] == 'confirmed') ...[
            _buildInfoSectionTitle(lang.t('jobDetail.serviceVerification'), colors),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.05),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppTheme.primaryColor.withOpacity(0.2)),
              ),
              child: Column(
                children: [
                  Text(
                    lang.t('jobDetail.handshakePrompt'),
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        final result = await context.push('/handshake', extra: {
                          'bookingId': _booking!['id'],
                          'isProvider': role == 'provider',
                        });
                        if (result == true) {
                          _loadData();
                        }
                      },
                      icon: Icon(role == 'provider' ? Icons.qr_code_rounded : Icons.qr_code_scanner_rounded, color: Colors.white),
                      label: Text(role == 'provider' ? lang.t('jobDetail.showQR') : lang.t('jobDetail.scanQR'), style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
          // Cancel Booking Button (visible for confirmed or in_progress bookings)
          if (_booking != null && ['confirmed', 'in_progress'].contains(_booking!['status'])) ...[
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: OutlinedButton.icon(
                onPressed: () => _showCancelDialog(),
                icon: const Icon(Icons.cancel_outlined, size: 18),
                label: Text(lang.t('jobDetail.cancelBooking'), style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold)),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.errorColor,
                  side: BorderSide(color: AppTheme.errorColor.withOpacity(0.5)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
          // Cancel Job Button (visible to customer when job is open)
          if (role == 'customer' && status == 'open') ...[
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: OutlinedButton.icon(
                onPressed: () => _showCancelJobDialog(),
                icon: const Icon(Icons.delete_outline_rounded, size: 18),
                label: Text(lang.t('jobDetail.cancelJob'), style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold)),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.errorColor,
                  side: BorderSide(color: AppTheme.errorColor.withOpacity(0.5)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
          if (role == 'provider') ...[
            _buildInfoSectionTitle(lang.t('jobDetail.customerInfo'), colors),
            const SizedBox(height: 16),
            _buildCustomerCard(_job!['customer_name'], createdAt, colors),
            const SizedBox(height: 32),
          ],
        ],
      ),
    );
  }

  Widget _buildJobMainCard(String title, String category, String status, AppColors colors) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.border),
        boxShadow: [
          BoxShadow(
            color: colors.text.withOpacity(0.02),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
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
                  style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: colors.text),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  status.toUpperCase(),
                  style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppTheme.successColor.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              category,
              style: GoogleFonts.outfit(color: AppTheme.successColor, fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 20),
          Divider(color: colors.border),
        ],
      ),
    );
  }

  Widget _buildInfoSection(String title, String content, AppColors colors) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInfoSectionTitle(title, colors),
        const SizedBox(height: 12),
        Text(
          content,
          style: GoogleFonts.outfit(color: colors.text.withOpacity(0.8), height: 1.6, fontSize: 14),
        ),
      ],
    );
  }

  Widget _buildInfoSectionTitle(String title, AppColors colors) {
    return Text(
      title,
      style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: colors.text),
    );
  }

  Widget _buildStatsGrid(String budget, String location, String date, int bidsCount, AppColors colors, LanguageProvider lang) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 2.2,
      children: [
        _buildStatItem(Icons.attach_money_rounded, lang.t('jobDetail.budget'), context.watch<CurrencyProvider>().format(budget), colors),
        _buildStatItem(Icons.location_on_outlined, lang.t('jobDetail.location'), location, colors),
        _buildStatItem(Icons.calendar_today_outlined, lang.t('jobDetail.posted'), date, colors),
        _buildStatItem(Icons.people_outline_rounded, lang.t('jobDetail.bids'), '$bidsCount ${lang.t('jobDetail.bids')}', colors),
      ],
    );
  }

  Widget _buildStatItem(IconData icon, String label, String value, AppColors colors) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppTheme.primaryColor.withOpacity(0.04),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, size: 20, color: AppTheme.primaryColor),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: GoogleFonts.outfit(color: colors.subtext, fontSize: 11, fontWeight: FontWeight.w500)),
              Text(
                value,
                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: colors.text),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildImageGallery(List<dynamic>? images, AppColors colors) {
    final lang = context.read<LanguageProvider>();
    if (images == null || images.isEmpty) {
      return Container(
        height: 120,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: colors.border),
        ),
        child: Text(lang.t('jobDetail.noImages'), style: GoogleFonts.outfit(color: colors.subtext)),
      );
    }

    return Container(
      height: 120,
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.border),
      ),
      padding: const EdgeInsets.all(16),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: images.length,
        itemBuilder: (context, index) {
          final imageUrl = ApiClient.getImageUrl(images[index]);
          return Container(
            width: 140,
            margin: const EdgeInsets.only(right: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: colors.background,
            ),
            clipBehavior: Clip.antiAlias,
            child: imageUrl != null
                ? Image.network(
                    imageUrl,
                    width: 140,
                    fit: BoxFit.cover,
                    loadingBuilder: (_, child, progress) {
                      if (progress == null) return child;
                      return Center(
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppTheme.primaryColor,
                          value: progress.expectedTotalBytes != null
                              ? progress.cumulativeBytesLoaded / progress.expectedTotalBytes!
                              : null,
                        ),
                      );
                    },
                    errorBuilder: (_, __, ___) => Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.broken_image_outlined, color: colors.subtext, size: 28),
                        const SizedBox(height: 4),
                        Text('Failed', style: GoogleFonts.outfit(color: colors.subtext, fontSize: 10)),
                      ],
                    ),
                  )
                : Center(
                    child: Icon(Icons.image_not_supported_outlined, color: colors.subtext, size: 28),
                  ),
          );
        },
      ),
    );
  }

  Widget _buildCustomerCard(String? name, String date, AppColors colors) {
    final lang = context.read<LanguageProvider>();
    final avatarUrl = ApiClient.getImageUrl(_job?['customer_avatar']);
    final initials = name != null && name.isNotEmpty ? name[0].toUpperCase() : '?';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
            child: avatarUrl != null
                ? ClipOval(
                    child: Image.network(
                      avatarUrl,
                      width: 48,
                      height: 48,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Text(
                        initials,
                        style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
                      ),
                    ),
                  )
                : Text(initials, style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name ?? 'Unknown',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: colors.text),
                ),
                const SizedBox(height: 2),
                Text(
                  '${lang.t('jobDetail.jobPostedOn')} $date',
                  style: GoogleFonts.outfit(color: colors.subtext, fontSize: 12, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
          if (context.read<AuthService>().role == 'provider')
            OutlinedButton(
              onPressed: () {
                final cId = _job!['customer_id'];
                print('DEBUG: Navigating to customer profile. Customer ID: $cId');
                if (cId != null) {
                  context.push('/customer-profile/$cId');
                } else {
                  print('DEBUG: customer_id is NULL!');
                }
              },
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: colors.border),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(lang.t('jobDetail.viewProfile'), style: GoogleFonts.outfit(color: colors.text, fontSize: 12, fontWeight: FontWeight.bold)),
            ),
        ],
      ),
    );
  }

  Widget _buildBidsTab() {
    final colors = Theme.of(context).appColors;
    final lang = context.read<LanguageProvider>();
    if (_bids.isEmpty) {
      return Center(child: Text(lang.t('jobDetail.noBids'), style: GoogleFonts.outfit(color: colors.subtext)));
    }

    final bool hasAcceptedAny = _bids.any((b) => b['status'] == 'accepted');

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          ..._bids.map((bid) {
            final pId = bid['user_id'] ?? bid['provider_id'];
            final int? providerId = pId is int ? pId : int.tryParse(pId?.toString() ?? '');
            
            return _buildBidItem(
                id: bid['id'],
                providerId: providerId,
                name: bid['provider_name'] ?? 'Unknown Provider',
                rating: double.tryParse(bid['provider_rating']?.toString() ?? '0.0') ?? 0.0,
                reviews: int.tryParse(bid['review_count']?.toString() ?? '0') ?? 0,
                proposal: bid['cover_letter'] ?? 'No cover letter provided.',
                price: double.tryParse(bid['amount']?.toString() ?? '0.0') ?? 0.0,
                time: bid['estimated_time'] ?? 'N/A',
                avatar: bid['provider_avatar'],
                status: bid['status'],
                hasAcceptedAny: hasAcceptedAny,
                colors: colors,
              );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildBidItem({
    required int id,
    required int? providerId,
    required String name,
    required double rating,
    required int reviews,
    required String proposal,
    required double price,
    required String time,
    String? avatar,
    required String status,
    required bool hasAcceptedAny,
    required AppColors colors,
  }) {
    final lang = context.read<LanguageProvider>();
    final avatarUrl = ApiClient.getImageUrl(avatar);

    Widget? statusTag;
    if (status != 'pending' || hasAcceptedAny) {
      String label = status.toUpperCase();
      Color color = status == 'accepted' ? AppTheme.successColor : AppTheme.errorColor;

      if (hasAcceptedAny && status != 'accepted') {
        label = lang.t('provider.myBids.tabAvailed').toUpperCase();
        color = AppTheme.warningColor;
      }
      
      statusTag = Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: GoogleFonts.outfit(color: color, fontSize: 10, fontWeight: FontWeight.bold),
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.border),
        boxShadow: [
          BoxShadow(
            color: colors.text.withOpacity(0.02),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 22,
                backgroundImage: avatarUrl != null 
                  ? NetworkImage(avatarUrl)
                  : const NetworkImage('https://i.pravatar.cc/150?u=provider'),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: colors.text),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, color: AppTheme.warningColor, size: 16),
                        const SizedBox(width: 4),
                        Text(rating.toString(), style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 12, color: colors.text)),
                        Text(' ($reviews reviews)', style: GoogleFonts.outfit(color: colors.subtext, fontSize: 12, fontWeight: FontWeight.w500)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 16,
                      runSpacing: 4,
                      children: [
                        if (providerId != null)
                          InkWell(
                            onTap: () => context.push('/provider-profile/$providerId'),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.info_outline, size: 14, color: AppTheme.primaryColor),
                                  const SizedBox(width: 4),
                                  Text(
                                    lang.t('jobDetail.viewDetails'),
                                    style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontWeight: FontWeight.bold, fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        InkWell(
                          onTap: () {
                            context.push('/chat-room', extra: {
                              'jobId': widget.jobId,
                              'otherUserId': providerId,
                              'otherUserName': name,
                              'otherUserAvatar': avatarUrl,
                            });
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.chat_bubble_outline_rounded, size: 14, color: AppTheme.primaryColor),
                                const SizedBox(width: 4),
                                Text(
                                  lang.t('jobDetail.chatBtn'),
                                  style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontWeight: FontWeight.bold, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (statusTag != null) ...[
                const SizedBox(width: 8),
                statusTag,
              ],
            ],
          ),
          const SizedBox(height: 16),
          Text(
            proposal,
            style: GoogleFonts.outfit(color: colors.text.withOpacity(0.8), fontSize: 14, height: 1.5),
          ),
          const SizedBox(height: 16),
          Divider(color: colors.border),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   Text(context.watch<CurrencyProvider>().format(price), style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.primaryColor)),
                  Text('Est. $time', style: GoogleFonts.outfit(color: colors.subtext, fontSize: 12, fontWeight: FontWeight.w500)),
                ],
              ),
              if (status == 'pending' && context.read<AuthService>().role == 'customer')
                ElevatedButton.icon(
                  onPressed: () async {
                    final result = await context.read<JobService>().acceptBid(id);
                    if (!mounted) return;

                    if (result['success'] == true) {
                      // ── Success ─────────────────────────────────────────
                      _loadData();
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(lang.t('jobDetail.bidAccepted'),
                              style: GoogleFonts.outfit(color: Colors.white)),
                          backgroundColor: AppTheme.successColor,
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          margin: const EdgeInsets.all(12),
                        ),
                      );
                    } else {
                      // ── Failure — detect balance vs other errors ─────────
                      final rawMsg = (result['message'] as String? ?? '').toLowerCase();
                      final isBalanceError = rawMsg.contains('balance') ||
                          rawMsg.contains('insufficient') ||
                          rawMsg.contains('wallet') ||
                          rawMsg.contains('funds');

                      if (isBalanceError) {
                        // Wallet / balance error — guide the customer to top up
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Row(
                              children: [
                                const Icon(
                                  Icons.account_balance_wallet_outlined,
                                  color: Colors.white,
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    lang.t('jobDetail.insufficientBalance'),
                                    style: GoogleFonts.outfit(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            backgroundColor: AppTheme.errorColor,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            margin: const EdgeInsets.all(12),
                            duration: const Duration(seconds: 6),
                            action: SnackBarAction(
                              label: lang.t('wallet.topUp'),
                              textColor: Colors.white,
                              onPressed: () => context.push('/wallet'),
                            ),
                          ),
                        );
                      } else {
                        // Generic error — surface the server message
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              result['message'] as String? ??
                                  lang.t('jobDetail.bidAcceptFailed'),
                              style: GoogleFonts.outfit(color: Colors.white),
                            ),
                            backgroundColor: AppTheme.errorColor,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            margin: const EdgeInsets.all(12),
                          ),
                        );
                      }
                    }
                  },
                  icon: const Icon(Icons.check_circle_outline_rounded, size: 16, color: Colors.white),
                  label: Text(lang.t('jobDetail.acceptBid'), style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    minimumSize: const Size(120, 48),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMapCard(double lat, double lng, AppColors colors) {
    return Container(
      height: 200,
      width: double.infinity,
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.border),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: GoogleMap(
          initialCameraPosition: CameraPosition(
            target: LatLng(lat, lng),
            zoom: 15,
          ),
          markers: {
            Marker(
              markerId: const MarkerId('jobLocation'),
              position: LatLng(lat, lng),
            ),
          },
          liteModeEnabled: true, // Optimized for detail screens
          myLocationButtonEnabled: false,
          zoomControlsEnabled: false,
          scrollGesturesEnabled: false,
        ),
      ),
    );
  }
}
