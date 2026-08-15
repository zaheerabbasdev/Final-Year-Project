import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class WalletTransaction {
  final int id;
  final String type; // 'credit' | 'debit'
  final double amount;
  final String description;
  final String referenceType; // 'topup'|'withdrawal'|'payment'|'refund'|'earning'
  final double balanceAfter;
  final String status;
  final DateTime createdAt;

  WalletTransaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.description,
    required this.referenceType,
    required this.balanceAfter,
    required this.status,
    required this.createdAt,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    return WalletTransaction(
      id: json['id'] as int,
      type: json['type'] as String,
      amount: double.tryParse(json['amount'].toString()) ?? 0.0,
      description: json['description'] as String,
      referenceType: json['reference_type'] as String,
      balanceAfter: double.tryParse(json['balance_after'].toString()) ?? 0.0,
      status: json['status'] as String,
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

class WalletService extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  double _balance = 0.0;
  List<WalletTransaction> _transactions = [];
  int _total = 0;
  bool _loading = false;
  bool _loadingMore = false;
  String? _error;

  static const int _limit = 10;
  int _offset = 0;

  double get balance => _balance;
  List<WalletTransaction> get transactions => _transactions;
  int get total => _total;
  bool get loading => _loading;
  bool get loadingMore => _loadingMore;
  String? get error => _error;
  bool get hasMore => _transactions.length < _total;

  Future<void> fetchWallet() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.dio.get('/wallet');
      final data = res.data as Map<String, dynamic>;
      _balance = double.tryParse(data['balance'].toString()) ?? 0.0;
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> fetchTransactions({bool reset = false}) async {
    if (reset) {
      _offset = 0;
      _transactions = [];
    }
    if (reset) {
      _loading = true;
    } else {
      _loadingMore = true;
    }
    _error = null;
    notifyListeners();
    try {
      final res = await _api.dio.get('/wallet/transactions?limit=$_limit&offset=$_offset');
      final data = res.data as Map<String, dynamic>;
      final list = (data['transactions'] as List<dynamic>? ?? [])
          .map((e) => WalletTransaction.fromJson(e as Map<String, dynamic>))
          .toList();
      _total = data['total'] as int? ?? 0;
      _transactions = [..._transactions, ...list];
      _offset += list.length;
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      _loadingMore = false;
      notifyListeners();
    }
  }

  /// Returns new balance on success; throws on error.
  Future<double> topUp(double amount) async {
    final res = await _api.dio.post('/wallet/topup', data: {'amount': amount});
    final newBalance = double.tryParse(res.data['new_balance'].toString()) ?? _balance;
    _balance = newBalance;
    notifyListeners();
    await fetchTransactions(reset: true);
    return newBalance;
  }

  /// Returns new balance on success; throws on error.
  Future<double> withdraw(double amount, String method) async {
    final res = await _api.dio.post('/wallet/withdraw', data: {'amount': amount, 'method': method});
    final newBalance = double.tryParse(res.data['new_balance'].toString()) ?? _balance;
    _balance = newBalance;
    notifyListeners();
    await fetchTransactions(reset: true);
    return newBalance;
  }

  void reset() {
    _balance = 0.0;
    _transactions = [];
    _total = 0;
    _offset = 0;
    _error = null;
    _loading = false;
    _loadingMore = false;
    notifyListeners();
  }
}
