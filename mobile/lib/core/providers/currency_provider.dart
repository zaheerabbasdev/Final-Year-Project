import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Supported currencies with their conversion rates from PKR base
class CurrencyInfo {
  final String code;
  final String symbol;
  final String name;
  final double rateFromPkr; // How many PKR = 1 unit of this currency

  const CurrencyInfo({
    required this.code,
    required this.symbol,
    required this.name,
    required this.rateFromPkr,
  });
}

class CurrencyProvider with ChangeNotifier {
  String _selectedCurrency = 'PKR';

  // All supported currencies (base: PKR)
  static const List<CurrencyInfo> supportedCurrencies = [
    CurrencyInfo(code: 'PKR', symbol: '₨',  name: 'Pakistani Rupee',  rateFromPkr: 1.0),
    CurrencyInfo(code: 'USD', symbol: '\$',  name: 'US Dollar',        rateFromPkr: 278.0),
    CurrencyInfo(code: 'AED', symbol: 'د.إ', name: 'UAE Dirham',       rateFromPkr: 75.7),
    CurrencyInfo(code: 'SAR', symbol: '﷼',  name: 'Saudi Riyal',      rateFromPkr: 74.0),
    CurrencyInfo(code: 'EUR', symbol: '€',   name: 'Euro',             rateFromPkr: 300.0),
    CurrencyInfo(code: 'GBP', symbol: '£',   name: 'British Pound',    rateFromPkr: 352.0),
  ];

  // Legacy static constants kept for backward compatibility
  static const double usdRate = 278.0;
  static const double aedRate = 75.7;

  String get selectedCurrency => _selectedCurrency;

  CurrencyInfo get currentCurrencyInfo =>
      supportedCurrencies.firstWhere(
        (c) => c.code == _selectedCurrency,
        orElse: () => supportedCurrencies.first,
      );

  String get symbol => currentCurrencyInfo.symbol;

  Future<void> loadCurrency() async {
    final prefs = await SharedPreferences.getInstance();
    _selectedCurrency = prefs.getString('selected_currency') ?? 'PKR';
    notifyListeners();
  }

  Future<void> updateCurrency(String newCurrency) async {
    _selectedCurrency = newCurrency;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('selected_currency', newCurrency);
    notifyListeners();
  }

  /// Converts a PKR amount to the selected currency and returns a formatted string.
  String format(dynamic amountInPkr) {
    if (amountInPkr == null) return '${currentCurrencyInfo.symbol}0';
    final double pkrVal = double.tryParse(amountInPkr.toString()) ?? 0.0;
    final info = currentCurrencyInfo;

    if (info.code == 'PKR') {
      return '${info.symbol} ${pkrVal.toInt()}';
    } else {
      final double converted = pkrVal / info.rateFromPkr;
      return '${info.code} ${converted.toStringAsFixed(2)}';
    }
  }
}
