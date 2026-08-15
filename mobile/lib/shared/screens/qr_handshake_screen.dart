import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/services/handshake_service.dart';
import '../../features/customer/job_service.dart';
import '../../core/providers/language_provider.dart';
import '../../core/theme.dart';

class QrHandshakeScreen extends StatefulWidget {
  final int bookingId;
  final bool isProvider;

  const QrHandshakeScreen({
    super.key,
    required this.bookingId,
    required this.isProvider,
  });

  @override
  State<QrHandshakeScreen> createState() => _QrHandshakeScreenState();
}

class _QrHandshakeScreenState extends State<QrHandshakeScreen> {
  String? _handshakeToken;
  bool _isVerifying = false;

  @override
  void initState() {
    super.initState();
    if (widget.isProvider) {
      _fetchToken();
    }
  }

  Future<void> _fetchToken() async {
    final handshakeService = context.read<HandshakeService>();
    
    final token = await handshakeService.generateToken(widget.bookingId);
    setState(() {
      _handshakeToken = token;
    });
  }

  Future<void> _handleScan(String scannedToken) async {
    if (_isVerifying) return;

    final lang = context.read<LanguageProvider>();
    setState(() => _isVerifying = true);

    final handshakeService = context.read<HandshakeService>();

    final success = await handshakeService.verifyToken(
      widget.bookingId,
      scannedToken
    );

    if (success && mounted) {
      context.read<JobService>().fetchJobs(); // Refresh jobs
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(lang.t('handshake.success'), style: GoogleFonts.outfit(color: Colors.white)),
          backgroundColor: AppTheme.successColor,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(12),
        ),
      );
      Navigator.of(context).pop(true);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(lang.t('handshake.invalidQR'), style: GoogleFonts.outfit(color: Colors.white)),
          backgroundColor: AppTheme.errorColor,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(12),
        ),
      );
      setState(() => _isVerifying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).appColors;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final lang = context.watch<LanguageProvider>();

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Text(
          widget.isProvider ? lang.t('handshake.showQR') : lang.t('handshake.scanQR'),
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colors.text, fontSize: 18),
        ),
        backgroundColor: colors.surface,
        iconTheme: IconThemeData(color: colors.text),
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      body: widget.isProvider ? _buildProviderView(colors, isDark) : _buildCustomerView(colors, isDark),
    );
  }

  Widget _buildProviderView(AppColors colors, bool isDark) {
    final handshakeService = context.watch<HandshakeService>();
    
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
             Text(
              'Ask the customer to scan this code\nto start the job.',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(fontSize: 16, color: colors.subtext, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 40),
            if (handshakeService.isLoading)
              CircularProgressIndicator(color: Theme.of(context).colorScheme.primary)
            else if (_handshakeToken != null) ...[
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white, // Keep QR card white for maximum camera scannability
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: colors.text.withOpacity(0.04),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: QrImageView(
                  data: _handshakeToken!,
                  version: QrVersions.auto,
                  size: 240.0,
                  eyeStyle: QrEyeStyle(
                    eyeShape: QrEyeShape.square,
                    color: isDark ? const Color(0xFF0F172A) : AppTheme.primaryColor,
                  ),
                  dataModuleStyle: QrDataModuleStyle(
                    dataModuleShape: QrDataModuleShape.square,
                    color: isDark ? const Color(0xFF0F172A) : AppTheme.primaryColor,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Text(
                context.read<LanguageProvider>().t('handshake.offlinePin'),
                style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: colors.subtext, letterSpacing: 1.5),
              ),
              const SizedBox(height: 8),
              Text(
                _handshakeToken!,
                style: GoogleFonts.outfit(
                  fontSize: 32, 
                  fontWeight: FontWeight.bold, 
                  letterSpacing: 8, 
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ] else
              Text(
                'Failed to generate token.',
                style: GoogleFonts.outfit(color: AppTheme.errorColor, fontWeight: FontWeight.w500),
              ),
            const SizedBox(height: 40),
            TextButton.icon(
              onPressed: _fetchToken,
              icon: Icon(Icons.refresh_rounded, color: Theme.of(context).colorScheme.primary),
              label: Text(
                context.read<LanguageProvider>().t('handshake.refreshCode'),
                style: GoogleFonts.outfit(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerView(AppColors colors, bool isDark) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(20.0),
          child: Text(
            'Scan the provider\'s QR code\nto verify their arrival and start the job.',
            textAlign: TextAlign.center,
            style: GoogleFonts.outfit(fontSize: 15, color: colors.subtext, fontWeight: FontWeight.w500),
          ),
        ),
        Expanded(
          child: Stack(
            alignment: Alignment.center,
            children: [
              MobileScanner(
                onDetect: (capture) {
                  final List<Barcode> barcodes = capture.barcodes;
                  for (final barcode in barcodes) {
                    if (barcode.rawValue != null) {
                      _handleScan(barcode.rawValue!);
                      break;
                    }
                  }
                },
              ),
              // Custom scanning overlay with modern glowing border
              Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  border: Border.all(color: AppTheme.secondaryColor, width: 3),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.secondaryColor.withOpacity(0.2),
                      blurRadius: 15,
                      spreadRadius: 2,
                    ),
                  ],
                ),
              ),
              if (_isVerifying)
                const Center(child: CircularProgressIndicator(color: Colors.white)),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            children: [
              Text(
                'Problems scanning?',
                style: GoogleFonts.outfit(color: colors.subtext, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 4),
              TextButton(
                onPressed: () => _showPinEntryDialog(colors, isDark),
                child: Text(
                  context.read<LanguageProvider>().t('handshake.enterPin'),
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                    fontSize: 16,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showPinEntryDialog(AppColors colors, bool isDark) {
    final TextEditingController pinController = TextEditingController();
    final lang = context.read<LanguageProvider>();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(
          lang.t('handshake.pinDialogTitle'),
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colors.text),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Enter the 6-digit code shown on the provider\'s device.',
              style: GoogleFonts.outfit(color: colors.subtext, fontSize: 14),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: pinController,
              keyboardType: TextInputType.number,
              maxLength: 6,
              textAlign: TextAlign.center,
              autofocus: true,
              style: GoogleFonts.outfit(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                letterSpacing: 8,
                color: Theme.of(ctx).colorScheme.primary,
              ),
              decoration: InputDecoration(
                hintText: '000000',
                hintStyle: GoogleFonts.outfit(color: colors.subtext.withOpacity(0.4)),
                counterText: '',
                filled: true,
                fillColor: colors.background,
                contentPadding: const EdgeInsets.symmetric(vertical: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(color: colors.border, width: 1),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(color: colors.border, width: 1),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: AppTheme.secondaryColor, width: 2),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              lang.t('handshake.cancel'),
              style: GoogleFonts.outfit(color: colors.subtext, fontWeight: FontWeight.bold),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              if (pinController.text.length == 6) {
                _handleScan(pinController.text);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(ctx).colorScheme.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              elevation: 0,
            ),
            child: Text(
              lang.t('handshake.verifyPin'),
              style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
