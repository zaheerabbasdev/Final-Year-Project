import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../auth_service.dart';
import '../../customer/category_service.dart';

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

  void _signup() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_agreeToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please agree to the Terms and Conditions')),
      );
      return;
    }

    setState(() => _isLoading = true);
    final success = await context.read<AuthService>().register({
      'full_name': _nameController.text,
      'email': _emailController.text,
      'phone': _phoneController.text,
      'password': _passwordController.text,
      'role': _selectedRole,
      'avatar': _avatarFile,
      'category_id': _selectedCategoryId,
      'experience_years': _selectedRole == 'provider' ? _experienceController.text : '0',
    });
    setState(() => _isLoading = false);

    if (success) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Registration successful! Please login.')),
        );
        context.pop();
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Registration failed.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        automaticallyImplyLeading: false, // Remove back button
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF6366F1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.business_center_rounded, size: 40, color: Colors.white),
              ),
              const SizedBox(height: 24),
              Text(
                'Create Account',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1F2937),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Join ServiceHub today',
                style: TextStyle(color: Colors.blueGrey.shade400, fontSize: 16),
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.03),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _buildLabel('I want to'),
                    Row(
                      children: [
                        Expanded(
                          child: _RoleCard(
                            title: 'Hire Services',
                            icon: Icons.person_outline_rounded,
                            isSelected: _selectedRole == 'customer',
                            onTap: () => setState(() => _selectedRole = 'customer'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _RoleCard(
                            title: 'Offer Services',
                            icon: Icons.build_outlined,
                            isSelected: _selectedRole == 'provider',
                            onTap: () => setState(() => _selectedRole = 'provider'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    Center(
                      child: GestureDetector(
                        onTap: _pickImage,
                        child: Stack(
                          children: [
                            Container(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.2), width: 3),
                              ),
                              child: CircleAvatar(
                                radius: 45,
                                backgroundColor: const Color(0xFFF1F5F9),
                                backgroundImage: _avatarBytes != null ? MemoryImage(_avatarBytes!) : null,
                                child: _avatarBytes == null 
                                  ? const Icon(Icons.person, size: 45, color: Color(0xFFCBD5E1))
                                  : null,
                              ),
                            ),

                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF6366F1),
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
                    _buildLabel('Full Name'),
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(hintText: 'Enter your full name'),
                      validator: (v) => v!.isEmpty ? 'Name is required' : null,
                    ),
                    const SizedBox(height: 20),
                    _buildLabel('Email Address'),
                    TextFormField(
                      controller: _emailController,
                      decoration: const InputDecoration(hintText: 'Enter your email'),
                      validator: (v) => v!.isEmpty ? 'Email is required' : null,
                    ),
                    const SizedBox(height: 20),
                    _buildLabel('Phone Number'),
                    TextFormField(
                      controller: _phoneController,
                      decoration: const InputDecoration(hintText: 'Enter your phone number'),
                    ),
                    if (_selectedRole == 'provider') ...[
                      const SizedBox(height: 20),
                      _buildLabel('Service Category'),
                      Consumer<CategoryService>(
                        builder: (context, catService, _) {
                          return DropdownButtonFormField<int>(
                            value: _selectedCategoryId,
                            items: catService.categories.map((cat) {
                              return DropdownMenuItem<int>(
                                value: cat['id'],
                                child: Text(cat['name']),
                              );
                            }).toList(),
                            onChanged: (value) => setState(() => _selectedCategoryId = value),
                            decoration: const InputDecoration(
                              hintText: 'Select your service type',
                            ),
                            validator: (v) => _selectedRole == 'provider' && v == null ? 'Category is required' : null,
                          );
                        },
                      ),
                      const SizedBox(height: 20),
                      _buildLabel('Years of Experience'),
                      TextFormField(
                        controller: _experienceController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(hintText: 'Enter your experience in years'),
                        validator: (v) => _selectedRole == 'provider' && v!.isEmpty ? 'Experience is required' : null,
                      ),
                    ],
                    const SizedBox(height: 20),
                    _buildLabel('Password'),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: !_isPasswordVisible,
                      decoration: InputDecoration(
                        hintText: 'Create a password',
                        suffixIcon: IconButton(
                          icon: Icon(_isPasswordVisible ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                          onPressed: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
                          color: Colors.blueGrey.shade300,
                        ),
                      ),
                      validator: (v) => v!.length < 6 ? 'Password must be at least 6 chars' : null,
                    ),
                    const SizedBox(height: 20),
                    _buildLabel('Confirm Password'),
                    TextFormField(
                      controller: _confirmPasswordController,
                      obscureText: !_isConfirmPasswordVisible,
                      decoration: InputDecoration(
                        hintText: 'Confirm your password',
                        suffixIcon: IconButton(
                          icon: Icon(_isConfirmPasswordVisible ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                          onPressed: () => setState(() => _isConfirmPasswordVisible = !_isConfirmPasswordVisible),
                          color: Colors.blueGrey.shade300,
                        ),
                      ),
                      validator: (v) => v != _passwordController.text ? 'Passwords do not match' : null,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        SizedBox(
                          height: 24,
                          width: 24,
                          child: Checkbox(
                            value: _agreeToTerms,
                            onChanged: (value) => setState(() => _agreeToTerms = value!),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: RichText(
                            text: TextSpan(
                              style: TextStyle(color: Colors.blueGrey.shade600, fontSize: 13, height: 1.4),
                              children: [
                                const TextSpan(text: 'I agree to the '),
                                TextSpan(
                                  text: 'Terms of Service',
                                  style: TextStyle(color: Theme.of(context).primaryColor, fontWeight: FontWeight.bold),
                                ),
                                const TextSpan(text: ' and '),
                                TextSpan(
                                  text: 'Privacy Policy',
                                  style: TextStyle(color: Theme.of(context).primaryColor, fontWeight: FontWeight.bold),
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
                        backgroundColor: const Color(0xFF6366F1),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        padding: const EdgeInsets.symmetric(vertical: 18),
                      ),
                      child: _isLoading 
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Create Account', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text("Already have an account? ", style: TextStyle(color: Colors.blueGrey.shade600)),
                  TextButton(
                    onPressed: () => context.pop(),
                    child: const Text('Sign In', style: TextStyle(color: Color(0xFF6366F1), fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: Color(0xFF374151),
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
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFF5F3FF) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? const Color(0xFF6366F1) : Colors.grey.shade200,
            width: 1.5,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, size: 28, color: isSelected ? const Color(0xFF6366F1) : Colors.blueGrey.shade300),
            const SizedBox(height: 12),
            Text(
              title,
              style: TextStyle(
                color: isSelected ? const Color(0xFF1F2937) : Colors.blueGrey.shade400,
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
