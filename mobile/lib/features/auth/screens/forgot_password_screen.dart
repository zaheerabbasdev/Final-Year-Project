import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/theme.dart';
import '../auth_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  // Step 1 — enter email
  final _emailController       = TextEditingController();
  // Step 2 — enter OTP + new password
  final _otpController         = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  int  _step       = 1;   // 1 = email, 2 = otp+password, 3 = success
  bool _isLoading  = false;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  String? _error;
  String  _email   = '';

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      setState(() => _error = 'Please enter your email address.');
      return;
    }
    setState(() { _isLoading = true; _error = null; });

    final auth = context.read<AuthService>();
    final result = await auth.forgotPassword(email);

    setState(() { _isLoading = false; });
    if (result['success'] == true) {
      setState(() { _email = email; _step = 2; });
    } else {
      setState(() => _error = result['message']);
    }
  }

  Future<void> _resetPassword() async {
    final otp      = _otpController.text.trim();
    final newPass  = _newPasswordController.text;
    final confirm  = _confirmPasswordController.text;

    if (otp.isEmpty || newPass.isEmpty || confirm.isEmpty) {
      setState(() => _error = 'Please fill in all fields.');
      return;
    }
    if (newPass.length < 6) {
      setState(() => _error = 'Password must be at least 6 characters.');
      return;
    }
    if (newPass != confirm) {
      setState(() => _error = 'Passwords do not match.');
      return;
    }

    setState(() { _isLoading = true; _error = null; });

    final auth = context.read<AuthService>();
    final result = await auth.resetPassword(_email, otp, newPass);

    setState(() { _isLoading = false; });
    if (result['success'] == true) {
      setState(() => _step = 3);
    } else {
      setState(() => _error = result['message']);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).appColors;
    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: colors.text),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            children: [
              const SizedBox(height: 16),
              // Icon
              Center(
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: colors.surface,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryColor.withOpacity(0.08),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Icon(
                    _step == 3 ? Icons.check_circle_outline_rounded : Icons.lock_reset_rounded,
                    size: 60,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ),
              const SizedBox(height: 28),
              Text(
                _step == 1 ? 'Forgot Password?' :
                _step == 2 ? 'Enter Reset Code' : 'Password Reset!',
                style: GoogleFonts.outfit(
                  fontSize: 30,
                  fontWeight: FontWeight.w800,
                  color: colors.text,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                _step == 1
                    ? "Enter your email and we'll send you a 6-digit reset code."
                    : _step == 2
                        ? "Check your email ($_email) for the 6-digit code."
                        : "Your password has been updated. You can now log in.",
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  color: colors.subtext,
                  fontSize: 15,
                  height: 1.5,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 32),

              // Error banner
              if (_error != null) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Text(
                    _error!,
                    style: GoogleFonts.outfit(color: Colors.red.shade700, fontSize: 14),
                  ),
                ),
              ],

              // Step 1 — Email
              if (_step == 1) _buildCard(colors, [
                _label(colors, 'Email Address'),
                const SizedBox(height: 8),
                _textField(
                  controller: _emailController,
                  hint: 'you@example.com',
                  keyboardType: TextInputType.emailAddress,
                  colors: colors,
                ),
                const SizedBox(height: 24),
                _primaryButton('Send Reset Code', _isLoading, _sendCode),
              ]),

              // Step 2 — OTP + new password
              if (_step == 2) _buildCard(colors, [
                _label(colors, 'Reset Code'),
                const SizedBox(height: 8),
                _textField(
                  controller: _otpController,
                  hint: '6-digit code',
                  keyboardType: TextInputType.number,
                  colors: colors,
                ),
                const SizedBox(height: 20),
                _label(colors, 'New Password'),
                const SizedBox(height: 8),
                _textField(
                  controller: _newPasswordController,
                  hint: 'At least 6 characters',
                  obscure: _obscureNew,
                  colors: colors,
                  suffixIcon: IconButton(
                    icon: Icon(_obscureNew ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        color: colors.subtext, size: 20),
                    onPressed: () => setState(() => _obscureNew = !_obscureNew),
                  ),
                ),
                const SizedBox(height: 20),
                _label(colors, 'Confirm Password'),
                const SizedBox(height: 8),
                _textField(
                  controller: _confirmPasswordController,
                  hint: 'Repeat new password',
                  obscure: _obscureConfirm,
                  colors: colors,
                  suffixIcon: IconButton(
                    icon: Icon(_obscureConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        color: colors.subtext, size: 20),
                    onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                  ),
                ),
                const SizedBox(height: 24),
                _primaryButton('Reset Password', _isLoading, _resetPassword),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: _isLoading ? null : () => setState(() { _step = 1; _error = null; }),
                  child: Text('← Back / Resend code',
                      style: GoogleFonts.outfit(color: colors.subtext, fontSize: 14)),
                ),
              ]),

              // Step 3 — Success
              if (_step == 3) ...[
                ElevatedButton(
                  onPressed: () => context.pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 56),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text('Back to Login',
                      style: GoogleFonts.outfit(fontSize: 17, fontWeight: FontWeight.bold)),
                ),
              ],
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCard(AppColors colors, List<Widget> children) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: colors.text.withOpacity(0.04),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: children,
      ),
    );
  }

  Widget _label(AppColors colors, String text) => Text(
    text,
    style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600, color: colors.text),
  );

  Widget _textField({
    required TextEditingController controller,
    required String hint,
    required AppColors colors,
    TextInputType keyboardType = TextInputType.text,
    bool obscure = false,
    Widget? suffixIcon,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscure,
      style: GoogleFonts.outfit(color: colors.text),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.outfit(color: colors.subtext),
        suffixIcon: suffixIcon,
      ),
    );
  }

  Widget _primaryButton(String label, bool loading, VoidCallback onPressed) {
    return ElevatedButton(
      onPressed: loading ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      child: loading
          ? const SizedBox(
              height: 22, width: 22,
              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
          : Text(label, style: GoogleFonts.outfit(fontSize: 17, fontWeight: FontWeight.bold)),
    );
  }
}
