import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../auth_service.dart';
import '../../../core/theme.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<Map<String, dynamic>> _pages = [
    {
      'title': 'Find Expert Help\nFor Your Home',
      'description': 'From plumbing to electrical work, find verified professionals for all your service needs.',
      'icon': Icons.search_rounded,
      'themeColor': AppTheme.primaryColor,
    },
    {
      'title': 'Real-time Tracking\n& Live Updates',
      'description': 'Track your service provider in real-time and get instant updates on your booking status.',
      'icon': Icons.location_on_rounded,
      'themeColor': const Color(0xFF10B981),
    },
    {
      'title': 'Secure Payments\n& Quality Work',
      'description': 'Pay securely through the app and only when the job is done to your satisfaction.',
      'icon': Icons.verified_user_rounded,
      'themeColor': const Color(0xFFF59E0B),
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Background Gradient Blobs
          Positioned(
            top: -150,
            right: -100,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 500),
              width: 400,
              height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _pages[_currentPage]['themeColor'].withOpacity(0.05),
              ),
            ),
          ),
          Positioned(
            bottom: -200,
            left: -150,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 500),
              width: 500,
              height: 500,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _pages[_currentPage]['themeColor'].withOpacity(0.03),
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // Brand Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.business_center_rounded, size: 20, color: AppTheme.primaryColor),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            'Kaarkun',
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textColor,
                              letterSpacing: -0.5,
                            ),
                          ),
                        ],
                      ),
                      TextButton(
                        onPressed: () => _finishOnboarding(),
                        child: Text(
                          'Skip',
                          style: GoogleFonts.outfit(
                            color: AppTheme.subtextColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Main Content
                Expanded(
                  child: PageView.builder(
                    controller: _pageController,
                    itemCount: _pages.length,
                    onPageChanged: (index) => setState(() => _currentPage = index),
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 40),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            // Logo Container
                            Stack(
                              alignment: Alignment.center,
                              children: [
                                // Background Decorative Icon
                                AnimatedSwitcher(
                                  duration: const Duration(milliseconds: 600),
                                  child: Icon(
                                    _pages[index]['icon'],
                                    key: ValueKey('icon_$index'),
                                    size: 280,
                                    color: _pages[index]['themeColor'].withOpacity(0.05),
                                  ),
                                ),
                                // Main Logo
                                Container(
                                  padding: const EdgeInsets.all(30),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: _pages[index]['themeColor'].withOpacity(0.15),
                                        blurRadius: 40,
                                        spreadRadius: 5,
                                      ),
                                    ],
                                  ),
                                  child: Image.asset(
                                    'assets/images/icon.png',
                                    height: 140,
                                    width: 140,
                                    fit: BoxFit.contain,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 60),
                            // Text Content
                            AnimatedSwitcher(
                              duration: const Duration(milliseconds: 400),
                              child: Column(
                                key: ValueKey('content_$index'),
                                children: [
                                  Text(
                                    _pages[index]['title']!,
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.outfit(
                                      fontSize: 32,
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.textColor,
                                      height: 1.2,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    _pages[index]['description']!,
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.outfit(
                                      fontSize: 16,
                                      color: AppTheme.subtextColor,
                                      height: 1.6,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),

                // Footer Actions
                Padding(
                  padding: const EdgeInsets.fromLTRB(32, 0, 32, 40),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Dots Indicator
                      Row(
                        children: List.generate(
                          _pages.length,
                          (index) => AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            margin: const EdgeInsets.only(right: 8),
                            height: 8,
                            width: _currentPage == index ? 24 : 8,
                            decoration: BoxDecoration(
                              color: _currentPage == index 
                                  ? _pages[index]['themeColor'] 
                                  : _pages[index]['themeColor'].withOpacity(0.2),
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      ),

                      // Next Button
                      GestureDetector(
                        onTap: () {
                          if (_currentPage == _pages.length - 1) {
                            _finishOnboarding();
                          } else {
                            _pageController.nextPage(
                              duration: const Duration(milliseconds: 500),
                              curve: Curves.easeInOutQuart,
                            );
                          }
                        },
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            SizedBox(
                              width: 70,
                              height: 70,
                              child: CircularProgressIndicator(
                                value: (_currentPage + 1) / _pages.length,
                                strokeWidth: 3,
                                backgroundColor: _pages[_currentPage]['themeColor'].withOpacity(0.1),
                                valueColor: AlwaysStoppedAnimation<Color>(_pages[_currentPage]['themeColor']),
                              ),
                            ),
                            Container(
                              width: 54,
                              height: 54,
                              decoration: BoxDecoration(
                                color: _pages[_currentPage]['themeColor'],
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: _pages[_currentPage]['themeColor'].withOpacity(0.4),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Icon(
                                _currentPage == _pages.length - 1 
                                    ? Icons.check_rounded 
                                    : Icons.arrow_forward_ios_rounded,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _finishOnboarding() async {
    final authService = context.read<AuthService>();
    await authService.completeOnboarding();
    if (mounted) {
      context.go('/login');
    }
  }
}
