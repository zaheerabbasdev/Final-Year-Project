import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'core/theme.dart';
import 'features/auth/auth_service.dart';
import 'features/auth/screens/splash_screen.dart';
import 'features/auth/screens/onboarding_screen.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/signup_screen.dart';
import 'features/auth/screens/forgot_password_screen.dart';
import 'features/auth/screens/otp_screen.dart';

import 'features/customer/job_service.dart';
import 'features/customer/category_service.dart';
import 'features/provider/provider_service.dart';
import 'features/provider/screens/provider_reviews_screen.dart';
import 'shared/services/booking_service.dart';
import 'shared/services/navigation_service.dart';
import 'shared/services/review_service.dart';
import 'features/customer/screens/home_screen.dart';
import 'features/customer/screens/post_job_screen.dart';
import 'features/provider/screens/dashboard_screen.dart';
import 'features/provider/screens/browse_jobs_screen.dart';
import 'features/provider/screens/place_bid_screen.dart';
import 'shared/screens/job_detail_screen.dart';
import 'shared/screens/navigation_screen.dart';
import 'shared/screens/profile_screen.dart';
import 'shared/screens/provider_profile_screen.dart';
import 'shared/screens/customer_profile_screen.dart';
import 'shared/screens/submit_review_screen.dart';
import 'shared/screens/qr_handshake_screen.dart';
import 'features/notifications/notification_screen.dart';
import 'features/notifications/notification_provider.dart';
import 'core/services/socket_service.dart';
import 'features/chat/providers/chat_provider.dart';
import 'features/chat/screens/chat_list_screen.dart';
import 'features/chat/screens/chat_room_screen.dart';
import 'shared/providers/sync_provider.dart';


import 'core/services/notification_service.dart';
import 'core/services/location_tracking_service.dart';
import 'core/services/handshake_service.dart';
import 'features/customer/screens/track_provider_screen.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()..checkAuth()),
        ChangeNotifierProvider(create: (_) => CategoryService()),
        ChangeNotifierProvider(create: (_) => JobService()),
        ChangeNotifierProvider(create: (_) => ProviderService()),
        ChangeNotifierProvider(create: (_) => BookingService()),
        ChangeNotifierProvider(create: (_) => NavigationService()),
        ChangeNotifierProvider(create: (_) => ReviewService()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
        ChangeNotifierProvider(create: (_) => SyncProvider()),
        ChangeNotifierProvider(create: (_) => LocationTrackingService()),
        ChangeNotifierProvider(create: (_) => HandshakeService()),

        Provider(create: (_) => NotificationService()),
        ProxyProvider3<NotificationService, NotificationProvider, ChatProvider, SocketService>(
          update: (context, notifService, notifProvider, chatProvider, socketService) {
            notifService.setProvider(notifProvider);
            return socketService ?? SocketService(notifService, chatProvider);
          },
        ),

      ],
      child: const KaarkunApp(),
    ),
  );
}

class KaarkunApp extends StatefulWidget {
  const KaarkunApp({super.key});

  @override
  State<KaarkunApp> createState() => _KaarkunAppState();
}

class _KaarkunAppState extends State<KaarkunApp> with WidgetsBindingObserver {
  bool? _wasAuthenticated;

