import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../features/provider/provider_service.dart';
import '../../core/api_client.dart';

class CustomerProfileScreen extends StatefulWidget {
  final int customerId;
  const CustomerProfileScreen({super.key, required this.customerId});

  @override
  State<CustomerProfileScreen> createState() => _CustomerProfileScreenState();
}

class _CustomerProfileScreenState extends State<CustomerProfileScreen> {
  Map<String, dynamic>? _customer;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCustomer();
  }

  Future<void> _loadCustomer() async {
    print('DEBUG: Loading customer details for ID: ${widget.customerId}');
    setState(() => _isLoading = true);
    try {
      final customer = await context.read<ProviderService>().getUserById(widget.customerId);
      print('DEBUG: Customer data received: ${customer != null ? 'YES' : 'NULL'}');
      if (mounted) {
        setState(() {
          _customer = customer;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('DEBUG: Error loading customer: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_customer == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Profile')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Customer not found (ID: ${widget.customerId})'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadCustomer,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    final avatarUrl = ApiClient.getImageUrl(_customer!['avatar']);
    final initials = _customer!['full_name']?.isNotEmpty == true ? _customer!['full_name'][0].toUpperCase() : '?';
    final joinedDate = _customer!['created_at'] != null 
        ? _customer!['created_at'].toString().split('T').first 
        : 'Unknown';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(avatarUrl, initials),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildProfileHeader(),
                  const SizedBox(height: 32),
                  _buildSectionTitle('Client Information'),
                  const SizedBox(height: 16),
                  _buildInfoCard(),
                  const SizedBox(height: 32),
                  _buildSectionTitle('Statistics'),
                  const SizedBox(height: 16),
                  _buildStatsGrid(),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSliverAppBar(String? avatarUrl, String initials) {
    return SliverAppBar(
      expandedHeight: 200,
      pinned: true,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.white),
        onPressed: () => Navigator.pop(context),
      ),
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF10B981)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Center(
            child: Container(
              margin: const EdgeInsets.only(top: 40),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 4),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 10,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: CircleAvatar(
                radius: 50,
                backgroundColor: const Color(0xFFF1F5F9),
                backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                child: avatarUrl == null 
                    ? Text(initials, style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF6366F1)))
                    : null,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProfileHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _customer!['full_name'] ?? 'Unknown Client',
          style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            const Icon(Icons.verified, color: Color(0xFF10B981), size: 20),
            const SizedBox(width: 8),
            const Text(
              'Verified Client',
              style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.w600),
            ),
            const SizedBox(width: 16),
            const Icon(Icons.location_on, color: Color(0xFF94A3B8), size: 18),
            const SizedBox(width: 4),
            Text(
              _customer!['location'] ?? 'Location not set',
              style: const TextStyle(color: Color(0xFF64748B)),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        children: [
          _buildInfoRow(Icons.email_outlined, 'Email', _customer!['email'] ?? 'Not provided'),
          const Divider(height: 32, color: Color(0xFFF1F5F9)),
          _buildInfoRow(Icons.phone_outlined, 'Phone', _customer!['phone'] ?? 'Not provided'),
          const Divider(height: 32, color: Color(0xFFF1F5F9)),
          _buildInfoRow(Icons.calendar_today_outlined, 'Joined Since', 
              _customer!['created_at']?.toString().split('T').first ?? 'Unknown'),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: const Color(0xFF6366F1), size: 20),
        ),
        const SizedBox(width: 16),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
            const SizedBox(height: 2),
            Text(value, style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF1E293B))),
          ],
        ),
      ],
    );
  }

  Widget _buildStatsGrid() {
    return Row(
      children: [
        Expanded(child: _buildStatCard('Jobs Posted', '5', Icons.post_add, const Color(0xFF6366F1))),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('Hired Rate', '100%', Icons.handshake_outlined, const Color(0xFF10B981))),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 12),
          Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
        ],
      ),
    );
  }
}
