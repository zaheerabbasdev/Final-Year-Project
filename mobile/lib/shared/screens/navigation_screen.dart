import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/navigation_service.dart';
import '../../features/auth/auth_service.dart';
import '../../features/customer/screens/home_screen.dart';
import '../../features/customer/screens/my_jobs_screen.dart';
import '../../features/provider/screens/dashboard_screen.dart';
import '../../features/provider/screens/browse_jobs_screen.dart';
import '../../features/provider/screens/my_bids_screen.dart';
import 'profile_screen.dart';

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
      const Center(child: Text('Messages')),
      const ProfileScreen(),
    ];

    final List<Widget> providerScreens = [
      const ProviderDashboardScreen(),
      const BrowseJobsScreen(),
      const MyBidsScreen(),
      const ProfileScreen(),
    ];

    final screens = role == 'customer' ? customerScreens : providerScreens;

    return Scaffold(
      body: IndexedStack(
        index: selectedIndex,
        children: screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: selectedIndex,
        onTap: (index) => navService.setIndex(index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(0xFF6366F1),
        unselectedItemColor: const Color(0xFF94A3B8),
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12),
        items: role == 'customer' 
          ? const [
              BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
              BottomNavigationBarItem(icon: Icon(Icons.work_outline), activeIcon: Icon(Icons.work), label: 'My Jobs'),
              BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), activeIcon: Icon(Icons.chat_bubble), label: 'Messages'),
              BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
            ]
          : const [
              BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Dashboard'),
              BottomNavigationBarItem(icon: Icon(Icons.work_outline), activeIcon: Icon(Icons.work), label: 'Jobs'),
              BottomNavigationBarItem(icon: Icon(Icons.gavel_outlined), activeIcon: Icon(Icons.gavel), label: 'Bids'),
              BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
            ],
      ),
    );
  }
}
