import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'utils/token_storage.dart';

class ApiClient {
  // Override at build time with:
  // flutter run --dart-define=API_BASE_URL=http://<lan-ip-or-domain>:5000/api
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://academy-dev-alb-2776693.ap-south-1.elb.amazonaws.com/api',
  );

  static final ApiClient _instance = ApiClient._internal();
  VoidCallback? onUnauthorized;
  late final Dio _dio;

  factory ApiClient({VoidCallback? onUnauthorized}) {
    if (onUnauthorized != null) {
      _instance.onUnauthorized = onUnauthorized;
    }
    return _instance;
  }

  ApiClient._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      // Fail fast on connection: 10 s is plenty to reach the ALB.
      // The old 30 s connect timeout caused the UI to freeze visibly.
      connectTimeout: const Duration(seconds: 10),
      // Keep receive at 30 s for large payloads (job images, AI responses).
      receiveTimeout: const Duration(seconds: 30),
      // Send timeout for uploads (avatars, job images).
      sendTimeout: const Duration(seconds: 60),
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await TokenStorage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (e, handler) {
        if (e.response?.statusCode == 403) {
          // 403 = business-logic denial (bidding on an accepted job, rate limit,
          // or account suspended). Show the server's message as a toast so the
          // user understands what happened, but do NOT log them out — only an
          // invalid/expired JWT (401) should force a re-login.
          final message = e.response?.data is Map
              ? (e.response!.data['message'] ?? 'Access denied.')
              : 'Access denied.';

          // Skip the automatic toast on login screens — they handle errors themselves.
          final isLogin = e.requestOptions.extra['isLogin'] == true;
            // Booking details are optional while viewing another provider's job.
            // Do not surface an authorization response as a misleading toast.
            final isBookingLookup = e.requestOptions.method == 'GET' &&
              e.requestOptions.path.contains('/bookings/job/');
            if (!isLogin && !isBookingLookup) {
            Fluttertoast.showToast(
              msg: message,
              backgroundColor: Colors.red,
              textColor: Colors.white,
              gravity: ToastGravity.TOP,
              timeInSecForIosWeb: 5,
            );
          }
          // ← Do NOT call onUnauthorized() — that would incorrectly log the user out.
        } else if (e.response?.statusCode == 401) {
          // 401 = invalid or expired JWT → must re-login.
          if (onUnauthorized != null) {
            onUnauthorized!();
          }
        }
        return handler.next(e);
      },
    ));
  }

  Dio get dio => _dio;

  static String? getImageUrl(String? path) {
    if (path == null || path.isEmpty) return null;
    if (path.startsWith('http')) return path;
    final serverUrl = baseUrl.replaceAll('/api', '');
    if (path.startsWith('/')) {
      return '$serverUrl$path';
    }
    return '$serverUrl/$path';
  }
}


