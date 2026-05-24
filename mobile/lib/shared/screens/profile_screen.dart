import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../features/auth/auth_service.dart';
import '../../features/customer/job_service.dart';
import '../../features/provider/provider_service.dart';
import '../../shared/services/review_service.dart';
import '../../shared/widgets/review_card.dart';
import '../../core/api_client.dart';
import '../../core/services/location_service.dart';
import 'map_picker_screen.dart';
import '../../shared/widgets/notification_bell.dart';
import '../../shared/widgets/wallet_bottom_sheet.dart';

class ProfileScreen extends StatefulWidget {
  final bool initialEditMode;
  const ProfileScreen({super.key, this.initialEditMode = false});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isEditing = false;
  bool _isAvailable = true;

  // Controllers for both roles
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _bioController = TextEditingController();
  final _locationController = TextEditingController();
  final _experienceController = TextEditingController();
  final _skillController = TextEditingController();

  // Local state for editing flow
  XFile? _tempAvatarFile;
  Uint8List? _avatarBytes;
  List<String> _skills = [];
  int _experienceYears = 0;
  LatLng? _selectedLocationData;
  final LocationService _locationService = LocationService();
  bool _isLoading = false;
  Future<List<dynamic>>? _reviewsFuture;

  @override
  void initState() {
    super.initState();
    _isEditing = widget.initialEditMode;
    // Initially load if data is already there
    _loadInitialData();
  }

  Future<void> _loadInitialData({bool forceRefresh = false}) async {
    final authService = context.read<AuthService>();
    var user = authService.user;
    
    if (forceRefresh) {
      try {
        final response = await ApiClient().dio.get('/users/me');
        if (response.statusCode == 200) {
          user = response.data;
          // Optionally update AuthService locally if you want other screens to see it
          // But for the edit form, we just need the local copy
        }
      } catch (e) {
        print('Error refreshing profile: $e');
      }
    }
    
    final role = authService.role;
    
    if (mounted) {
      setState(() {
        _nameController.text = user?['full_name'] ?? '';
        _emailController.text = user?['email'] ?? '';
        _phoneController.text = user?['phone'] ?? '';
        _locationController.text = user?['location'] ?? '';
        if (user?['latitude'] != null && user?['longitude'] != null) {
          _selectedLocationData = LatLng(
            double.parse(user!['latitude'].toString()),
            double.parse(user!['longitude'].toString()),
          );
        }

        if (role == 'provider') {
          final profile = user?['profile'];
          _bioController.text = profile?['bio'] ?? '';
          _experienceYears = profile?['experience_years'] ?? 0;
          _experienceController.text = _experienceYears.toString();
          
          if (profile?['skills'] != null) {
            if (profile!['skills'] is String) {
              try {
                _skills = List<String>.from(profile['skills']);
              } catch (_) {
                _skills = [];
              }
            } else if (profile['skills'] is List) {
              _skills = List<String>.from(profile['skills']);
            }
          }
          context.read<ProviderService>().fetchDashboardStats();
          _reviewsFuture = context.read<ReviewService>().fetchProviderReviews(user!['id'], limit: 3);
        }
      });
    }
    
    // Debugging to find why phone/category is missing
    print('DEBUG: User Object: $user');
    print('DEBUG: Profile Object: ${user?['profile']}');
  }

