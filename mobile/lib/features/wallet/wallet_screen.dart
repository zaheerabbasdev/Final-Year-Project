import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/providers/language_provider.dart';
import '../../core/theme.dart';
import 'wallet_service.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ws = context.read<WalletService>();
      ws.fetchWallet();
      ws.fetchTransactions(reset: true);
    });
  }

  void _showTopUpSheet() {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (_) => const _TopUpDialog(),
    );
  }

  void _showWithdrawSheet() {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (_) => const _WithdrawDialog(),
    );
  }

  void _showSnack(String msg, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: GoogleFonts.outfit()),
      backgroundColor: error ? Colors.red.shade700 : Colors.green.shade700,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();
    final colors = Theme.of(context).appColors;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          lang.t('wallet.title'),
          style: GoogleFonts.outfit(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: colors.text,
          ),
        ),
        iconTheme: IconThemeData(color: colors.text),
      ),
      body: Consumer<WalletService>(
        builder: (context, ws, _) {
          if (ws.loading && ws.transactions.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(color: AppTheme.primaryColor),
                  const SizedBox(height: 12),
                  Text(lang.t('wallet.loading'), style: GoogleFonts.outfit(color: colors.subtext)),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              await ws.fetchWallet();
              await ws.fetchTransactions(reset: true);
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
              children: [
                const SizedBox(height: 8),

                // ── Balance card ──
                _buildBalanceCard(ws, lang, colors, isDark),

                const SizedBox(height: 24),

                // ── Transaction list header ──
                Row(
                  children: [
                    Text(
                      lang.t('wallet.transactions'),
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: colors.text,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.refresh, size: 20),
                      color: colors.subtext,
                      onPressed: () {
                        ws.fetchWallet();
                        ws.fetchTransactions(reset: true);
                      },
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                if (ws.transactions.isEmpty && !ws.loading)
                  _buildEmptyState(lang, colors)
                else
                  ...ws.transactions.map((tx) => _buildTxTile(tx, lang, colors)),

                if (ws.hasMore) ...[
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: ws.loadingMore ? null : () => ws.fetchTransactions(),
                    child: ws.loadingMore
                        ? SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: const Color(0xFF2563EB)),
                          )
                        : Text(
                            lang.t('wallet.loadMore'),
                            style: GoogleFonts.outfit(color: const Color(0xFF2563EB), fontWeight: FontWeight.w600),
                          ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildBalanceCard(WalletService ws, LanguageProvider lang, AppColors colors, bool isDark) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2563EB), Color(0xFF0EA5E9), Color(0xFF06B6D4)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2563EB).withOpacity(0.35),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.account_balance_wallet_rounded, color: Colors.white70, size: 20),
              const SizedBox(width: 8),
              Text(
                lang.t('wallet.balance'),
                style: GoogleFonts.outfit(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'PKR ${_fmt(ws.balance)}',
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontSize: 36,
              fontWeight: FontWeight.w900,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            lang.t('wallet.customerInfo'),
            style: GoogleFonts.outfit(color: Colors.white60, fontSize: 12),
          ),

          // Escrow row — only shown when funds are locked
          if (ws.escrowBalance > 0) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  const Icon(Icons.lock_outline_rounded, color: Colors.white70, size: 15),
                  const SizedBox(width: 8),
                  Text(
                    'PKR ${_fmt(ws.escrowBalance)}  ${lang.t('wallet.inEscrow')}',
                    style: GoogleFonts.outfit(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 20),
          Row(
            children: [
              _cardButton(Icons.add_rounded, lang.t('wallet.topUp'), _showTopUpSheet),
              const SizedBox(width: 12),
              _cardButton(Icons.remove_rounded, lang.t('wallet.withdraw'),
                  ws.balance >= 500 ? _showWithdrawSheet : null),
            ],
          ),
        ],
      ),
    );
  }

  Widget _cardButton(IconData icon, String label, VoidCallback? onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Opacity(
          opacity: onTap == null ? 0.4 : 1.0,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Icon(icon, color: Colors.white, size: 22),
                const SizedBox(height: 4),
                Text(label, style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(LanguageProvider lang, AppColors colors) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(
        children: [
          Icon(Icons.account_balance_wallet_outlined, size: 52, color: colors.subtext.withOpacity(0.4)),
          const SizedBox(height: 12),
          Text(
            lang.t('wallet.noTransactions'),
            style: GoogleFonts.outfit(fontWeight: FontWeight.w600, color: colors.subtext),
          ),
          const SizedBox(height: 6),
          Text(
            lang.t('wallet.noTransactionsDesc'),
            textAlign: TextAlign.center,
            style: GoogleFonts.outfit(fontSize: 13, color: colors.subtext.withOpacity(0.6)),
          ),
        ],
      ),
    );
  }

  Widget _buildTxTile(WalletTransaction tx, LanguageProvider lang, AppColors colors) {
    final isCredit = tx.type == 'credit';
    final iconColor = isCredit ? const Color(0xFF10B981) : const Color(0xFFEF4444);
    final iconBg = isCredit
        ? const Color(0xFF10B981).withOpacity(0.12)
        : const Color(0xFFEF4444).withOpacity(0.12);
    final amountText = '${isCredit ? '+' : '-'}PKR ${_fmt(tx.amount)}';
    final typeLabel = _typeLabel(tx.referenceType, lang);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.border, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            // Icon
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(14)),
              child: Icon(
                isCredit ? Icons.trending_up_rounded : Icons.trending_down_rounded,
                color: iconColor,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),

            // Title + subtitle
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    tx.description,
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13, color: colors.text),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: iconBg,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(typeLabel, style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: iconColor)),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _formatDate(tx.createdAt),
                        style: GoogleFonts.outfit(fontSize: 11, color: colors.subtext),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),

            // Amount + balance after (fixed width, no overflow)
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  amountText,
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: iconColor,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Bal: PKR ${_fmt(tx.balanceAfter)}',
                  style: GoogleFonts.outfit(fontSize: 10, color: colors.subtext),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _typeLabel(String ref, LanguageProvider lang) {
    switch (ref) {
      case 'topup':      return lang.t('wallet.topupLabel');
      case 'withdrawal': return lang.t('wallet.withdrawalLabel');
      case 'payment':    return lang.t('wallet.paymentLabel');
      case 'refund':     return lang.t('wallet.refundLabel');
      case 'earning':    return lang.t('wallet.earningLabel');
      default:           return ref;
    }
  }

  String _fmt(double v) => v.round().toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
        (m) => '${m[1]},',
      );

  String _formatDate(DateTime dt) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
  }
}

