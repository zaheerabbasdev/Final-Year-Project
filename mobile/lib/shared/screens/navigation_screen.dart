import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/navigation_service.dart';
import '../../features/auth/auth_service.dart';
import '../../features/customer/screens/home_screen.dart';
import '../../features/customer/screens/my_jobs_screen.dart';
import '../../features/provider/screens/dashboard_screen.dart';
import '../../features/provider/screens/browse_jobs_screen.dart';
import '../../features/provider/screens/my_bids_screen.dart';
import 'profile_screen.dart';
import '../../features/chat/screens/chat_list_screen.dart';

class MainNavigationScreen extends StatelessWidget {
  const MainNavigationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final role = context.watch<AuthService>().role;
    final navService = context.watch<NavigationService>();
    final int selectedIndex = navService.selectedIndex;
    
    final List<Widget> customerScreens = [
      const CustomerHomeScreen(),
      const MyJobsScreen(),
      const ChatListScreen(),
      const ProfileScreen(),
    ];

    final List<Widget> providerScreens = [
      const ProviderDashboardScreen(),
      const BrowseJobsScreen(),
      const MyBidsScreen(),
      const ChatListScreen(),
      const ProfileScreen(),
    ];

    final screens = role == 'customer' ? customerScreens : providerScreens;

    // Define items for each role
    final List<Map<String, dynamic>> customerItems = [
      {'icon': Icons.home_outlined, 'activeIcon': Icons.home_rounded, 'label': 'Home'},
      {'icon': Icons.assignment_outlined, 'activeIcon': Icons.assignment_rounded, 'label': 'My Jobs'},
      {'icon': Icons.chat_bubble_outline_rounded, 'activeIcon': Icons.chat_bubble_rounded, 'label': 'Chat'},
      {'icon': Icons.person_outline_rounded, 'activeIcon': Icons.person_rounded, 'label': 'Profile'},
    ];

    final List<Map<String, dynamic>> providerItems = [
      {'icon': Icons.dashboard_outlined, 'activeIcon': Icons.dashboard_rounded, 'label': 'Dashboard'},
      {'icon': Icons.search_rounded, 'activeIcon': Icons.youtube_searched_for_rounded, 'label': 'Jobs'},
      {'icon': Icons.gavel_outlined, 'activeIcon': Icons.gavel_rounded, 'label': 'Bids'},
      {'icon': Icons.chat_bubble_outline_rounded, 'activeIcon': Icons.chat_bubble_rounded, 'label': 'Chat'},
      {'icon': Icons.person_outline_rounded, 'activeIcon': Icons.person_rounded, 'label': 'Profile'},
    ];

    final items = role == 'customer' ? customerItems : providerItems;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FB),
      // Set resizeToAvoidBottomInset to false so that floating bar is not squeezed by keyboard
      resizeToAvoidBottomInset: false,
      body: Stack(
        children: [
          // Screen content padded slightly at bottom to not be hidden by floating bar
          Positioned.fill(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 90),
              child: IndexedStack(
                index: selectedIndex,
                children: screens,
              ),
            ),
          ),
          
          // Floating Pill Bottom Navigation Bar
          Positioned(
            left: 16,
            right: 16,
            bottom: 20,
            child: SafeArea(
              child: Container(
                height: 72,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.92),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.white.withOpacity(0.6), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF003B95).withOpacity(0.08),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: List.generate(items.length, (index) {
                          final item = items[index];
                          final isSelected = selectedIndex == index;
                          return Expanded(
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: () => navService.setIndex(index),
                                splashColor: Colors.transparent,
                                highlightColor: Colors.transparent,
                                child: TweenAnimationBuilder<double>(
                                  duration: const Duration(milliseconds: 250),
                                  tween: Tween(begin: 0.0, end: isSelected ? 1.0 : 0.0),
                                  builder: (context, val, child) {
                                    return Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        // Glow/Background Dot behind active icon
                                        Stack(
                                          alignment: Alignment.center,
                                          children: [
                                            if (val > 0.1)
                                              Opacity(
                                                opacity: val * 0.15,
                                                child: Container(
                                                  width: 44,
                                                  height: 38,
                                                  decoration: BoxDecoration(
                                                    color: const Color(0xFF003B95),
                                                    borderRadius: BorderRadius.circular(14),
                                                  ),
                                                ),
                                              ),
                                            Icon(
                                              isSelected ? item['activeIcon'] : item['icon'],
                                              color: Color.lerp(
                                                const Color(0xFF94A3B8),
                                                const Color(0xFF003B95),
                                                val,
                                              ),
                                              size: 24 + (val * 2), // Gentle scale animation
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          item['label'],
                                          style: GoogleFonts.outfit(
                                            fontSize: 10,
                                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                            color: Color.lerp(
                                              const Color(0xFF94A3B8),
                                              const Color(0xFF003B95),
                                              val,
                                            ),
                                          ),
                                        ),
                                      ],
                                    );
                                  },
                                ),
                              ),
                            ),
                          );
                        }),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
