import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../customer/job_service.dart';
import '../../../core/api_client.dart';

class MyBidsScreen extends StatefulWidget {
  const MyBidsScreen({super.key});

  @override
  State<MyBidsScreen> createState() => _MyBidsScreenState();
}

class _MyBidsScreenState extends State<MyBidsScreen> {
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBids();
  }

  Future<void> _loadBids() async {
    setState(() => _isLoading = true);
    await context.read<JobService>().fetchProviderBids();
    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final _allBids = context.watch<JobService>().providerBids;
    final pendingCount = _allBids.where((b) => b['status'] == 'pending').length;
    final acceptedCount = _allBids.where((b) => b['status'] == 'accepted').length;

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          title: const Text(
            'My Bids',
            style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold, fontSize: 20),
          ),
          bottom: TabBar(
            indicatorColor: const Color(0xFF6366F1),
            indicatorWeight: 3,
            labelColor: const Color(0xFF6366F1),
            unselectedLabelColor: const Color(0xFF64748B),
            labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            tabs: [
              Tab(text: 'All (${_allBids.length})'),
              Tab(text: 'Pending ($pendingCount)'),
              Tab(text: 'Accepted ($acceptedCount)'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildBidsList(_allBids),
            _buildBidsList(_allBids.where((b) => b['status'] == 'pending').toList()),
            _buildBidsList(_allBids.where((b) => b['status'] == 'accepted').toList()),
          ],
        ),
      ),
    );
  }

  Widget _buildBidsList(List<dynamic> bids) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (bids.isEmpty) return const Center(child: Text('No bids found.'));

    return ListView.builder(
      padding: const EdgeInsets.all(24),
      itemCount: bids.length,
      itemBuilder: (context, index) {
        final bid = bids[index];
        final status = bid['status'] as String;
        return Container(
          margin: const EdgeInsets.only(bottom: 24),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFFF1F5F9)),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      bid['job_title'] ?? 'Unknown Job',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                    ),
                  ),
                  _buildStatusBadge(status),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                bid['cover_letter'] ?? 'No cover letter provide.',
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 13, height: 1.5),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  const Icon(Icons.access_time, size: 14, color: Color(0xFF94A3B8)),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      bid['estimated_time'] ?? 'N/A',
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 16),
                  const Text('Submitted ', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                  Text(
                    bid['created_at'] != null ? bid['created_at'].toString().split('T').first : 'Unknown',
                    style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Divider(color: Color(0xFFF1F5F9)),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Your Bid', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                      const SizedBox(height: 4),
                      Text(
                        '\$${bid['amount']}',
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF6366F1)),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text('Category', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                      const SizedBox(height: 4),
                      Text(
                        bid['category_name'] ?? 'N/A',
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color = const Color(0xFF94A3B8);
    IconData icon = Icons.access_time_filled;
    
    if (status == 'accepted') {
      color = const Color(0xFF10B981);
      icon = Icons.check_circle;
    } else if (status == 'pending') {
      color = const Color(0xFF6366F1);
      icon = Icons.access_time_filled;
    } else if (status == 'rejected') {
      color = const Color(0xFFEF4444);
      icon = Icons.cancel;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 6),
          Text(
            status,
            style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}
