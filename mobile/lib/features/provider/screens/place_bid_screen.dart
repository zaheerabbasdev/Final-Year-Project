import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../customer/job_service.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/services/navigation_service.dart';
import '../../../core/providers/currency_provider.dart';
import '../../../core/providers/language_provider.dart';
import '../../../core/theme.dart';

class PlaceBidScreen extends StatefulWidget {
  final int jobId;
  const PlaceBidScreen({super.key, required this.jobId});

  @override
  State<PlaceBidScreen> createState() => _PlaceBidScreenState();
}

class _PlaceBidScreenState extends State<PlaceBidScreen> {
  final _amountController = TextEditingController();
  final _timeController = TextEditingController();
  final _proposalController = TextEditingController();
  Map<String, dynamic>? _job;
  Map<String, dynamic>? _suggestion;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadJob();
  }

  Future<void> _loadJob() async {
    final job = await context.read<JobService>().getJobById(widget.jobId);
    final suggestion = await context.read<JobService>().getSuggestedBidPrice(widget.jobId);
    if (mounted) {
      setState(() {
        _job = job;
        _suggestion = suggestion;
        _isLoading = false;
      });
    }
  }

  void _submitBid() async {
    final lang = context.read<LanguageProvider>();
    if (_amountController.text.isEmpty || _timeController.text.isEmpty || _proposalController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(lang.t('provider.placeBid.fillAll'), style: GoogleFonts.outfit()),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final currencyProvider = context.read<CurrencyProvider>();
    double bidAmount = double.tryParse(_amountController.text) ?? 0.0;
    if (currencyProvider.selectedCurrency == 'USD') {
      bidAmount = bidAmount * CurrencyProvider.usdRate;
    } else if (currencyProvider.selectedCurrency == 'AED') {
      bidAmount = bidAmount * CurrencyProvider.aedRate;
    }

    final success = await context.read<JobService>().createBid({
      'job_id': widget.jobId,
      'amount': bidAmount,
      'estimated_time': _timeController.text,
      'cover_letter': _proposalController.text,
    });
    setState(() => _isLoading = false);

    if (success) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(lang.t('provider.placeBid.submitted'), style: GoogleFonts.outfit()),
            backgroundColor: AppTheme.successColor,
          ),
        );
        context.read<NavigationService>().setIndex(2);
        context.go('/main');
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(lang.t('provider.placeBid.failed'), style: GoogleFonts.outfit()),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
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
          lang.t('provider.placeBid.title'),
          style: GoogleFonts.outfit(color: colors.text, fontWeight: FontWeight.bold, fontSize: 20),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildJobSummary(),
            const SizedBox(height: 20),
            _buildBidForm(),
            const SizedBox(height: 20),
            _buildImportantNotes(),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: BorderSide(color: colors.border),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      backgroundColor: colors.surface,
                    ),
                    child: Text(
                      lang.t('provider.placeBid.cancel'),
                      style: GoogleFonts.outfit(color: colors.subtext, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submitBid,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 0,
                    ),
                    child: _isLoading 
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                          )
                        : Text(
                            lang.t('provider.placeBid.submitBid'),
                            style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16),
                          ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildJobSummary() {
    final lang = context.read<LanguageProvider>();
    if (_isLoading) return const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor));
    if (_job == null) return Center(child: Text(lang.t('provider.placeBid.jobNotFound'), style: GoogleFonts.outfit()));

    final colors = Theme.of(context).appColors;
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: colors.text.withOpacity(0.03),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _job!['title'] ?? 'No Title',
            style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colors.text),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                flex: 3,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      lang.t('provider.placeBid.clientBudget'),
                      style: GoogleFonts.outfit(color: colors.subtext, fontSize: 12, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            context.watch<CurrencyProvider>().format(_job!['budget']),
                            style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w800, color: AppTheme.primaryColor),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (_job!['is_negotiable'].toString() == '1' || _job!['is_negotiable'] == true || _job!['is_negotiable'].toString() == 'true') ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              lang.t('provider.placeBid.negotiable'),
                              style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Flexible(
                flex: 2,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      lang.t('provider.placeBid.category'),
                      style: GoogleFonts.outfit(color: colors.subtext, fontSize: 12, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _job!['category_name'] ?? 'N/A',
                      style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: colors.text),
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.end,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBidForm() {
    final colors = Theme.of(context).appColors;
    final lang = context.read<LanguageProvider>();
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: colors.text.withOpacity(0.03),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInputLabel('${lang.t('provider.placeBid.bidAmount')} (${context.watch<CurrencyProvider>().selectedCurrency}) *', colors),
          const SizedBox(height: 12),
          _buildTextField(
            controller: _amountController,
            hint: lang.t('provider.placeBid.enterBid'),
            prefixIcon: Icons.payments_outlined,
            keyboardType: TextInputType.number,
          ),
          if (_suggestion != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppTheme.secondaryColor.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.secondaryColor.withOpacity(0.15)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.psychology, color: AppTheme.secondaryColor, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '${lang.t('provider.placeBid.aiSuggestion')} ${context.watch<CurrencyProvider>().format(_suggestion!["suggestedMin"])} - ${context.watch<CurrencyProvider>().format(_suggestion!["suggestedMax"])}',
                      style: GoogleFonts.outfit(
                        color: AppTheme.secondaryColor,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 16),
          Divider(color: colors.border, height: 1),
          const SizedBox(height: 16),
          _buildInputLabel('${lang.t('provider.placeBid.estTime')} *', colors),
          const SizedBox(height: 12),
          _buildTextField(
            controller: _timeController,
            hint: lang.t('provider.placeBid.timePlaceholder'),
            prefixIcon: Icons.access_time,
          ),
          const SizedBox(height: 16),
          Divider(color: colors.border, height: 1),
          const SizedBox(height: 16),
          _buildInputLabel('${lang.t('provider.placeBid.coverLetter')} *', colors),
          const SizedBox(height: 12),
          TextField(
            controller: _proposalController,
            maxLines: 5,
            style: GoogleFonts.outfit(color: colors.text, fontSize: 15),
            decoration: InputDecoration(
              hintText: lang.t('provider.placeBid.coverHint'),
              hintStyle: GoogleFonts.outfit(color: colors.subtext.withOpacity(0.7), fontSize: 13),
              filled: true,
              fillColor: colors.background,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: colors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: colors.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppTheme.primaryColor, width: 1.5),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              '0/500 characters',
              style: GoogleFonts.outfit(color: colors.subtext, fontSize: 12, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputLabel(String label, AppColors colors) {
    return Text(
      label,
      style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700, color: colors.text),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData prefixIcon,
    TextInputType keyboardType = TextInputType.text,
  }) {
    final colors = Theme.of(context).appColors;
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      style: GoogleFonts.outfit(color: colors.text, fontSize: 15),
      decoration: InputDecoration(
        prefixIcon: Icon(prefixIcon, color: colors.subtext, size: 20),
        hintText: hint,
        hintStyle: GoogleFonts.outfit(color: colors.subtext.withOpacity(0.7), fontSize: 14),
        filled: true,
        fillColor: colors.background,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: colors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: colors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppTheme.primaryColor, width: 1.5),
        ),
      ),
    );
  }

  Widget _buildImportantNotes() {
    final lang = context.read<LanguageProvider>();
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.warningColor.withOpacity(0.06),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.warningColor.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: AppTheme.warningColor, size: 20),
              const SizedBox(width: 8),
              Text(
                lang.t('provider.placeBid.importantNotes'),
                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF78350F), fontSize: 15),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildNoteItem(lang.t('provider.placeBid.note1')),
          _buildNoteItem(lang.t('provider.placeBid.note2')),
          _buildNoteItem(lang.t('provider.placeBid.note3')),
          _buildNoteItem(lang.t('provider.placeBid.note4')),
        ],
      ),
    );
  }

  Widget _buildNoteItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(color: Color(0xFF78350F), fontWeight: FontWeight.bold)),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.outfit(color: const Color(0xFF78350F), fontSize: 13, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}