  @override

  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Trigger global sync when app returns from background
      final syncProvider = context.read<SyncProvider>();
      syncProvider.syncAll(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();
    final socketService = context.read<SocketService>();
    final notificationProvider = context.read<NotificationProvider>();
    final syncProvider = context.read<SyncProvider>();

    // Initial sync and re-sync on login
    if (authService.isAuthenticated && _wasAuthenticated != true) {
      _wasAuthenticated = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        syncProvider.syncAll(context);
      });
    } else if (!authService.isAuthenticated) {
      _wasAuthenticated = false;
    }

    // Connect socket if authenticated

    if (authService.isAuthenticated && authService.user != null) {
      socketService.connect(authService.user!['id']);
    } else {
      socketService.disconnect();
    }


    final router = GoRouter(
      navigatorKey: navigatorKey,
      initialLocation: '/splash',
      refreshListenable: authService,
      redirect: (context, state) {
        final bool isInitialized = authService.isInitialized;
        final bool isAuthenticated = authService.isAuthenticated;
        final bool isFirstTime = authService.isFirstTime;
        
        final bool isSplash = state.matchedLocation == '/splash';
        final bool isAuthRoute = state.matchedLocation == '/login' || 
                                state.matchedLocation == '/signup' || 
                                state.matchedLocation == '/onboarding' ||
                                state.matchedLocation == '/verify-otp';

        if (!isInitialized && !isSplash) return '/splash';

        if (isSplash && isInitialized) {
          if (isAuthenticated) return '/main';
          if (isFirstTime) return '/onboarding';
          return '/login';
        }

        if (isAuthenticated && isAuthRoute) return '/main';

        if (!isAuthenticated && !isAuthRoute && !isSplash && state.matchedLocation != '/forgot-password') {
          return isFirstTime ? '/onboarding' : '/login';
        }

        return null;
      },
      routes: [
        GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
        GoRoute(path: '/onboarding', builder: (context, state) => const OnboardingScreen()),
        GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
        GoRoute(path: '/signup', builder: (context, state) => const SignupScreen()),
        GoRoute(path: '/verify-otp', builder: (context, state) => OtpScreen(email: state.extra as String)),
        GoRoute(path: '/forgot-password', builder: (context, state) => const ForgotPasswordScreen()),
        GoRoute(path: '/customer-home', builder: (context, state) => const CustomerHomeScreen()),
        GoRoute(path: '/provider-dashboard', builder: (context, state) => const ProviderDashboardScreen()),
        GoRoute(path: '/browse-jobs', builder: (context, state) => const BrowseJobsScreen()),
        GoRoute(path: '/job-detail/:id', builder: (context, state) => JobDetailScreen(jobId: int.parse(state.pathParameters['id']!))),
        GoRoute(path: '/place-bid/:id', builder: (context, state) => PlaceBidScreen(jobId: int.parse(state.pathParameters['id']!))),
        GoRoute(path: '/post-job', builder: (context, state) => PostJobScreen()),
        GoRoute(
          path: '/profile', 
          builder: (context, state) {
            final bool editMode = state.extra is bool ? state.extra as bool : false;
            return ProfileScreen(initialEditMode: editMode);
          }
        ),
        GoRoute(path: '/main', builder: (context, state) => const MainNavigationScreen()),
        GoRoute(
          path: '/submit-review',
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>;
            return SubmitReviewScreen(
              bookingId: extra['bookingId'],
              jobId: extra['jobId'],
              providerId: extra['providerId'],
              providerName: extra['providerName'],
              providerAvatar: extra['providerAvatar'],
            );
          },
        ),
        GoRoute(
          path: '/provider-reviews/:id',
          builder: (context, state) => ProviderReviewsScreen(
            providerId: int.parse(state.pathParameters['id']!),
          ),
        ),
        GoRoute(
          path: '/provider-profile/:id',
          builder: (context, state) => ProviderProfileScreen(
            providerId: int.parse(state.pathParameters['id']!),
          ),
        ),
        GoRoute(
          path: '/customer-profile/:id',
          builder: (context, state) => CustomerProfileScreen(
            customerId: int.parse(state.pathParameters['id']!),
          ),
        ),
        GoRoute(
          path: '/notifications',
          builder: (context, state) => const NotificationScreen(),
        ),
        GoRoute(
          path: '/chat-list',
          builder: (context, state) => const ChatListScreen(),
        ),
        GoRoute(
          path: '/chat-room',
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>;
            return ChatRoomScreen(
              jobId: extra['jobId'],
              otherUserId: extra['otherUserId'],
              otherUserName: extra['otherUserName'],
              otherUserAvatar: extra['otherUserAvatar'],
            );
          },
        ),
        GoRoute(
          path: '/track-provider',
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>;
            return TrackProviderScreen(
              jobId: extra['jobId'],
              customerId: extra['customerId'],
              providerId: extra['providerId'],
              providerName: extra['providerName'],
            );
          },
        ),
        GoRoute(
          path: '/handshake',
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>;
            return QrHandshakeScreen(
              bookingId: extra['bookingId'],
              isProvider: extra['isProvider'],
            );
          },
        ),
      ],
    );

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'Kaarkun',
      theme: AppTheme.lightTheme,
      routerConfig: router,
    );
  }
}
