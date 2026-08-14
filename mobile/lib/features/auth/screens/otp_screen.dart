import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:google_fonts/google_fonts.dart';
import '../auth_service.dart';
import '../../../core/providers/language_provider.dart';
import '../../../core/theme.dart';

class OtpScreen extends StatefulWidget {
  final String email;

  const OtpScreen({super.key, required this.email});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _otpController = TextEditingController();
  bool _isLoading = false;
  bool _isResending = false;

  // Countdown so the user can't spam resend.
  // Starts at 0 so the Resend button is immediately available —
  // useful when the user arrives here from a failed login attempt
  // where the auto-resend may not have worked.
  int _resendCooldown = 0;
  Timer? _cooldownTimer;

  @override
  void initState() {
    super.initState();
    // No initial countdown — user can resend right away if needed.
  }

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    _otpController.dispose();
    super.dispose();
  }

  void _startCooldown() {
    _resendCooldown = 60;
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) { t.cancel(); return; }
      setState(() {
        if (_resendCooldown > 0) {
          _resendCooldown--;
        } else {
          t.cancel();
        }
      });
    });
  }

  void _resend() async {
    if (_resendCooldown > 0 || _isResending) return;
    setState(() => _isResending = true);
    final result = await context.read<AuthService>().resendOTP(widget.email);
    setState(() => _isResending = false);

    Fluttertoast.showToast(
      msg: result['message'] ?? (result['success'] ? 'Code sent!' : 'Failed to send code.'),
      backgroundColor: result['success'] == true ? AppTheme.successColor : AppTheme.errorColor,
      textColor: Colors.white,
    );

    if (result['success'] == true) {
      _startCooldown();
    }
  }

  void _verify() async {
    if (_otpController.text.length != 6) {
      Fluttertoast.showToast(
        msg: 'Please enter a valid 6-digit OTP',
        backgroundColor: AppTheme.errorColor,
        textColor: Colors.white,
        webBgColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
      );
      return;
    }

    setState(() => _isLoading = true);
    final success = await context.read<AuthService>().verifyOTP(widget.email, _otpController.text);
    setState(() => _isLoading = false);

    if (success) {
      if (mounted) {
        Fluttertoast.showToast(
          msg: 'Email verified successfully! Please login.',
          backgroundColor: AppTheme.successColor,
          textColor: Colors.white,
          timeInSecForIosWeb: 3,
          webBgColor: "linear-gradient(to right, #00b09b, #96c93d)",
        );
        context.go('/login');
      }
    } else {
      if (mounted) {
        Fluttertoast.showToast(
          msg: 'Invalid or expired OTP.',
          backgroundColor: AppTheme.errorColor,
          textColor: Colors.white,
          webBgColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
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
        title: Text(
          lang.t('auth.otp.title'),
          style: GoogleFonts.outfit(color: colors.text, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: colors.text),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 32),
            Center(
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.08),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.mark_email_read_outlined,
                  size: 64,
                  color: AppTheme.primaryColor,
                ),
              ),
            ),
            const SizedBox(height: 36),
            Text(
              lang.t('auth.otp.enterCode'),
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                fontSize: 26,
                fontWeight: FontWeight.w800,
                color: colors.text,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'We sent a 6-digit code to\n${widget.email}',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                color: colors.subtext,
                fontSize: 16,
                height: 1.5,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 48),
            // Form Card Container for input
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: colors.surface,
                borderRadius: BorderRadius.circular(32),
                boxShadow: [
                  BoxShadow(
                    color: colors.text.withOpacity(0.03),
                    blurRadius: 30,
                    offset: const Offset(0, 15),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: _otpController,
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(
                      fontSize: 28,
                      letterSpacing: 10,
                      fontWeight: FontWeight.bold,
                      color: colors.text,
                    ),
                    decoration: InputDecoration(
                      hintText: '000000',
                      counterText: '',
                      filled: true,
                      fillColor: colors.background,
                      hintStyle: GoogleFonts.outfit(color: colors.subtext.withOpacity(0.5), letterSpacing: 10),
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
                        borderSide: const BorderSide(color: AppTheme.primaryColor, width: 2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: _isLoading ? null : _verify,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      padding: const EdgeInsets.symmetric(vertical: 18),
                    ),
                    child: _isLoading
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                        )
                      : Text(
                          lang.t('auth.otp.verifyAccount'),
                          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                  ),
                  const SizedBox(height: 20),
                  // ── Resend OTP ────────────────────────────────────────
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        "Didn't receive the code? ",
                        style: GoogleFonts.outfit(
                          color: Theme.of(context).appColors.subtext,
                          fontSize: 14,
                        ),
                      ),
                      _isResending
                        ? const SizedBox(
                            width: 16, height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.secondaryColor),
                          )
                        : GestureDetector(
                            onTap: _resendCooldown == 0 ? _resend : null,
                            child: Text(
                              _resendCooldown > 0
                                ? '${lang.t('auth.otp.resendIn')} ${_resendCooldown}s'
                                : lang.t('auth.otp.resendCode'),
                              style: GoogleFonts.outfit(
                                color: _resendCooldown > 0
                                  ? Theme.of(context).appColors.subtext
                                  : AppTheme.secondaryColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
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
      ),
    );
  }
}
