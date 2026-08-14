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
import '../../core/providers/language_provider.dart';
import '../../shared/widgets/notification_bell.dart';
import '../../core/providers/theme_provider.dart';
import '../../core/theme.dart';

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
    final colors = Theme.of(context).appColors;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final lang = context.watch<LanguageProvider>();

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.background,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text(lang.t('profile.title'), style: GoogleFonts.outfit(color: colors.text, fontWeight: FontWeight.bold)),
        actions: [
          NotificationBell(color: colors.text),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildHeader(role, avatarUrl, isDark),
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

  Widget _buildHeader(String? role, String? avatarUrl, bool isDark) {
    final colors = Theme.of(context).appColors;
    final gradientColors = isDark
        ? const [Color(0xFF111827), Color(0xFF1F2937)]
        : const [Color(0xFF003B95), Color(0xFF0A84FF)];

    return Stack(
      alignment: Alignment.center,
      children: [
        Column(
          children: [
            Container(
              height: 140,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: gradientColors,
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
                    boxShadow: [BoxShadow(color: Theme.of(context).appColors.text.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, 4))],
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
                    backgroundColor: Theme.of(context).appColors.card,
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
    final colors = Theme.of(context).appColors;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          Text(user?['full_name'] ?? 'No Name', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: colors.text)),
          const SizedBox(height: 8),
          Text(user?['email'] ?? 'No Email', style: GoogleFonts.outfit(color: colors.subtext, fontSize: 14)),
          const SizedBox(height: 24),
          _buildEditButton(),
          const SizedBox(height: 32),
          _buildCustomerStats(),
          const SizedBox(height: 32),
          _buildMenuCard([
            _buildMenuItem(Icons.psychology_outlined, context.read<LanguageProvider>().t('profile.aiSupport'), () => context.push('/support-chatbot')),
            _buildMenuItem(Icons.settings_outlined, context.read<LanguageProvider>().t('profile.settings'), () => context.push('/settings')),
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
    final colors = Theme.of(context).appColors;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          Text(user?['full_name'] ?? 'No Name', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: colors.text)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(color: const Color(0xFF2ECC71), borderRadius: BorderRadius.circular(20)),
            child: Text(categoryName, style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
          ),
          const SizedBox(height: 32),
          _buildEditButton(),
          const SizedBox(height: 16),
          _buildOnlineOfflineToggleCard(),
          const SizedBox(height: 32),
          _buildProviderStats(),
          const SizedBox(height: 32),
          _buildMenuCard([
            _buildMenuItem(Icons.psychology_outlined, context.read<LanguageProvider>().t('profile.aiSupport'), () => context.push('/support-chatbot')),
            _buildMenuItem(Icons.settings_outlined, context.read<LanguageProvider>().t('profile.settings'), () => context.push('/settings')),
          ]),
          const SizedBox(height: 32),
          _buildProviderReviews(user?['id']),
          const SizedBox(height: 32),
          _buildLogoutButton(authService),
        ],
      ),
    );
  }

  Widget _buildOnlineOfflineToggleCard() {
    final colors = Theme.of(context).appColors;
    return Consumer<ProviderService>(
      builder: (context, providerService, child) {
        final isOnline = providerService.isOnline;
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: colors.border),
            boxShadow: [
              BoxShadow(
                color: colors.text.withOpacity(isOnline ? 0.06 : 0.02),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isOnline
                      ? const Color(0xFF10B981).withOpacity(0.1)
                      : colors.border.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isOnline ? Icons.wifi_rounded : Icons.wifi_off_rounded,
                  color: isOnline ? const Color(0xFF10B981) : colors.text,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isOnline ? 'Online Availability' : 'Offline Mode',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.bold,
                        color: colors.text,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isOnline
                          ? 'You are active & receiving jobs'
                          : 'Tap to switch back online',
                      style: GoogleFonts.outfit(
                        color: colors.subtext,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Switch.adaptive(
                value: isOnline,
                activeColor: const Color(0xFF10B981),
                activeTrackColor: const Color(0xFF10B981).withOpacity(0.3),
                inactiveThumbColor: colors.subtext,
                inactiveTrackColor: colors.border.withOpacity(0.2),
                onChanged: (value) async {
                  setState(() => _isLoading = true);
                  final success = await providerService.toggleOnlineStatus(value);
                  if (mounted) {
                    setState(() => _isLoading = false);
                    if (!success) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Failed to update availability status')),
                      );
                    }
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildEditForm(String? role) {
    final colors = Theme.of(context).appColors;
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
                    side: BorderSide(color: colors.border),
                  ),
                  child: Text('Cancel', style: TextStyle(color: colors.subtext)),
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
    final colors = Theme.of(context).appColors;
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
        foregroundColor: colors.text,
        side: BorderSide(color: colors.border),
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
    final colors = Theme.of(context).appColors;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.border),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 16),
          Text(
            value,
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: colors.text),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(color: colors.subtext, fontSize: 11),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildProviderReviews(int? providerId) {
    if (providerId == null) return const SizedBox.shrink();
    final colors = Theme.of(context).appColors;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'My Reviews',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: colors.text),
            ),
            TextButton(
              onPressed: () => context.push('/provider-reviews/$providerId'),
              child: Text('View All', style: TextStyle(color: AppTheme.primaryColor)),
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
                  color: colors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: colors.border),
                ),
                child: Center(
                  child: Text(
                    'No reviews yet',
                    style: TextStyle(color: colors.subtext),
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
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () => _showDeleteAccountDialog(authService),
          icon: const Icon(Icons.delete_forever_rounded, size: 18),
          label: const Text('Delete Account'),
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFFEF4444),
            side: const BorderSide(color: Color(0xFFEF4444)),
            minimumSize: const Size(double.infinity, 56),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
        ),
        const SizedBox(height: 16),
        Text('Version 1.0.0', style: TextStyle(color: Theme.of(context).appColors.subtext, fontSize: 12)),
      ],
    );
  }

  void _showDeleteAccountDialog(AuthService authService) {
    final confirmController = TextEditingController();
    final colors = Theme.of(context).appColors;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setDialogState) {
            bool isDeleting = false;
            final canDelete = confirmController.text == 'DELETE';

            return AlertDialog(
              backgroundColor: colors.surface,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.delete_forever_rounded, color: Color(0xFFEF4444), size: 22),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Delete Account',
                    style: GoogleFonts.outfit(
                      color: colors.text,
                      fontWeight: FontWeight.bold,
                      fontSize: 17,
                    ),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'This will permanently delete your account and all associated data — jobs, bookings, messages, and reviews.',
                    style: GoogleFonts.outfit(color: colors.subtext, fontSize: 13, height: 1.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Type DELETE to confirm:',
                    style: GoogleFonts.outfit(
                      color: colors.text,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: confirmController,
                    onChanged: (_) => setDialogState(() {}),
                    style: GoogleFonts.outfit(color: colors.text, fontWeight: FontWeight.bold, letterSpacing: 1),
                    decoration: InputDecoration(
                      hintText: 'DELETE',
                      hintStyle: TextStyle(color: colors.subtext),
                      filled: true,
                      fillColor: colors.card,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: Text('Cancel', style: GoogleFonts.outfit(color: colors.subtext)),
                ),
                StatefulBuilder(
                  builder: (ctx2, setBtn) {
                    return ElevatedButton(
                      onPressed: confirmController.text == 'DELETE' && !isDeleting
                          ? () async {
                              setBtn(() => isDeleting = true);
                              final result = await authService.deleteAccount();
                              if (!result['success'] && ctx.mounted) {
                                Navigator.of(ctx).pop();
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text(result['message'] ?? 'Failed to delete account.')),
                                );
                              }
                            }
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEF4444),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: isDeleting
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : Text('Delete', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                    );
                  },
                ),
              ],
            );
          },
        );
      },
    ).then((_) => confirmController.dispose());
  }

  Widget _buildMenuCard(List<Widget> items) {
    final colors = Theme.of(context).appColors;
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: colors.border),
      ),
      child: Column(children: items),
    );
  }

  Widget _buildDarkModeMenuItem() {
    final themeProvider = context.watch<ThemeProvider>();
    final colors = Theme.of(context).appColors;
    final isDark = themeProvider.isDarkMode;
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: colors.card, borderRadius: BorderRadius.circular(12)),
        child: Icon(
          isDark ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
          color: isDark ? const Color(0xFF818CF8) : const Color(0xFFF59E0B),
          size: 20,
        ),
      ),
      title: Text(
        'Dark Mode',
        style: TextStyle(color: colors.text, fontWeight: FontWeight.w600, fontSize: 16),
      ),
      trailing: Switch.adaptive(
        value: isDark,
        activeColor: AppTheme.primaryColor,
        onChanged: (val) => themeProvider.toggleTheme(val),
      ),
    );
  }

  Widget _buildMenuItem(IconData icon, String title, VoidCallback onTap) {
    final colors = Theme.of(context).appColors;
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: colors.card, borderRadius: BorderRadius.circular(12)),
        child: Icon(icon, color: colors.text, size: 20),
      ),
      title: Text(title, style: TextStyle(color: colors.text, fontWeight: FontWeight.w600, fontSize: 16)),
      trailing: Icon(Icons.chevron_right, size: 20, color: colors.subtext),
      onTap: onTap,
    );
  }

  Widget _buildFieldLabel(String label) {
    final colors = Theme.of(context).appColors;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(label, style: TextStyle(fontWeight: FontWeight.bold, color: colors.text, fontSize: 14)),
    );
  }

  Widget _buildTextField(TextEditingController controller, String hint, {int maxLines = 1, TextInputType keyboardType = TextInputType.text, bool readOnly = false, VoidCallback? onTap, Function(String)? onChanged}) {
    final colors = Theme.of(context).appColors;
    return TextField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      readOnly: readOnly,
      onTap: onTap,
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: colors.subtext, fontSize: 14),
        filled: true,
        fillColor: colors.card,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
        contentPadding: const EdgeInsets.all(16),
      ),
    );
  }

  Widget _buildAvailabilityCard() {
    final colors = Theme.of(context).appColors;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(24), border: Border.all(color: colors.border)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text('Availability Status', style: TextStyle(fontWeight: FontWeight.bold, color: colors.text)),
          Switch(
            value: _isAvailable,
            onChanged: (v) => setState(() => _isAvailable = v),
            activeColor: AppTheme.primaryColor,
          ),
        ],
      ),
    );
  }

  Widget _buildSection(String title, Widget content) {
    final colors = Theme.of(context).appColors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: colors.text)),
          ],
        ),
        const SizedBox(height: 16),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: colors.surface, borderRadius: BorderRadius.circular(24), border: Border.all(color: colors.border)),
          child: content,
        ),
      ],
    );
  }

  Widget _buildExperienceContent() {
    final colors = Theme.of(context).appColors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Years of Experience', style: TextStyle(color: colors.subtext, fontSize: 12)),
        const SizedBox(height: 8),
        Text('$_experienceYears years', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: colors.text)),
        const SizedBox(height: 24),
        Text('Specialized Skills', style: TextStyle(color: colors.subtext, fontSize: 12)),
        const SizedBox(height: 12),
        if (_skills.isEmpty)
          Text('No skills listed', style: TextStyle(color: colors.subtext, fontSize: 13, fontStyle: FontStyle.italic))
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
