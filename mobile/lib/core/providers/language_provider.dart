import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../l10n/translations.dart';

/// Provides app-wide language/i18n support.
///
/// Usage in a widget:
/// ```dart
/// final lang = context.watch<LanguageProvider>();
/// Text(lang.t('auth.login.title'));
/// ```
class LanguageProvider extends ChangeNotifier {
  static const String _prefKey = 'kaarkun_lang';

  String _lang = 'en';

  String get lang => _lang;
  bool get isUrdu => _lang == 'ur';

  LanguageProvider() {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    _lang = prefs.getString(_prefKey) ?? 'en';
    notifyListeners();
  }

  Future<void> setLanguage(String lang) async {
    if (_lang == lang) return;
    _lang = lang;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, lang);
    notifyListeners();
  }

  /// Returns the translated string for [key] using dot-notation.
  /// Falls back to [key] itself if the path is not found.
  String t(String key) {
    final map = _lang == 'ur' ? urTranslations : enTranslations;
    final parts = key.split('.');
    dynamic current = map;
    for (final part in parts) {
      if (current is Map) {
        current = current[part];
      } else {
        return key;
      }
    }
    return current?.toString() ?? key;
  }
}
