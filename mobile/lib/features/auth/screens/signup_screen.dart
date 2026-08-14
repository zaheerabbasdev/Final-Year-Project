import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:google_fonts/google_fonts.dart';
import '../auth_service.dart';
import '../../customer/category_service.dart';
import '../../../core/providers/language_provider.dart';
import '../../../core/theme.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _experienceController = TextEditingController();
  String _selectedRole = 'customer';
  bool _isLoading = false;
  bool _agreeToTerms = false;
  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;
  XFile? _avatarFile;
  Uint8List? _avatarBytes;
  XFile? _cnicFile;
  XFile? _certificateFile;
  int? _selectedCategoryId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CategoryService>().fetchCategories();
    });
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      final bytes = await pickedFile.readAsBytes();
      setState(() {
        _avatarFile = pickedFile;
        _avatarBytes = bytes;
      });
    }
  }

  Future<void> _pickCnic() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _cnicFile = pickedFile;
      });
    }
  }

  Future<void> _pickCertificate() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _certificateFile = pickedFile;
      });
    }
  }

  void _signup() async {
    if (!_formKey.currentState!.validate()) return;
    final lang = context.read<LanguageProvider>();
    if (!_agreeToTerms) {
      Fluttertoast.showToast(
        msg: lang.t('auth.signup.agreeError'),
        backgroundColor: Colors.red,
        textColor: Colors.white,
        webBgColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
      );
      return;
    }

    setState(() => _isLoading = true);
    final response = await context.read<AuthService>().register({
      'full_name': _nameController.text,
      'email': _emailController.text,
      'phone': _phoneController.text,
      'password': _passwordController.text,
      'role': _selectedRole,
      'avatar': _avatarFile,
      'cnic': _cnicFile,
      'certificates': _certificateFile,
      'category_id': _selectedCategoryId,
      'experience_years': _selectedRole == 'provider' ? _experienceController.text : '0',
    });
    setState(() => _isLoading = false);

    if (response['success'] == true) {
      if (mounted) {
        if (response['requiresOTP'] == true) {
          final emailSent = response['emailSent'] == true;
          Fluttertoast.showToast(
            msg: emailSent
                ? 'Account created! Check your email for the 6-digit code.'
                : 'Account created! We couldn\'t send the email — tap "Resend Code" on the next screen.',
            backgroundColor: emailSent ? AppTheme.successColor : AppTheme.warningColor,
            textColor: Colors.white,
            timeInSecForIosWeb: 4,
          );
          context.push('/verify-otp', extra: _emailController.text);
        } else {
          Fluttertoast.showToast(
            msg: lang.t('auth.signup.providerSuccess'),
            backgroundColor: AppTheme.successColor,
            textColor: Colors.white,
            timeInSecForIosWeb: 3,
          );
          context.pop();
        }
      }
    } else {
      if (mounted) {
        Fluttertoast.showToast(
          msg: response['message'] ?? lang.t('auth.signup.registrationFailed'),
          backgroundColor: AppTheme.errorColor,
          textColor: Colors.white,
          webBgColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).appColors;
    final lang = context.watch<LanguageProvider>();
    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        automaticallyImplyLeading: false, // Remove back button
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Logo
              Center(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: colors.surface,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryColor.withOpacity(0.08),
                        blurRadius: 20,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Image.asset(
                    'assets/images/icon.png',
                    height: 70,
                    width: 70,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => const Icon(
                      Icons.business_center_rounded,
                      size: 50,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                lang.t('auth.signup.title'),
                style: GoogleFonts.outfit(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: colors.text,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                lang.t('auth.signup.subtitle'),
                style: GoogleFonts.outfit(
                  color: colors.subtext,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 32),
              
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: colors.surface,
                  borderRadius: BorderRadius.circular(32),
                  boxShadow: [
                    BoxShadow(
                      color: colors.text.withOpacity(0.03),
                      blurRadius: 30,
                      offset: const Offset(0, 15),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Step Indicator Header
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            'Step 1 of 2',
                            style: GoogleFonts.outfit(
                              color: AppTheme.primaryColor,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            lang.t('auth.signup.registrationDetails'),
                            style: GoogleFonts.outfit(
                              color: colors.text,
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: 0.5,
                        minHeight: 6,
                        backgroundColor: colors.border,
                        valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
                      ),
                    ),
                    const SizedBox(height: 28),

                    _buildLabel(lang.t('auth.signup.iWantTo'), colors),
                    Row(
                      children: [
                        Expanded(
                          child: _RoleCard(
                            title: lang.t('auth.signup.hireServices'),
                            icon: Icons.person_outline_rounded,
                            isSelected: _selectedRole == 'customer',
                            onTap: () => setState(() => _selectedRole = 'customer'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _RoleCard(
                            title: lang.t('auth.signup.offerServices'),
                            icon: Icons.build_outlined,
                            isSelected: _selectedRole == 'provider',
                            onTap: () => setState(() => _selectedRole = 'provider'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 28),
                    Center(
                      child: GestureDetector(
                        onTap: _pickImage,
                        child: Stack(
                          children: [
                            Container(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: AppTheme.primaryColor.withOpacity(0.15), width: 3),
                              ),
                              child: CircleAvatar(
                                radius: 45,
                                backgroundColor: colors.border,
                                backgroundImage: _avatarBytes != null ? MemoryImage(_avatarBytes!) : null,
                                child: _avatarBytes == null 
                                  ? Icon(Icons.person, size: 45, color: colors.subtext)
                                  : null,
                              ),
                            ),
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryColor,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 2),
                                ),
                                child: const Icon(Icons.camera_alt, size: 14, color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    _buildLabel(lang.t('auth.signup.fullName'), colors),
                    TextFormField(
                      controller: _nameController,
                      style: GoogleFonts.outfit(color: colors.text),
                      decoration: InputDecoration(hintText: lang.t('auth.signup.fullNameHint')),
                      validator: (v) => v!.isEmpty ? lang.t('auth.signup.nameRequired') : null,
                    ),
                    const SizedBox(height: 20),
                    _buildLabel(lang.t('auth.signup.emailLabel'), colors),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      style: GoogleFonts.outfit(color: colors.text),
                      decoration: InputDecoration(hintText: lang.t('auth.signup.emailHint')),
                      validator: (v) => v!.isEmpty ? lang.t('auth.signup.emailRequired') : null,
                    ),
                    const SizedBox(height: 20),
                    _buildLabel(lang.t('auth.signup.phoneLabel'), colors),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      style: GoogleFonts.outfit(color: colors.text),
                      decoration: InputDecoration(hintText: lang.t('auth.signup.phoneHint')),
                    ),
                    if (_selectedRole == 'provider') ...[
                      const SizedBox(height: 20),
                      _buildLabel(lang.t('auth.signup.serviceCategory'), colors),
                      Consumer<CategoryService>(
                        builder: (context, catService, _) {
                          if (catService.isLoading) {
                            return const Padding(
                              padding: EdgeInsets.symmetric(vertical: 8.0),
                              child: LinearProgressIndicator(
                                backgroundColor: Color(0xFFF1F5F9),
                                color: AppTheme.primaryColor,
                              ),
                            );
                          }

                          if (catService.categories.isEmpty) {
                            return InkWell(
                              onTap: () => catService.fetchCategories(),
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEF2F2),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.red.shade200),
                                ),
                                child: Row(
                                  children: [
                                    Icon(Icons.error_outline, color: Colors.red.shade600, size: 20),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        lang.t('auth.signup.noCategories'),
                                        style: GoogleFonts.outfit(color: Colors.red.shade800, fontSize: 13, fontWeight: FontWeight.w500),
                                      ),
                                    ),
                                    Icon(Icons.refresh, color: Colors.red.shade600, size: 20),
                                  ],
                                ),
                              ),
                            );
                          }

                          return DropdownButtonFormField<int>(
                            value: _selectedCategoryId,
                            isExpanded: true,
                            style: GoogleFonts.outfit(color: colors.text, fontSize: 15),
                            items: catService.categories.map((cat) {
                              return DropdownMenuItem<int>(
                                value: int.tryParse(cat['id'].toString()),
                                child: Text(cat['name'].toString()),
                              );
                            }).toList(),
                            onChanged: (value) => setState(() => _selectedCategoryId = value),
                            decoration: InputDecoration(
                              hintText: lang.t('auth.signup.selectCategory'),
                              prefixIcon: const Icon(Icons.category_outlined, size: 20),
                            ),
                            validator: (v) => _selectedRole == 'provider' && v == null ? lang.t('auth.signup.categoryRequired') : null,
                          );
                        },
                      ),
                      const SizedBox(height: 20),
                      _buildLabel(lang.t('auth.signup.experience'), colors),
                      TextFormField(
                        controller: _experienceController,
                        keyboardType: TextInputType.number,
                        style: GoogleFonts.outfit(color: colors.text),
                        decoration: InputDecoration(hintText: lang.t('auth.signup.experienceHint')),
                        validator: (v) => _selectedRole == 'provider' && v!.isEmpty ? lang.t('auth.signup.experienceRequired') : null,
                      ),
                      const SizedBox(height: 20),
                      _buildLabel(lang.t('auth.signup.uploadCnic'), colors),
                      _buildFileUploadTile(
                        title: _cnicFile == null ? lang.t('auth.signup.selectCnic') : _cnicFile!.name,
                        icon: Icons.badge_outlined,
                        onTap: _pickCnic,
                        isSelected: _cnicFile != null,
                        colors: colors,
                      ),
                      const SizedBox(height: 20),
                      _buildLabel(lang.t('auth.signup.uploadCertificates'), colors),
                      _buildFileUploadTile(
                        title: _certificateFile == null ? lang.t('auth.signup.selectCertificate') : _certificateFile!.name,
                        icon: Icons.card_membership_outlined,
                        onTap: _pickCertificate,
                        isSelected: _certificateFile != null,
                        colors: colors,
                      ),
                    ],
                    const SizedBox(height: 20),
                    _buildLabel(lang.t('auth.signup.passwordLabel'), colors),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: !_isPasswordVisible,
                      style: GoogleFonts.outfit(color: colors.text),
                      decoration: InputDecoration(
                        hintText: lang.t('auth.signup.passwordHint'),
                        suffixIcon: IconButton(
                          icon: Icon(_isPasswordVisible ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                          onPressed: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
                          color: colors.subtext.withOpacity(0.7),
                        ),
                      ),
                      validator: (v) => v!.length < 6 ? 'Password must be at least 6 chars' : null,
                    ),
                    const SizedBox(height: 20),
                    _buildLabel(lang.t('auth.signup.confirmPassword'), colors),
                    TextFormField(
                      controller: _confirmPasswordController,
                      obscureText: !_isConfirmPasswordVisible,
                      style: GoogleFonts.outfit(color: colors.text),
                      decoration: InputDecoration(
                        hintText: lang.t('auth.signup.confirmPasswordHint'),
                        suffixIcon: IconButton(
                          icon: Icon(_isConfirmPasswordVisible ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                          onPressed: () => setState(() => _isConfirmPasswordVisible = !_isConfirmPasswordVisible),
                          color: colors.subtext.withOpacity(0.7),
                        ),
                      ),
                      validator: (v) => v != _passwordController.text ? lang.t('auth.signup.passwordsNotMatch') : null,
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        SizedBox(
                          height: 24,
                          width: 24,
                          child: Checkbox(
                            value: _agreeToTerms,
                            activeColor: AppTheme.primaryColor,
                            onChanged: (value) => setState(() => _agreeToTerms = value!),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: RichText(
                            text: TextSpan(
                              style: GoogleFonts.outfit(color: colors.subtext, fontSize: 13, height: 1.4),
                              children: [
                                TextSpan(text: lang.t('auth.signup.agreeTerms')),
                                TextSpan(
                                  text: lang.t('auth.signup.termsOfService'),
                                  style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
                                ),
                                TextSpan(text: lang.t('auth.signup.and')),
                                TextSpan(
                                  text: lang.t('auth.signup.privacyPolicy'),
                                  style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    ElevatedButton(
                      onPressed: _isLoading ? null : _signup,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        padding: const EdgeInsets.symmetric(vertical: 18),
                      ),
                      child: _isLoading 
                        ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                        : Text(lang.t('auth.signup.createAccount'), style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              // ── Already have an account row ──────────────────────────────
              Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  border: Border(top: BorderSide(color: colors.border, width: 1)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      lang.t('auth.signup.alreadyHaveAccount'),
                      style: GoogleFonts.outfit(color: colors.text, fontSize: 15, fontWeight: FontWeight.w500),
                    ),
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: Text(
                        lang.t('auth.signup.signIn'),
                        style: GoogleFonts.outfit(
                          color: Theme.of(context).brightness == Brightness.dark
                              ? AppTheme.secondaryColor   // bright blue visible on dark
                              : AppTheme.primaryColor,    // dark navy visible on light
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text, AppColors colors) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        text,
        style: GoogleFonts.outfit(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: colors.text,
        ),
      ),
    );
  }

  Widget _buildFileUploadTile({
    required String title,
    required IconData icon,
    required VoidCallback onTap,
    required bool isSelected,
    required AppColors colors,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryColor.withOpacity(0.05) : colors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : colors.border,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, size: 22, color: isSelected ? AppTheme.primaryColor : colors.subtext),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: GoogleFonts.outfit(
                  color: isSelected ? colors.text : colors.subtext,
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, size: 20, color: AppTheme.primaryColor)
            else
              Icon(Icons.add_a_photo_outlined, size: 20, color: colors.subtext),
          ],
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _RoleCard({required this.title, required this.icon, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).appColors;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryColor.withOpacity(0.05) : colors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : colors.border,
            width: isSelected ? 2.0 : 1.0,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, size: 28, color: isSelected ? AppTheme.primaryColor : colors.subtext),
            const SizedBox(height: 12),
            Text(
              title,
              style: GoogleFonts.outfit(
                color: isSelected ? colors.text : colors.subtext,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
