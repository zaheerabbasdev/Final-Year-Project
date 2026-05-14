import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../core/services/handshake_service.dart';
import '../../features/auth/auth_service.dart';
import '../../features/customer/job_service.dart';

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
        const SnackBar(content: Text('Handshake Successful! Job started.')),
      );
      Navigator.of(context).pop(true);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid QR Code. Please try again.')),
      );
      setState(() => _isVerifying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isProvider ? 'Show QR Code' : 'Scan QR Code'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
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
            const Text(
              'Ask the customer to scan this code\nto start the job.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
            const SizedBox(height: 40),
            if (handshakeService.isLoading)
              const CircularProgressIndicator()
            else if (_handshakeToken != null) ...[
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: QrImageView(
                  data: _handshakeToken!,
                  version: QrVersions.auto,
                  size: 250.0,
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                'OFFLINE PIN FALLBACK',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.2),
              ),
              const SizedBox(height: 8),
              Text(
                _handshakeToken!,
                style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 8, color: Color(0xFF6366F1)),
              ),
            ] else
              const Text('Failed to generate token.'),
            const SizedBox(height: 40),
            TextButton.icon(
              onPressed: _fetchToken,
              icon: const Icon(Icons.refresh),
              label: const Text('Refresh Code'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerView() {
    return Column(
      children: [
        const Padding(
          padding: EdgeInsets.all(20.0),
          child: Text(
            'Scan the provider\'s QR code\nto verify their arrival and start the job.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16),
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
              // Custom scanning overlay
              Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.white, width: 2),
                  borderRadius: BorderRadius.circular(24),
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
              const Text('Problems scanning?', style: TextStyle(color: Colors.grey)),
              TextButton(
                onPressed: () => _showPinEntryDialog(),
                child: const Text('Enter PIN Manually', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF6366F1))),
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Enter Handshake PIN'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Enter the 6-digit code shown on the provider\'s device.'),
            const SizedBox(height: 24),
            TextField(
              controller: pinController,
              keyboardType: TextInputType.number,
              maxLength: 6,
              textAlign: TextAlign.center,
              autofocus: true,
              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 8, color: Color(0xFF6366F1)),
              decoration: InputDecoration(
                hintText: '000000',
                counterText: '',
                filled: true,
                fillColor: Colors.grey[100],
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              if (pinController.text.length == 6) {
                _handleScan(pinController.text);
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('Verify PIN', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
