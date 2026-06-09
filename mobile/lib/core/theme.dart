import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand Colors (constant)
  static const Color primaryColor = Color(0xFF003B95);
  static const Color secondaryColor = Color(0xFF0A84FF);
  static const Color errorColor = Color(0xFFEF4444);
  static const Color successColor = Color(0xFF2ECC71);
  static const Color warningColor = Color(0xFFFFB020);

  // Light Mode Colors
  static const Color lightBackground = Color(0xFFF5F7FB);
  static const Color lightSurface = Colors.white;
  static const Color lightText = Color(0xFF1E293B);
  static const Color lightSubtext = Color(0xFF64748B);
  static const Color lightBorder = Color(0xFFE2E8F0);
  static const Color lightCardBg = Color(0xFFF8FAFC);

  // Dark Mode Colors
  static const Color darkBackground = Color(0xFF0F172A);
  static const Color darkSurface = Color(0xFF1E293B);
  static const Color darkCard = Color(0xFF263048);
  static const Color darkText = Color(0xFFF1F5F9);
  static const Color darkSubtext = Color(0xFF94A3B8);
  static const Color darkBorder = Color(0xFF334155);

  // Legacy accessors (map to light mode — only use these in non-theme-aware code)
  static const Color backgroundColor = lightBackground;
  static const Color surfaceColor = lightSurface;
  static const Color textColor = lightText;
  static const Color subtextColor = lightSubtext;

  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: ColorScheme.fromSeed(
      brightness: Brightness.light,
      seedColor: primaryColor,
      primary: primaryColor,
      secondary: secondaryColor,
      surface: lightSurface,
      onSurface: lightText,
    ).copyWith(
      error: errorColor,
    ),
    scaffoldBackgroundColor: lightBackground,
    textTheme: GoogleFonts.outfitTextTheme().copyWith(
      headlineLarge: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: lightText),
      headlineMedium: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: lightText),
      titleLarge: GoogleFonts.outfit(fontWeight: FontWeight.w600, color: lightText),
      bodyLarge: GoogleFonts.outfit(color: lightText),
      bodyMedium: GoogleFonts.outfit(color: lightSubtext),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: lightSurface,
      elevation: 0,
      scrolledUnderElevation: 0,
      iconTheme: IconThemeData(color: lightText),
      titleTextStyle: TextStyle(
        color: lightText,
        fontFamily: 'Outfit',
        fontWeight: FontWeight.bold,
        fontSize: 20,
      ),
    ),
    cardTheme: CardThemeData(
      color: lightSurface,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
    ),
    dividerColor: lightBorder,
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        elevation: 0,
        textStyle: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 16),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: lightCardBg,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: lightBorder, width: 1),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: lightBorder, width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: secondaryColor, width: 2),
      ),
      hintStyle: GoogleFonts.outfit(color: const Color(0xFF94A3B8)),
    ),
    extensions: const [
      AppColors(
        background: lightBackground,
        surface: lightSurface,
        card: lightCardBg,
        text: lightText,
        subtext: lightSubtext,
        border: lightBorder,
      ),
    ],
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: ColorScheme.fromSeed(
      brightness: Brightness.dark,
      seedColor: primaryColor,
      primary: secondaryColor,
      secondary: secondaryColor,
      surface: darkSurface,
      onSurface: darkText,
    ).copyWith(
      error: errorColor,
    ),
    scaffoldBackgroundColor: darkBackground,
    textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme).copyWith(
      headlineLarge: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: darkText),
      headlineMedium: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: darkText),
      titleLarge: GoogleFonts.outfit(fontWeight: FontWeight.w600, color: darkText),
      bodyLarge: GoogleFonts.outfit(color: darkText),
      bodyMedium: GoogleFonts.outfit(color: darkSubtext),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: darkSurface,
      elevation: 0,
      scrolledUnderElevation: 0,
      iconTheme: IconThemeData(color: darkText),
      titleTextStyle: TextStyle(
        color: darkText,
        fontFamily: 'Outfit',
        fontWeight: FontWeight.bold,
        fontSize: 20,
      ),
    ),
    cardTheme: CardThemeData(
      color: darkSurface,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
    ),
    dividerColor: darkBorder,
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        elevation: 0,
        textStyle: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 16),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: darkCard,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: darkBorder, width: 1),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: darkBorder, width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: secondaryColor, width: 2),
      ),
      hintStyle: GoogleFonts.outfit(color: darkSubtext),
    ),
    extensions: const [
      AppColors(
        background: darkBackground,
        surface: darkSurface,
        card: darkCard,
        text: darkText,
        subtext: darkSubtext,
        border: darkBorder,
      ),
    ],
  );
}

/// Custom theme extension for accessing app-specific colors from any widget.
/// Usage: `Theme.of(context).appColors.surface`
@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.background,
    required this.surface,
    required this.card,
    required this.text,
    required this.subtext,
    required this.border,
  });

  final Color background;
  final Color surface;
  final Color card;
  final Color text;
  final Color subtext;
  final Color border;

  @override
  AppColors copyWith({
    Color? background,
    Color? surface,
    Color? card,
    Color? text,
    Color? subtext,
    Color? border,
  }) {
    return AppColors(
      background: background ?? this.background,
      surface: surface ?? this.surface,
      card: card ?? this.card,
      text: text ?? this.text,
      subtext: subtext ?? this.subtext,
      border: border ?? this.border,
    );
  }

  @override
  AppColors lerp(AppColors? other, double t) {
    if (other is! AppColors) return this;
    return AppColors(
      background: Color.lerp(background, other.background, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      card: Color.lerp(card, other.card, t)!,
      text: Color.lerp(text, other.text, t)!,
      subtext: Color.lerp(subtext, other.subtext, t)!,
      border: Color.lerp(border, other.border, t)!,
    );
  }
}

/// Convenience extension to easily access AppColors from a BuildContext.
extension AppColorsExtension on ThemeData {
  AppColors get appColors => extension<AppColors>()!;
}
