import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../features/auth/auth_service.dart';
import '../../core/providers/theme_provider.dart';
import '../../core/providers/currency_provider.dart';
import '../../core/providers/language_provider.dart';
import '../../core/theme.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();
    final themeProvider = context.watch<ThemeProvider>();
    final currencyProvider = context.watch<CurrencyProvider>();
    final langProvider = context.watch<LanguageProvider>();
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
          langProvider.t('settings.title'),
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
                        langProvider.t('settings.paymentMethods'),
                        () {},
                        colors,
                      ),
                    _buildMenuItem(
                      context,
                      Icons.notifications_none_rounded,
                      langProvider.t('settings.notifications'),
                      () => context.push('/notifications'),
                      colors,
                    ),
                    _buildDarkModeMenuItem(context, themeProvider, langProvider, colors),
                    _buildLanguageMenuItem(context, langProvider, colors),
                    _buildCurrencyMenuItem(context, currencyProvider, langProvider, colors),
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
    LanguageProvider langProvider,
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
        langProvider.t('settings.darkMode'),
        style: GoogleFonts.outfit(color: colors.text, fontWeight: FontWeight.w600, fontSize: 16),
      ),
      trailing: Switch.adaptive(
        value: isDark,
        activeColor: AppTheme.primaryColor,
        onChanged: (val) => themeProvider.toggleTheme(val),
      ),
    );
  }

  Widget _buildLanguageMenuItem(
    BuildContext context,
    LanguageProvider langProvider,
    AppColors colors,
  ) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: colors.card, borderRadius: BorderRadius.circular(12)),
        child: Icon(Icons.language_rounded, color: colors.text, size: 20),
      ),
      title: Text(
        langProvider.t('settings.language'),
        style: GoogleFonts.outfit(color: colors.text, fontWeight: FontWeight.w600, fontSize: 16),
      ),
      trailing: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: langProvider.lang,
          dropdownColor: colors.surface,
          icon: Icon(Icons.arrow_drop_down, color: colors.subtext),
          style: GoogleFonts.outfit(color: colors.text, fontWeight: FontWeight.bold),
          onChanged: (String? newValue) {
            if (newValue != null) langProvider.setLanguage(newValue);
          },
          items: [
            DropdownMenuItem(
              value: 'en',
              child: Text(langProvider.t('settings.english')),
            ),
            DropdownMenuItem(
              value: 'ur',
              child: Text(langProvider.t('settings.urdu')),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrencyMenuItem(
    BuildContext context,
    CurrencyProvider currencyProvider,
    LanguageProvider langProvider,
    AppColors colors,
  ) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: colors.card, borderRadius: BorderRadius.circular(12)),
        child: Icon(Icons.monetization_on_outlined, color: colors.text, size: 20),
      ),
      title: Text(
        langProvider.t('settings.currency'),
        style: GoogleFonts.outfit(color: colors.text, fontWeight: FontWeight.w600, fontSize: 16),
      ),
      trailing: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: currencyProvider.selectedCurrency,
          dropdownColor: colors.surface,
          icon: Icon(Icons.arrow_drop_down, color: colors.subtext),
          style: GoogleFonts.outfit(color: colors.text, fontWeight: FontWeight.bold),
          onChanged: (String? newValue) {
            if (newValue != null) {
              currencyProvider.updateCurrency(newValue);
            }
          },
          items: <String>['PKR', 'USD', 'AED', 'SAR', 'EUR', 'GBP'].map<DropdownMenuItem<String>>((String value) {
            return DropdownMenuItem<String>(
              value: value,
              child: Text(value),
            );
          }).toList(),
        ),
      ),
    );
  }
}
