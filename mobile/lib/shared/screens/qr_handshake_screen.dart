import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/services/handshake_service.dart';
import '../../features/customer/job_service.dart';
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
          content: Text('Handshake Successful! Job started.', style: GoogleFonts.outfit(color: Colors.white)),
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
          content: Text('Invalid QR Code. Please try again.', style: GoogleFonts.outfit(color: Colors.white)),
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
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(
          widget.isProvider ? 'Show QR Code' : 'Scan QR Code',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: AppTheme.textColor, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: AppTheme.textColor),
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      body: widget.isProvider ? _buildProviderView() : _buildCustomerView(),
    );
  }

  Widget _buildProviderView() {
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
              style: GoogleFonts.outfit(fontSize: 16, color: AppTheme.subtextColor, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 40),
            if (handshakeService.isLoading)
              const CircularProgressIndicator(color: AppTheme.primaryColor)
            else if (_handshakeToken != null) ...[
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.textColor.withOpacity(0.04),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: QrImageView(
                  data: _handshakeToken!,
                  version: QrVersions.auto,
                  size: 240.0,
                  eyeStyle: const QrEyeStyle(
                    eyeShape: QrEyeShape.square,
                    color: AppTheme.primaryColor,
                  ),
                  dataModuleStyle: const QrDataModuleStyle(
                    dataModuleShape: QrDataModuleShape.square,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'OFFLINE PIN FALLBACK',
                style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.subtextColor, letterSpacing: 1.5),
              ),
              const SizedBox(height: 8),
              Text(
                _handshakeToken!,
                style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 8, color: AppTheme.primaryColor),
              ),
            ] else
              Text(
                'Failed to generate token.',
                style: GoogleFonts.outfit(color: AppTheme.errorColor, fontWeight: FontWeight.w500),
              ),
            const SizedBox(height: 40),
            TextButton.icon(
              onPressed: _fetchToken,
              icon: const Icon(Icons.refresh_rounded, color: AppTheme.primaryColor),
              label: Text(
                'Refresh Code',
                style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerView() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(20.0),
          child: Text(
            'Scan the provider\'s QR code\nto verify their arrival and start the job.',
            textAlign: TextAlign.center,
            style: GoogleFonts.outfit(fontSize: 15, color: AppTheme.subtextColor, fontWeight: FontWeight.w500),
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
                style: GoogleFonts.outfit(color: AppTheme.subtextColor, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 4),
              TextButton(
                onPressed: () => _showPinEntryDialog(),
                child: Text(
                  'Enter PIN Manually',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: AppTheme.primaryColor, fontSize: 16),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showPinEntryDialog() {
    final TextEditingController pinController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(
          'Enter Handshake PIN',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: AppTheme.textColor),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Enter the 6-digit code shown on the provider\'s device.',
              style: GoogleFonts.outfit(color: AppTheme.subtextColor, fontSize: 14),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: pinController,
              keyboardType: TextInputType.number,
              maxLength: 6,
              textAlign: TextAlign.center,
              autofocus: true,
              style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 8, color: AppTheme.primaryColor),
              decoration: InputDecoration(
                hintText: '000000',
                hintStyle: GoogleFonts.outfit(color: AppTheme.subtextColor.withOpacity(0.4)),
                counterText: '',
                filled: true,
                fillColor: AppTheme.backgroundColor,
                contentPadding: const EdgeInsets.symmetric(vertical: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1),
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
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancel',
              style: GoogleFonts.outfit(color: AppTheme.subtextColor, fontWeight: FontWeight.bold),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              if (pinController.text.length == 6) {
                _handleScan(pinController.text);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              elevation: 0,
            ),
            child: Text(
              'Verify PIN',
              style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
