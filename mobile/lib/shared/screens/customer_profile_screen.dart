import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../features/provider/provider_service.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';

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
    final colors = Theme.of(context).appColors;
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
      backgroundColor: colors.background,
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
                backgroundColor: Theme.of(context).appColors.card,
                backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                child: avatarUrl == null 
                    ? Text(initials, style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Theme.of(context).appColors.text))
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
          style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Theme.of(context).appColors.text),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            const Icon(Icons.verified, color: Color(0xFF10B981), size: 20),
            const SizedBox(width: 8),
            const Text(
              'Verified',
              style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.w600),
            ),
            const SizedBox(width: 16),
            Icon(Icons.location_on, color: Theme.of(context).appColors.subtext, size: 18),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                _customer!['location'] ?? 'Location not set',
                style: TextStyle(color: Theme.of(context).appColors.subtext),
                overflow: TextOverflow.ellipsis,
                maxLines: 1,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Theme.of(context).appColors.text),
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).appColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Theme.of(context).appColors.border),
      ),
      child: Column(
        children: [
          _buildInfoRow(Icons.email_outlined, 'Email', _customer!['email'] ?? 'Not provided'),
          Divider(height: 32, color: Theme.of(context).appColors.border),
          _buildInfoRow(Icons.phone_outlined, 'Phone', _customer!['phone'] ?? 'Not provided'),
          Divider(height: 32, color: Theme.of(context).appColors.border),
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
              color: Theme.of(context).appColors.card,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: const Color(0xFF6366F1), size: 20),
        ),
        const SizedBox(width: 16),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(color: Theme.of(context).appColors.subtext, fontSize: 12)),
            const SizedBox(height: 2),
            Text(value, style: TextStyle(fontWeight: FontWeight.w600, color: Theme.of(context).appColors.text)),
          ],
        ),
      ],
    );
  }
}