  Future<void> _pickLocation() async {
    final LatLng? result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MapPickerScreen(initialLocation: _selectedLocationData),
      ),
    );

    if (result != null) {
      setState(() => _selectedLocationData = result);
      final address = await _locationService.getAddressFromLatLng(result.latitude, result.longitude);
      if (address != null) {
        _locationController.text = address;
      }
    }
  }

  Future<void> _useCurrentLocation() async {
    setState(() => _isLoading = true);
    try {
      final pos = await _locationService.getCurrentLocation();
      if (pos != null) {
        final latLng = LatLng(pos.latitude, pos.longitude);
        setState(() => _selectedLocationData = latLng);
        final address = await _locationService.getAddressFromLatLng(pos.latitude, pos.longitude);
        if (address != null) {
          _locationController.text = address;
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();
    final role = authService.role;
    final avatarPath = authService.user?['avatar'];
    final avatarUrl = ApiClient.getImageUrl(avatarPath);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FB),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF5F7FB),
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text('Profile', style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontWeight: FontWeight.bold)),
        actions: [
          const NotificationBell(color: Color(0xFF1E293B)),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildHeader(role, avatarUrl),
            if (_isEditing) 
              _buildEditForm(role) 
            else if (role == 'provider') 
              _buildProviderView(authService) 
            else 
              _buildCustomerView(authService),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(String? role, String? avatarUrl) {
    return Stack(
      alignment: Alignment.center,
      children: [
        Column(
          children: [
            Container(
              height: 140,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF003B95), Color(0xFF0A84FF)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
            ),
            const SizedBox(height: 60),
          ],
        ),
        Positioned(
          top: 80,
          child: GestureDetector(
            onTap: _isEditing ? () async {
              final picker = ImagePicker();
              try {
                final file = await picker.pickImage(source: ImageSource.gallery);
                if (file != null) {
                  final bytes = await file.readAsBytes();
                  setState(() {
                    _tempAvatarFile = file;
                    _avatarBytes = bytes;
                  });
                }
              } catch (e) {
                print('Error picking avatar: $e');
              }
            } : null,
            child: Stack(
              children: [
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 4),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, 4))],
                  ),
                  child: CircleAvatar(
                    radius: 50,
                    backgroundImage: _avatarBytes != null 
                      ? MemoryImage(_avatarBytes!)
                      : (avatarUrl != null 
                        ? NetworkImage(avatarUrl) as ImageProvider
                        : NetworkImage(role == 'provider' 
                          ? 'https://i.pravatar.cc/150?u=mike' 
                          : 'https://i.pravatar.cc/150?u=john')),
                    backgroundColor: const Color(0xFFF1F5F9),
                  ),
                ),
                if (_isEditing)
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF003B95),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                      ),
                      child: const Icon(Icons.edit_rounded, size: 14, color: Colors.white),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCustomerView(AuthService authService) {
    final user = authService.user;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          Text(user?['full_name'] ?? 'No Name', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
          const SizedBox(height: 8),
          Text(user?['email'] ?? 'No Email', style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontSize: 14)),
          const SizedBox(height: 24),
          _buildEditButton(),
          const SizedBox(height: 32),
          _buildCustomerStats(),
          const SizedBox(height: 32),
          _buildMenuCard([
            _buildMenuItem(Icons.account_balance_wallet_outlined, 'My Wallet Balance', () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) => WalletBottomSheet(userName: user?['full_name'] ?? 'User'),
              );
            }),
            _buildMenuItem(Icons.payment_outlined, 'Payment Methods', () {}),
            _buildMenuItem(Icons.notifications_none_rounded, 'Notifications', () => context.push('/notifications')),
            _buildMenuItem(Icons.settings_outlined, 'Settings', () {}),
            _buildMenuItem(Icons.help_outline_rounded, 'Help & Support', () {}),
          ]),
          const SizedBox(height: 32),
          _buildLogoutButton(authService),
        ],
      ),
    );
  }

  Widget _buildProviderView(AuthService authService) {
    final user = authService.user;
    final profile = user?['profile'];
    final categoryName = profile?['category_name'] ?? user?['category_name'] ?? 'Provider';
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          Text(user?['full_name'] ?? 'No Name', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(color: const Color(0xFF2ECC71), borderRadius: BorderRadius.circular(20)),
            child: Text(categoryName, style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
          ),
          const SizedBox(height: 32),
          _buildEditButton(),
          const SizedBox(height: 32),
          _buildProviderStats(),
          const SizedBox(height: 32),
          _buildMenuCard([
            _buildMenuItem(Icons.account_balance_wallet_outlined, 'My Wallet Console', () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) => WalletBottomSheet(userName: user?['full_name'] ?? 'Provider'),
              );
            }),
            _buildMenuItem(Icons.notifications_none_rounded, 'Notifications', () => context.push('/notifications')),
            _buildMenuItem(Icons.settings_outlined, 'Settings', () {}),
          ]),
          const SizedBox(height: 32),
          _buildProviderReviews(user?['id']),
          const SizedBox(height: 40),
          _buildLogoutButton(authService),
        ],
      ),
    );
  }

  Widget _buildEditForm(String? role) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildFieldLabel('Full Name'),
          _buildTextField(_nameController, 'Enter full name'),
          const SizedBox(height: 20),
          _buildFieldLabel('Email'),
          _buildTextField(_emailController, 'Enter email', keyboardType: TextInputType.emailAddress),
          const SizedBox(height: 20),
          _buildFieldLabel('Phone'),
          _buildTextField(_phoneController, 'Enter phone number', keyboardType: TextInputType.phone),
          const SizedBox(height: 20),
          _buildFieldLabel('Service Location'),
          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  _locationController, 
                  'Pick service location', 
                  readOnly: true,
                  onTap: _pickLocation,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF6366F1).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  icon: _isLoading 
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.my_location, color: Color(0xFF6366F1), size: 18),
                  onPressed: _useCurrentLocation,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (role == 'provider') ...[
            const SizedBox(height: 20),
            _buildFieldLabel('Years of Experience'),
            _buildTextField(
              _experienceController, 
              'Enter years', 
              keyboardType: TextInputType.number,
            ),
          ],
          const SizedBox(height: 48),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    _loadInitialData(); // Reset data
                    setState(() => _isEditing = false);
                  },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    side: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  child: const Text('Cancel', style: TextStyle(color: Color(0xFF64748B))),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: () async {
                    final authService = context.read<AuthService>();
                    
                    // 1. Upload Avatar if changed
                    if (_tempAvatarFile != null) {
                      await authService.updateAvatar(_tempAvatarFile!);
                    }

                    // 2. Prepare Profile Data
                    final Map<String, dynamic> data = {
                      'full_name': _nameController.text,
                      'phone': _phoneController.text,
                      'location': _locationController.text,
                      'latitude': _selectedLocationData?.latitude,
                      'longitude': _selectedLocationData?.longitude,
                    };

                    debugPrint('DEBUG: Saving Profile Data: $data');
                    
                    if (role == 'provider') {
                      data['bio'] = _bioController.text;
                      data['experience_years'] = int.tryParse(_experienceController.text) ?? 0;
                      data['skills'] = _skills;
                    }

                    // 3. Update Profile
                    final success = await authService.updateProfile(data);
                    if (success) {
                      setState(() {
                        _isEditing = false;
                        _tempAvatarFile = null;
                        _avatarBytes = null;
                      });
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated successfully!')));
                      
                      // Explicitly refresh both user and stats
                      if (role == 'provider') {
                        context.read<ProviderService>().fetchDashboardStats();
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6366F1),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: const Text('Save Changes'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEditButton() {
    return OutlinedButton.icon(
      onPressed: () async {
        // Force refresh from server before showing edit form
        await _loadInitialData(forceRefresh: true);
        if (mounted) {
          setState(() => _isEditing = true);
        }
      },
      icon: const Icon(Icons.edit_outlined, size: 18),
      label: const Text('Edit Profile'),
      style: OutlinedButton.styleFrom(
        foregroundColor: const Color(0xFF1E293B),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
        minimumSize: const Size(double.infinity, 56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }

  Widget _buildCustomerStats() {
    return Consumer<JobService>(
      builder: (context, jobService, _) {
        final jobs = jobService.jobs;
        final total = jobs.length;
        final completed = jobs.where((j) => (j['status'] as String?)?.toLowerCase() == 'completed').length;
        return Row(
          children: [
            Expanded(child: _buildStatCard(Icons.work_outline, total.toString(), 'Total Jobs', const Color(0xFF6366F1))),
            const SizedBox(width: 12),
            Expanded(child: _buildStatCard(Icons.check_circle_outline, completed.toString(), 'Completed', const Color(0xFF10B981))),
          ],
        );
      },
    );
  }

  Widget _buildProviderStats() {
    return Consumer2<ProviderService, JobService>(
      builder: (context, service, jobService, _) {
        final stats = service.dashboardStats;
        final allBids = jobService.providerBids;
        final completedJobsCount = allBids.where((b) {
          if (b['status'] != 'accepted') return false;
          final js = (b['job_status'] ?? '').toString().toLowerCase();
          return js == 'completed';
        }).length;

        return Row(
          children: [
            Expanded(child: _buildStatCard(Icons.work_outline, completedJobsCount.toString(), 'Jobs Done', const Color(0xFF6366F1))),
            const SizedBox(width: 12),
            Expanded(child: _buildStatCard(Icons.stars_outlined, (stats?['rating'] ?? '5.0').toString(), 'Rating', const Color(0xFF10B981))),
            const SizedBox(width: 12),
            Expanded(child: _buildStatCard(Icons.access_time, stats?['experience_years']?.toString() ?? '0', 'Years Exp.', const Color(0xFFF59E0B))),
          ],
        );
      },
    );
  }

  Widget _buildStatCard(IconData icon, String value, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 16),
          Text(
            value,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildProviderReviews(int? providerId) {
    if (providerId == null) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'My Reviews',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
            ),
            TextButton(
              onPressed: () => context.push('/provider-reviews/$providerId'),
              child: const Text('View All', style: TextStyle(color: Color(0xFF6366F1))),
            ),
          ],
        ),
        const SizedBox(height: 8),
        FutureBuilder<List<dynamic>>(
          future: _reviewsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError || !snapshot.hasData || snapshot.data!.isEmpty) {
              return Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Center(
                  child: Text(
                    'No reviews yet',
                    style: TextStyle(color: Color(0xFF94A3B8)),
                  ),
                ),
              );
            }

            final reviews = snapshot.data!;
            return Column(
              children: reviews.map((review) => ReviewCard(review: review)).toList(),
            );
          },
        ),
      ],
    );
  }

  Widget _buildLogoutButton(AuthService authService) {
    return Column(
      children: [
        ElevatedButton.icon(
          onPressed: () => authService.logout(),
          icon: const Icon(Icons.logout, size: 18),
          label: const Text('Logout'),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFEF4444),
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 56),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: 0,
          ),
        ),
        const SizedBox(height: 16),
        const Text('Version 1.0.0', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
      ],
    );
  }

  Widget _buildMenuCard(List<Widget> items) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(children: items),
    );
  }

  Widget _buildMenuItem(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12)),
        child: Icon(icon, color: const Color(0xFF1E293B), size: 20),
      ),
      title: Text(title, style: const TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.w600, fontSize: 16)),
      trailing: const Icon(Icons.chevron_right, size: 20, color: Color(0xFF94A3B8)),
      onTap: onTap,
    );
  }

  Widget _buildFieldLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(label, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF334155), fontSize: 14)),
    );
  }

  Widget _buildTextField(TextEditingController controller, String hint, {int maxLines = 1, TextInputType keyboardType = TextInputType.text, bool readOnly = false, VoidCallback? onTap, Function(String)? onChanged}) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      readOnly: readOnly,
      onTap: onTap,
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
        filled: true,
        fillColor: const Color(0xFFF8FAFC),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
        contentPadding: const EdgeInsets.all(16),
      ),
    );
  }

  Widget _buildAvailabilityCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(24)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text('Availability Status', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
          Switch(
            value: _isAvailable,
            onChanged: (v) => setState(() => _isAvailable = v),
            activeColor: const Color(0xFF6366F1),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(String title, Widget content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
          ],
        ),
        const SizedBox(height: 16),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: const Color(0xFFF1F5F9))),
          child: content,
        ),
      ],
    );
  }

  Widget _buildExperienceContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Years of Experience', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
        const SizedBox(height: 8),
        Text('$_experienceYears years', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
        const SizedBox(height: 24),
        const Text('Specialized Skills', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
        const SizedBox(height: 12),
        if (_skills.isEmpty)
          const Text('No skills listed', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13, fontStyle: FontStyle.italic))
        else
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _skills.map((skill) => _buildSkillTag(skill)).toList(),
          ),
      ],
    );
  }

  Widget _buildSkillTag(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: const Color(0xFF10B981), borderRadius: BorderRadius.circular(12)),
      child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }
}
