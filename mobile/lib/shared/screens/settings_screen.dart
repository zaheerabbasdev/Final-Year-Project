import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../features/auth/auth_service.dart';
import '../../core/providers/theme_provider.dart';
import '../../core/theme.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();
    final themeProvider = context.watch<ThemeProvider>();
    final role = authService.role;
    final colors = Theme.of(context).appColors;
    final isDark = themeProvider.isDarkMode;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.background,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: colors.text, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Settings',
          style: GoogleFonts.outfit(
            color: colors.text,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: colors.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: colors.border),
                ),
                child: Column(
                  children: [
                    if (role == 'customer')
                      _buildMenuItem(
                        context,
                        Icons.payment_outlined,
                        'Payment Methods',
                        () {},
                        colors,
                      ),
                    _buildMenuItem(
                      context,
                      Icons.notifications_none_rounded,
                      'Notifications',
                      () => context.push('/notifications'),
                      colors,
                    ),
                    _buildDarkModeMenuItem(context, themeProvider, colors),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context,
    IconData icon,
    String title,
    VoidCallback onTap,
    AppColors colors,
  ) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: colors.card, borderRadius: BorderRadius.circular(12)),
        child: Icon(icon, color: colors.text, size: 20),
      ),
      title: Text(
        title,
        style: GoogleFonts.outfit(color: colors.text, fontWeight: FontWeight.w600, fontSize: 16),
      ),
      trailing: Icon(Icons.chevron_right, size: 20, color: colors.subtext),
      onTap: onTap,
    );
  }

  Widget _buildDarkModeMenuItem(
    BuildContext context,
    ThemeProvider themeProvider,
    AppColors colors,
  ) {
    final isDark = themeProvider.isDarkMode;
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: colors.card, borderRadius: BorderRadius.circular(12)),
        child: Icon(
          isDark ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
          color: isDark ? const Color(0xFF818CF8) : const Color(0xFFF59E0B),
          size: 20,
        ),
      ),
      title: Text(
        'Dark Mode',
        style: GoogleFonts.outfit(color: colors.text, fontWeight: FontWeight.w600, fontSize: 16),
      ),
      trailing: Switch.adaptive(
        value: isDark,
        activeColor: AppTheme.primaryColor,
        onChanged: (val) => themeProvider.toggleTheme(val),
      ),
    );
  }
}
