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
    },
    {
      'title': 'Real-time Tracking\n& Live Updates',
      'description': 'Track your service provider in real-time and get instant updates on your booking status.',
      'icon': Icons.location_on_rounded,
    },
    {
      'title': 'Secure Payments\n& Quality Work',
      'description': 'Pay securely through the app and only when the job is done to your satisfaction.',
      'icon': Icons.verified_user_rounded,
    },
  ];

  Color _getThemeColor(int index) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    if (index == 0) {
      return isDark ? const Color(0xFF38BDF8) : AppTheme.primaryColor;
    }
    if (index == 1) {
      return AppTheme.secondaryColor;
    }
    return AppTheme.warningColor;
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).appColors;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final themeColor = _getThemeColor(_currentPage);

    return Scaffold(
      backgroundColor: colors.background,
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
                color: themeColor.withOpacity(isDark ? 0.08 : 0.05),
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
                color: themeColor.withOpacity(isDark ? 0.05 : 0.03),
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
                              color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              Icons.business_center_rounded, 
                              size: 20, 
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            'Kaarkun',
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: colors.text,
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
                            color: colors.subtext,
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
                      final pageThemeColor = _getThemeColor(index);
                      return Center(
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
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
                                      size: 200,
                                      color: pageThemeColor.withOpacity(isDark ? 0.08 : 0.05),
                                    ),
                                  ),
                                  // Main Logo
                                  Container(
                                    padding: const EdgeInsets.all(30),
                                    decoration: BoxDecoration(
                                      color: colors.surface,
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: pageThemeColor.withOpacity(isDark ? 0.25 : 0.15),
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
                              const SizedBox(height: 32),
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
                                        color: colors.text,
                                        height: 1.2,
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    Text(
                                      _pages[index]['description']!,
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.outfit(
                                        fontSize: 16,
                                        color: colors.subtext,
                                        height: 1.6,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
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
                          (index) {
                            final dotColor = _getThemeColor(index);
                            return AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
                              margin: const EdgeInsets.only(right: 8),
                              height: 8,
                              width: _currentPage == index ? 24 : 8,
                              decoration: BoxDecoration(
                                color: _currentPage == index 
                                    ? dotColor 
                                    : dotColor.withOpacity(isDark ? 0.3 : 0.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            );
                          },
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
                                backgroundColor: themeColor.withOpacity(isDark ? 0.15 : 0.1),
                                valueColor: AlwaysStoppedAnimation<Color>(themeColor),
                              ),
                            ),
                            Container(
                              width: 54,
                              height: 54,
                              decoration: BoxDecoration(
                                color: themeColor,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: themeColor.withOpacity(isDark ? 0.5 : 0.4),
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