// ─────────────────────────────────────────────
// TOP UP CENTER DIALOG
// ─────────────────────────────────────────────
class _TopUpDialog extends StatefulWidget {
  const _TopUpDialog();

  @override
  State<_TopUpDialog> createState() => _TopUpSheetState();
}

class _TopUpSheetState extends State<_TopUpDialog> {
  final _controller = TextEditingController();
  bool _processing = false;
  final List<double> _quickAmounts = [500, 1000, 2000, 5000];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final val = double.tryParse(_controller.text.trim());
    final lang = context.read<LanguageProvider>();
    if (val == null || val < 100) {
      _snack(lang.t('wallet.topUpMin'), error: true);
      return;
    }
    if (val > 50000) {
      _snack(lang.t('wallet.topUpMax'), error: true);
      return;
    }
    setState(() => _processing = true);
    try {
      await context.read<WalletService>().topUp(val);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(lang.t('wallet.topUpSuccess'), style: GoogleFonts.outfit()),
          backgroundColor: Colors.green.shade700,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ));
      }
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  void _snack(String msg, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: GoogleFonts.outfit()),
      backgroundColor: error ? Colors.red.shade700 : Colors.green.shade700,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();
    final colors = Theme.of(context).appColors;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1A1A2E) : Colors.white,
          borderRadius: BorderRadius.circular(28),
        ),
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 28),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(lang.t('wallet.topUpTitle'), style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: colors.text)),
                        Text(lang.t('wallet.topUpSubtitle'), style: GoogleFonts.outfit(fontSize: 12, color: colors.subtext)),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(10)),
                      child: Icon(Icons.close, size: 18, color: colors.subtext),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Quick amounts
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _quickAmounts.map((a) {
                  final selected = _controller.text == a.toInt().toString();
                  return GestureDetector(
                    onTap: () => setState(() => _controller.text = a.toInt().toString()),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: selected ? const Color(0xFF2563EB) : colors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: selected ? const Color(0xFF2563EB) : colors.border),
                      ),
                      child: Text(
                        'PKR ${a.toInt()}',
                        style: GoogleFonts.outfit(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                          color: selected ? Colors.white : colors.text,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),

              TextField(
                controller: _controller,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                style: GoogleFonts.outfit(color: colors.text),
                decoration: InputDecoration(
                  labelText: lang.t('wallet.topUpAmount'),
                  hintText: lang.t('wallet.topUpPlaceholder'),
                  prefixText: 'PKR ',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(color: colors.border),
                  ),
                  filled: true,
                  fillColor: colors.surface,
                ),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _processing ? null : _submit,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                  ),
                  child: _processing
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(lang.t('wallet.topUpBtn'), style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// WITHDRAW CENTER DIALOG
// ─────────────────────────────────────────────
class _WithdrawDialog extends StatefulWidget {
  const _WithdrawDialog();

  @override
  State<_WithdrawDialog> createState() => _WithdrawSheetState();
}

class _WithdrawSheetState extends State<_WithdrawDialog> {
  final _controller = TextEditingController();
  String _method = 'bank_transfer';
  bool _processing = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final val = double.tryParse(_controller.text.trim());
    final lang = context.read<LanguageProvider>();
    final ws = context.read<WalletService>();
    if (val == null || val < 500) {
      _snack(lang.t('wallet.withdrawMin'), error: true);
      return;
    }
    if (val > ws.balance) {
      _snack(lang.t('wallet.insufficientBalance'), error: true);
      return;
    }
    setState(() => _processing = true);
    try {
      await ws.withdraw(val, _method);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(lang.t('wallet.withdrawSuccess'), style: GoogleFonts.outfit()),
          backgroundColor: Colors.green.shade700,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ));
      }
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  void _snack(String msg, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: GoogleFonts.outfit()),
      backgroundColor: error ? Colors.red.shade700 : Colors.green.shade700,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();
    final colors = Theme.of(context).appColors;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final balance = context.watch<WalletService>().balance;

    final methods = [
      {'key': 'bank_transfer', 'label': lang.t('wallet.bankTransfer')},
      {'key': 'jazzcash',      'label': lang.t('wallet.jazzCash')},
      {'key': 'easypaisa',     'label': lang.t('wallet.easyPaisa')},
    ];

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1A1A2E) : Colors.white,
          borderRadius: BorderRadius.circular(28),
        ),
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 28),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(lang.t('wallet.withdrawTitle'), style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: colors.text)),
                        Text(lang.t('wallet.withdrawSubtitle'), style: GoogleFonts.outfit(fontSize: 12, color: colors.subtext)),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(10)),
                      child: Icon(Icons.close, size: 18, color: colors.subtext),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              TextField(
                controller: _controller,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                style: GoogleFonts.outfit(color: colors.text),
                decoration: InputDecoration(
                  labelText: lang.t('wallet.withdrawAmount'),
                  hintText: lang.t('wallet.withdrawPlaceholder'),
                  prefixText: 'PKR ',
                  helperText: '${lang.t('wallet.withdrawMin')} · Balance: PKR ${balance.toStringAsFixed(0)}',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(color: colors.border),
                  ),
                  filled: true,
                  fillColor: colors.surface,
                ),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 16),

              Text(lang.t('wallet.withdrawMethod'), style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: colors.subtext)),
              const SizedBox(height: 10),
              Row(
                children: methods.map((m) {
                  final isSelected = _method == m['key'];
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _method = m['key']!),
                      child: Container(
                        margin: methods.indexOf(m) < methods.length - 1
                            ? const EdgeInsets.only(right: 8)
                            : EdgeInsets.zero,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF2563EB) : colors.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isSelected ? const Color(0xFF2563EB) : colors.border,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            m['label']!,
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isSelected ? Colors.white : colors.text,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _processing ? null : _submit,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                  ),
                  child: _processing
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(lang.t('wallet.withdrawBtn'), style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
