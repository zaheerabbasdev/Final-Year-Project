import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class WalletBottomSheet extends StatefulWidget {
  final String userName;
  final double initialBalance;
  
  const WalletBottomSheet({
    super.key, 
    required this.userName,
    this.initialBalance = 12500.0,
  });

  @override
  State<WalletBottomSheet> createState() => _WalletBottomSheetState();
}

class _WalletBottomSheetState extends State<WalletBottomSheet> {
  late double _balance;
  final List<Map<String, dynamic>> _transactions = [
    {
      'title': 'Plumbing Service Payment',
      'subtitle': 'Booking Ref: #KK-9042',
      'amount': -3500.0,
      'date': 'Today, 2:30 PM',
      'icon': Icons.build_outlined,
      'color': const Color(0xFFEF4444),
    },
    {
      'title': 'Deposit from UBL App',
      'subtitle': 'Ref: IMFT-084920',
      'amount': 15000.0,
      'date': 'Yesterday, 11:15 AM',
      'icon': Icons.account_balance,
      'color': const Color(0xFF2ECC71),
    },
    {
      'title': 'Electrician Bid Payment',
      'subtitle': 'Booking Ref: #KK-8831',
      'amount': -5200.0,
      'date': '21 May, 6:45 PM',
      'icon': Icons.bolt,
      'color': const Color(0xFFEF4444),
    },
    {
      'title': 'Refund on Job Cancellation',
      'subtitle': 'Refund Ref: #RF-0091',
      'amount': 2500.0,
      'date': '19 May, 10:00 AM',
      'icon': Icons.refresh_rounded,
      'color': const Color(0xFF2ECC71),
    },
  ];

  @override
  void initState() {
    super.initState();
    _balance = widget.initialBalance;
  }

  void _showSimulationDialog(String action) {
    final amountController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Row(
          children: [
            Icon(
              action == 'Deposit' ? Icons.add_circle_outline : Icons.send_rounded,
              color: const Color(0xFF003B95),
            ),
            const SizedBox(width: 8),
            Text(
              '$action Simulation',
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              action == 'Deposit' 
                ? 'Enter the amount you would like to top-up into your Kaarkun wallet:'
                : 'Enter the amount you would like to transfer to a bank account:',
              style: GoogleFonts.outfit(fontSize: 14, color: const Color(0xFF64748B)),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                prefixText: 'PKR ',
                prefixStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                hintText: '0.00',
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              ),
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF1E293B)),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            onPressed: () {
              final double? amt = double.tryParse(amountController.text);
              if (amt == null || amt <= 0) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please enter a valid amount')),
                );
                return;
              }
              if (action == 'Transfer' && amt > _balance) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Insufficient balance inside wallet')),
                );
                return;
              }
              setState(() {
                if (action == 'Deposit') {
                  _balance += amt;
                  _transactions.insert(0, {
                    'title': 'Deposit Completed',
                    'subtitle': 'Ref: SIM-DEP-${DateTime.now().millisecond}',
                    'amount': amt,
                    'date': 'Just Now',
                    'icon': Icons.add_circle,
                    'color': const Color(0xFF2ECC71),
                  });
                } else {
                  _balance -= amt;
                  _transactions.insert(0, {
                    'title': 'Transferred to Bank',
                    'subtitle': 'Ref: SIM-TXF-${DateTime.now().millisecond}',
                    'amount': -amt,
                    'date': 'Just Now',
                    'icon': Icons.send,
                    'color': const Color(0xFFEF4444),
                  });
                }
              });
              Navigator.pop(context);
              
              // Custom Toast/SnackBar
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  backgroundColor: const Color(0xFF003B95),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  behavior: SnackBarBehavior.floating,
                  margin: const EdgeInsets.all(16),
                  content: Row(
                    children: [
                      const Icon(Icons.check_circle_outline, color: Colors.white),
                      const SizedBox(width: 12),
                      Text(
                        'Success! Wallet balance updated.',
                        style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF003B95),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('Proceed', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFFF5F7FB),
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: const EdgeInsets.only(top: 8),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag Indicator
          Container(
            width: 48,
            height: 5,
            decoration: BoxDecoration(
              color: const Color(0xFFCBD5E1),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 16),
          
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Kaarkun Digital Wallet',
                      style: GoogleFonts.outfit(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF1E293B),
                      ),
                    ),
                    Text(
                      'Instant & Secured Payments',
                      style: GoogleFonts.outfit(
                        fontSize: 13,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                  onPressed: () => Navigator.pop(context),
                )
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Scrollable content
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  // Gradient Premium Card
                  Container(
                    width: double.infinity,
                    height: 200,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF003B95), Color(0xFF0A84FF)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF003B95).withOpacity(0.35),
                          blurRadius: 24,
                          offset: const Offset(0, 12),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(24),
                    child: Stack(
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'PREMIUM ACCOUNT',
                                  style: GoogleFonts.outfit(
                                    color: Colors.white70,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                                Image.network(
                                  'https://img.icons8.com/color/48/visa.png',
                                  width: 45,
                                  height: 30,
                                  errorBuilder: (_, __, ___) => const Icon(Icons.credit_card, color: Colors.white),
                                ),
                              ],
                            ),
                            const Spacer(),
                            Text(
                              'PKR ${_balance.toStringAsFixed(2)}',
                              style: GoogleFonts.outfit(
                                color: Colors.white,
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const Spacer(),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'CARD HOLDER',
                                      style: GoogleFonts.outfit(color: Colors.white.withOpacity(0.55), fontSize: 9, letterSpacing: 1),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      widget.userName.toUpperCase(),
                                      style: GoogleFonts.outfit(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                                    ),
                                  ],
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'CARD NUMBER',
                                      style: GoogleFonts.outfit(color: Colors.white.withOpacity(0.55), fontSize: 9, letterSpacing: 1),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '**** **** **** 8490',
                                      style: GoogleFonts.outfit(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Quick Transaction Simulator Actions
                  Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: () => _showSimulationDialog('Deposit'),
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.add_rounded, color: Color(0xFF003B95)),
                                const SizedBox(width: 8),
                                Text(
                                  'Top Up',
                                  style: GoogleFonts.outfit(
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF1E293B),
                                    fontSize: 15,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: InkWell(
                          onTap: () => _showSimulationDialog('Transfer'),
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.send_rounded, color: Color(0xFF0A84FF)),
                                const SizedBox(width: 8),
                                Text(
                                  'Send Money',
                                  style: GoogleFonts.outfit(
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF1E293B),
                                    fontSize: 15,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Transaction list header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Recent Activity',
                        style: GoogleFonts.outfit(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                      Text(
                        'Banking Log',
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          color: const Color(0xFF64748B),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Transaction List
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _transactions.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final tx = _transactions[index];
                      final isNegative = tx['amount'] < 0;
                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.01),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            // Icon container
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: tx['color'].withOpacity(0.08),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Icon(tx['icon'], color: tx['color'], size: 20),
                            ),
                            const SizedBox(width: 16),
                            
                            // Text column
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    tx['title'],
                                    style: GoogleFonts.outfit(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                      color: const Color(0xFF1E293B),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    tx['subtitle'],
                                    style: GoogleFonts.outfit(
                                      color: const Color(0xFF64748B),
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),

                            // Price and Date Column
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '${isNegative ? '-' : '+'}${isNegative ? tx['amount'] * -1 : tx['amount']} PKR',
                                  style: GoogleFonts.outfit(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: tx['color'],
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  tx['date'],
                                  style: GoogleFonts.outfit(
                                    color: const Color(0xFF94A3B8),
                                    fontSize: 10,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
