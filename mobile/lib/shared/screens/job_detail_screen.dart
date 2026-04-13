import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../features/customer/job_service.dart';
import '../../features/auth/auth_service.dart';
import '../../../core/api_client.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class JobDetailScreen extends StatefulWidget {
  final int jobId;
  const JobDetailScreen({super.key, required this.jobId});

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  Map<String, dynamic>? _job;
  List<dynamic> _bids = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final jobService = context.read<JobService>();
    final job = await jobService.getJobById(widget.jobId);
    final bids = await jobService.fetchJobBids(widget.jobId);
    if (mounted) {
      setState(() {
        _job = job;
        _bids = bids;
        _isLoading = false;
      });
      print('DEBUG: Loaded Job Details. Customer Avatar: ${_job?['customer_avatar']}');
    }
  }
  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();
    final role = authService.role;
    final userId = authService.user?['id'];

    if (role == 'provider') {
      return _buildProviderView(userId);
    }

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Color(0xFF1E293B)),
            onPressed: () => Navigator.pop(context),
          ),
          title: const Text(
            'Job Details',
            style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold, fontSize: 18),
          ),
          actions: [
            Stack(
              children: [
                IconButton(
                  icon: const Icon(Icons.notifications_none, color: Color(0xFF1E293B)),
                  onPressed: () {},
                ),
                Positioned(
                  right: 12,
                  top: 12,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(color: Color(0xFFEF4444), shape: BoxShape.circle),
                  ),
                ),
              ],
            ),
          ],
          bottom: TabBar(
            indicatorColor: const Color(0xFF6366F1),
            indicatorWeight: 3,
            labelColor: const Color(0xFF6366F1),
            unselectedLabelColor: const Color(0xFF64748B),
            labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            tabs: [
              const Tab(text: 'Details'),
              Tab(text: 'Bids (${_bids.length})'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildDetailsTab(role),
            _buildBidsTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildProviderView(dynamic currentUserId) {
    // Check if current provider has already placed a bid
    final bool hasAlreadyBidded = _bids.any((bid) => bid['provider_id'] == currentUserId);
    final String jobStatus = (_job?['status'] ?? 'open').toLowerCase();
    final bool isJobOpen = jobStatus == 'open';

    String buttonText = 'Place Your Bid';
    Color buttonColor = const Color(0xFF6366F1);
    bool isButtonEnabled = true;

    if (hasAlreadyBidded) {
      buttonText = 'Already Bidded';
      buttonColor = const Color(0xFF94A3B8);
      isButtonEnabled = false;
    } else if (!isJobOpen) {
      buttonText = 'Job No Longer Open';
      buttonColor = const Color(0xFF94A3B8);
      isButtonEnabled = false;
    }
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1E293B)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Job Details',
          style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_none, color: Color(0xFF1E293B)),
                onPressed: () {},
              ),
              Positioned(
                right: 12,
                top: 12,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(color: Color(0xFFEF4444), shape: BoxShape.circle),
                ),
              ),
            ],
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          _job?['title'] ?? 'No Title',
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF6366F1).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          (_job?['status'] ?? 'OPEN').toUpperCase(),
                          style: const TextStyle(color: Color(0xFF6366F1), fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      (_job?['category_name'] ?? 'General').toUpperCase(),
                      style: const TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Icon(Icons.access_time, size: 16, color: Color(0xFF94A3B8)),
                      const SizedBox(width: 8),
                      Text(
                        'Posted ${_job?['created_at']?.toString().split('T').first ?? 'Unknown'}',
                        style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  const Divider(color: Color(0xFFF1F5F9)),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(32),
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F7FF),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Client Budget', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                        const SizedBox(height: 8),
                        Text(
                          '\$${_job?['budget'] ?? '0'}',
                          style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF6366F1)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(child: _buildSimpleStat(Icons.location_on_outlined, 'Location', _job?['location'] ?? 'Not specified')),
                      Expanded(child: _buildSimpleStat(Icons.people_outline, 'Total Bids', '${_bids.length} bids')),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            if (_job?['latitude'] != null && _job?['longitude'] != null)
              _buildProviderDetailSection('Job Location', _buildMapCard(
                double.parse(_job!['latitude'].toString()),
                double.parse(_job!['longitude'].toString()),
              )),
            const SizedBox(height: 24),
            _buildProviderDetailSection('Job Description', Container(
              padding: const EdgeInsets.all(24),
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Text(
                _job?['description'] ?? 'No description provided.',
                style: const TextStyle(color: Color(0xFF64748B), height: 1.6, fontSize: 14),
              ),
            )),
            const SizedBox(height: 24),
            _buildProviderDetailSection('Attached Images', _buildImageGallery(_job?['images'])),
            const SizedBox(height: 24),
            _buildProviderDetailSection('Client Information', _buildClientInfoCard()),
            const SizedBox(height: 24),
            _buildProviderDetailSection('Bidding Competition', _buildCompetitionCard()),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: isButtonEnabled ? () => context.push('/place-bid/${widget.jobId}') : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: isButtonEnabled ? buttonColor : const Color(0xFFE2E8F0),
                  foregroundColor: isButtonEnabled ? Colors.white : const Color(0xFF94A3B8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: Text(buttonText, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('Save for Later', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
              ),
            ),
            const SizedBox(height: 24),
            _buildBiddingTips(),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }

  Widget _buildProviderDetailSection(String title, Widget content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
        const SizedBox(height: 16),
        content,
      ],
    );
  }

  Widget _buildClientInfoCard() {
    final avatarUrl = ApiClient.getImageUrl(_job?['customer_avatar']);
    final customerName = _job?['customer_name'] ?? 'Unknown User';
    final initials = customerName.isNotEmpty ? customerName[0].toUpperCase() : '?';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: const Color(0xFF6366F1).withOpacity(0.1),
            backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
            child: avatarUrl == null 
                ? Text(initials, style: const TextStyle(color: Color(0xFF6366F1), fontWeight: FontWeight.bold, fontSize: 20)) 
                : null,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(customerName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF1E293B))),
                const SizedBox(height: 4),
                const Text('Verified Client', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: () {},
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFFE2E8F0)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('View Profile', style: TextStyle(color: Color(0xFF1E293B), fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildCompetitionCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        children: [
          _buildCompetitionRow('Total Bids', '${_bids.length}'),
          const SizedBox(height: 16),
          _buildCompetitionRow('Your Status', (_job?['status'] ?? 'Open').toUpperCase(), valueColor: const Color(0xFF10B981)),
          const SizedBox(height: 16),
          _buildCompetitionRow('Category', _job?['category_name'] ?? 'N/A'),
        ],
      ),
    );
  }

  Widget _buildCompetitionRow(String label, String value, {Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14)),
        Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: valueColor ?? const Color(0xFF1E293B))),
      ],
    );
  }

  Widget _buildBiddingTips() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFFEEF2FF),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.lightbulb_outline, color: Color(0xFF6366F1), size: 24),
              SizedBox(width: 12),
              Text('Bidding Tips', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
            ],
          ),
          const SizedBox(height: 16),
          _buildTipItem('Research the job requirements carefully'),
          _buildTipItem('Bid competitively but fairly'),
          _buildTipItem('Highlight your relevant experience'),
          _buildTipItem('Respond promptly to client questions'),
        ],
      ),
    );
  }

  Widget _buildTipItem(String tip) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(color: Color(0xFF6366F1), fontWeight: FontWeight.bold)),
          Expanded(child: Text(tip, style: const TextStyle(color: Color(0xFF64748B), fontSize: 13))),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
    );
  }

  Widget _buildSimpleStat(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 20, color: const Color(0xFF6366F1)),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1E293B)),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDetailsTab(String? role) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_job == null) return const Center(child: Text('Job not found'));

    final title = _job!['title'] ?? 'No Title';
    final category = _job!['category_name'] ?? 'General';
    final status = _job!['status'] ?? 'open';
    final description = _job!['description'] ?? 'No description provided.';
    final budget = _job!['budget']?.toString() ?? '0';
    final location = _job!['location'] ?? 'Not specified';
    final createdAt = _job!['created_at'] != null 
        ? _job!['created_at'].toString().split('T').first 
        : 'Unknown';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildJobMainCard(title, category, status),
          const SizedBox(height: 24),
          _buildInfoSection('Description', description),
          const SizedBox(height: 24),
          _buildStatsGrid(budget, location, createdAt, _bids.length),
          const SizedBox(height: 24),
          if (_job!['latitude'] != null && _job!['longitude'] != null)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildInfoSectionTitle('Job Location'),
                const SizedBox(height: 16),
                _buildMapCard(
                  double.parse(_job!['latitude'].toString()),
                  double.parse(_job!['longitude'].toString()),
                ),
                const SizedBox(height: 24),
              ],
            ),
          _buildInfoSectionTitle('Images'),
          const SizedBox(height: 16),
          _buildImageGallery(_job!['images']),
          const SizedBox(height: 24),
          _buildInfoSectionTitle('Customer Information'),
          const SizedBox(height: 16),
          _buildCustomerCard(_job!['customer_name'], createdAt),
          const SizedBox(height: 32),
          if (role == 'provider')
            ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1)),
              child: const Text('Place Your Bid'),
            ),
        ],
      ),
    );
  }

  Widget _buildJobMainCard(String title, String category, String status) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF6366F1).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  status.toUpperCase(),
                  style: const TextStyle(color: Color(0xFF6366F1), fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              category,
              style: const TextStyle(color: Color(0xFF10B981), fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 20),
          const Divider(color: Color(0xFFF1F5F9)),
        ],
      ),
    );
  }

  Widget _buildInfoSection(String title, String content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInfoSectionTitle(title),
        const SizedBox(height: 12),
        Text(
          content,
          style: const TextStyle(color: Color(0xFF64748B), height: 1.6, fontSize: 14),
        ),
      ],
    );
  }

  Widget _buildInfoSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
    );
  }

  Widget _buildStatsGrid(String budget, String location, String date, int bidsCount) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 2.2,
      children: [
        _buildStatItem(Icons.attach_money, 'Budget', '\$$budget'),
        _buildStatItem(Icons.location_on_outlined, 'Location', location),
        _buildStatItem(Icons.calendar_today_outlined, 'Posted', date),
        _buildStatItem(Icons.people_outline, 'Bids', '$bidsCount received'),
      ],
    );
  }

  Widget _buildStatItem(IconData icon, String label, String value) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, size: 20, color: const Color(0xFF6366F1)),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
              Text(
                value,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1E293B)),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildImageGallery(List<dynamic>? images) {
    if (images == null || images.isEmpty) {
      return Container(
        height: 120,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFF1F5F9)),
        ),
        child: const Text('No images provided.', style: TextStyle(color: Color(0xFF94A3B8))),
      );
    }

    return Container(
      height: 120,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      padding: const EdgeInsets.all(16),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: images.length,
        itemBuilder: (context, index) {
          final imageUrl = ApiClient.getImageUrl(images[index]);
          return Container(
            width: 140,
            margin: const EdgeInsets.only(right: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              image: DecorationImage(
                image: imageUrl != null 
                    ? NetworkImage(imageUrl) 
                    : const NetworkImage('https://i.ibb.co/vzR0y6M/sink.jpg'),
                fit: BoxFit.cover,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCustomerCard(String? name, String date) {
    final avatarUrl = ApiClient.getImageUrl(_job?['customer_avatar']);
    final initials = name != null && name.isNotEmpty ? name[0].toUpperCase() : '?';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: const Color(0xFF6366F1).withOpacity(0.1),
            backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
            child: avatarUrl == null 
                ? Text(initials, style: const TextStyle(color: Color(0xFF6366F1), fontWeight: FontWeight.bold)) 
                : null,
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name ?? 'Unknown',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1E293B)),
              ),
              const SizedBox(height: 4),
              Text(
                'Job posted on $date',
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBidsTab() {
    if (_bids.isEmpty) {
      return const Center(child: Text('No bids yet.'));
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          ..._bids.map((bid) => _buildBidItem(
                id: bid['id'],
                name: bid['provider_name'] ?? 'Unknown Provider',
                rating: double.tryParse(bid['provider_rating']?.toString() ?? '0.0') ?? 0.0,
                reviews: 0, // Mock for now
                proposal: bid['cover_letter'] ?? 'No cover letter provided.',
                price: double.tryParse(bid['amount']?.toString() ?? '0.0') ?? 0.0,
                time: bid['estimated_time'] ?? 'N/A',
                avatar: bid['provider_avatar'],
                status: bid['status'],
              )).toList(),
        ],
      ),
    );
  }

  Widget _buildBidItem({
    required int id,
    required String name,
    required double rating,
    required int reviews,
    required String proposal,
    required double price,
    required String time,
    String? avatar,
    required String status,
  }) {
    final avatarUrl = ApiClient.getImageUrl(avatar);
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundImage: avatarUrl != null 
                  ? NetworkImage(avatarUrl)
                  : const NetworkImage('https://i.pravatar.cc/150?u=provider'),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  Row(
                    children: [
                      const Icon(Icons.star, color: Color(0xFFF59E0B), size: 14),
                      const SizedBox(width: 4),
                      Text(rating.toString(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      Text(' ($reviews reviews)', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                    ],
                  ),
                ],
              ),
              const Spacer(),
              if (status != 'pending')
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: status == 'accepted' ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    status.toUpperCase(),
                    style: TextStyle(color: status == 'accepted' ? Colors.green : Colors.red, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Text(proposal, style: const TextStyle(color: Color(0xFF475569), fontSize: 14, height: 1.5)),
          const SizedBox(height: 16),
          const Divider(color: Color(0xFFF1F5F9)),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('\$$price', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF6366F1))),
                  Text('Est. $time', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                ],
              ),
              if (status == 'pending' && context.read<AuthService>().role == 'customer')
                ElevatedButton.icon(
                  onPressed: () async {
                    final success = await context.read<JobService>().acceptBid(id);
                    if (success) {
                      _loadData();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Bid accepted successfully!')),
                      );
                    }
                  },
                  icon: const Icon(Icons.check_circle_outline, size: 16),
                  label: const Text('Accept Bid'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6366F1),
                    minimumSize: const Size(120, 48),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMapCard(double lat, double lng) {
    return Container(
      height: 200,
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: GoogleMap(
          initialCameraPosition: CameraPosition(
            target: LatLng(lat, lng),
            zoom: 15,
          ),
          markers: {
            Marker(
              markerId: const MarkerId('jobLocation'),
              position: LatLng(lat, lng),
            ),
          },
          liteModeEnabled: true, // Optimized for detail screens
          myLocationButtonEnabled: false,
          zoomControlsEnabled: false,
          scrollGesturesEnabled: false,
        ),
      ),
    );
  }
}
