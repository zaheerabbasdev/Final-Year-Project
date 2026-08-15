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
    defaultValue: 'http://academy-dev-alb-1643057327.ap-south-1.elb.amazonaws.com/api',
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
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
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
          final message = e.response?.data['message'] ?? 'Your account has been suspended.';
          
          // Only show automatic toast if it's NOT a login attempt.
          // LoginScreen handles its own error messages.
          final isLogin = e.requestOptions.extra['isLogin'] == true;
          if (!isLogin) {
            Fluttertoast.showToast(
              msg: message,
              backgroundColor: Colors.red,
              textColor: Colors.white,
              gravity: ToastGravity.TOP,
              timeInSecForIosWeb: 5,
            );
          }
          
          if (onUnauthorized != null) {
            onUnauthorized!();
          }
        } else if (e.response?.statusCode == 401) {
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


