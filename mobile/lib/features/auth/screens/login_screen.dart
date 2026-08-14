import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:google_fonts/google_fonts.dart';
import '../auth_service.dart';
import '../../../core/providers/language_provider.dart';
import '../../../core/theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _isPasswordVisible = false;
  bool _rememberMe = false;

  Future<void> _login() async {
    setState(() => _isLoading = true);
    final response = await context.read<AuthService>().login(
      _emailController.text,
      _passwordController.text,
    );
    setState(() => _isLoading = false);
    
    if (response['success'] == true) {
      if (response['role'] == 'provider') {
        Fluttertoast.showToast(
          msg: 'Approval accepted',
          backgroundColor: AppTheme.successColor,
          textColor: Colors.white,
          webBgColor: "linear-gradient(to right, #00b09b, #96c93d)",
        );
      }
      if (mounted) context.go('/main');
    } else if (response['requiresOTP'] == true) {
      // Customer's email is not verified yet.
      // Try to send a fresh OTP so they don't wait on an expired one.
      final email = _emailController.text.trim();
      final resendResult = await context.read<AuthService>().resendOTP(email);

      if (mounted) {
        if (resendResult['success'] == true) {
          Fluttertoast.showToast(
            msg: 'Verification code sent to $email',
            backgroundColor: AppTheme.successColor,
            textColor: Colors.white,
            timeInSecForIosWeb: 4,
          );
        } else {
          // Resend failed (route may not be deployed yet, or rate-limited).
          // Still navigate — user can tap Resend on the OTP screen.
          Fluttertoast.showToast(
            msg: 'Please check your email for the verification code, or tap Resend.',
            backgroundColor: AppTheme.warningColor,
            textColor: Colors.white,
            timeInSecForIosWeb: 4,
          );
        }
        // Pass resendResult success as extra so OTP screen knows
        // whether to start the cooldown immediately or skip it.
        context.push('/verify-otp', extra: email);
      }
    } else {
      String errorMessage = 'Login failed. Please check your credentials.';
      String? backendMessage = response['message'];

      if (backendMessage != null) {
        if (backendMessage.toLowerCase().contains('pending admin approval')) {
          errorMessage = 'Wait for admin approval';
        } else {
          errorMessage = backendMessage;
        }
      }

      Fluttertoast.showToast(
        msg: errorMessage,
        backgroundColor: AppTheme.errorColor,
        textColor: Colors.white,
        webBgColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).appColors;
    final lang = context.watch<LanguageProvider>();
    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            children: [
              const SizedBox(height: 24),
              // App Logo Container with soft gradient background glow
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
                  child: Image.asset(
                    'assets/images/icon.png',
                    height: 80,
                    width: 80,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => const Icon(
                      Icons.business_center_rounded,
                      size: 60,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 28),
              Text(
                lang.t('auth.login.title'),
                style: GoogleFonts.outfit(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: colors.text,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                lang.t('auth.login.subtitle'),
                style: GoogleFonts.outfit(
                  color: colors.subtext,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 36),
              // Form Card
              Container(
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  color: colors.surface,
                  borderRadius: BorderRadius.circular(32),
                  boxShadow: [
                    BoxShadow(
                      color: colors.text.withOpacity(0.04),
                      blurRadius: 30,
                      offset: const Offset(0, 15),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _buildLabel(lang.t('auth.login.emailLabel'), colors),
                    TextField(
                      controller: _emailController,
                      textInputAction: TextInputAction.next,
                      keyboardType: TextInputType.emailAddress,
                      style: GoogleFonts.outfit(color: colors.text),
                      decoration: InputDecoration(
                        hintText: lang.t('auth.login.emailHint'),
                      ),
                    ),
                    const SizedBox(height: 24),
                    _buildLabel(lang.t('auth.login.passwordLabel'), colors),
                    TextField(
                      controller: _passwordController,
                      obscureText: !_isPasswordVisible,
                      textInputAction: TextInputAction.done,
                      onSubmitted: (_) => _login(),
                      style: GoogleFonts.outfit(color: colors.text),
                      decoration: InputDecoration(
                        hintText: lang.t('auth.login.passwordHint'),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _isPasswordVisible ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            color: colors.subtext.withOpacity(0.7),
                          ),
                          onPressed: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            SizedBox(
                              height: 24,
                              width: 24,
                              child: Checkbox(
                                value: _rememberMe,
                                activeColor: AppTheme.primaryColor,
                                onChanged: (value) => setState(() => _rememberMe = value!),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              lang.t('auth.login.rememberMe'),
                              style: GoogleFonts.outfit(
                                color: colors.text,
                                fontWeight: FontWeight.w500,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                        TextButton(
                          onPressed: () => context.push('/forgot-password'),
                          style: TextButton.styleFrom(
                            padding: EdgeInsets.zero,
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: Text(
                            lang.t('auth.login.forgotPassword'),
                            style: GoogleFonts.outfit(
                              color: AppTheme.secondaryColor,
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 28),
                    ElevatedButton(
                      onPressed: _isLoading ? null : _login,
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
                            lang.t('auth.login.signIn'),
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                    ),
                    const SizedBox(height: 28),
                    Row(
                      children: [
                        Expanded(child: Divider(color: colors.border, thickness: 1)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text(
                            lang.t('auth.login.orContinueWith'),
                            style: GoogleFonts.outfit(
                              color: colors.subtext,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        Expanded(child: Divider(color: colors.border, thickness: 1)),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(child: _buildSocialButton('Google', Icons.g_mobiledata, colors)),
                        const SizedBox(width: 16),
                        Expanded(child: _buildSocialButton('Facebook', Icons.facebook, colors)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 36),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    lang.t('auth.login.noAccount'),
                    style: GoogleFonts.outfit(
                      color: colors.subtext,
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  TextButton(
                    onPressed: () => context.push('/signup'),
                    style: TextButton.styleFrom(
                      padding: EdgeInsets.zero,
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: Text(
                      lang.t('auth.login.signUp'),
                      style: GoogleFonts.outfit(
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Text(
                'Demo: Use customer@test.com, provider@test.com, or admin@test.com',
                style: GoogleFonts.outfit(
                  color: colors.subtext.withOpacity(0.8),
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text, AppColors colors) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        text,
        style: GoogleFonts.outfit(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: colors.text,
        ),
      ),
    );
  }

  Widget _buildSocialButton(String label, IconData icon, AppColors colors) {
    return OutlinedButton(
      onPressed: () {},
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        side: BorderSide(color: colors.border),
        backgroundColor: colors.surface,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 24,
            color: label == 'Google' ? Colors.red.shade600 : Colors.blue.shade700,
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: GoogleFonts.outfit(
              color: colors.text,
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }
}
