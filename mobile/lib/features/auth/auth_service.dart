import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/api_client.dart';

class AuthService extends ChangeNotifier {
  late final ApiClient _apiClient;

  AuthService() {
    _apiClient = ApiClient(onUnauthorized: logout);
  }
  bool _isAuthenticated = false;
  bool _isInitialized = false;
  bool _isFirstTime = true;
  String? _role;
  Map<String, dynamic>? _user;

  bool get isAuthenticated => _isAuthenticated;
  bool get isInitialized => _isInitialized;
  bool get isFirstTime => _isFirstTime;
  String? get role => _role;
  Map<String, dynamic>? get user => _user;

  Future<void> checkAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final role = prefs.getString('role');
    _isFirstTime = prefs.getBool('isFirstTime') ?? true;
    
    if (token != null) {
      _isAuthenticated = true;
      _role = role;
      _isInitialized = true;
      notifyListeners();
      
      try {
        final response = await _apiClient.dio.get('/users/me');
        if (response.statusCode == 200) {
          _user = response.data;
          _role = _user?['role'];
          await prefs.setString('role', _role ?? '');
          notifyListeners();
        }
      } catch (e) {
        // If token invalid, clear it
        if (e is DioException && e.response?.statusCode == 401) {
          await logout();
        }
      }
    } else {
      _isInitialized = true;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _apiClient.dio.post(
        '/auth/login', 
        data: {
          'email': email,
          'password': password,
        },
        options: Options(extra: {'isLogin': true}),
      );

      if (response.statusCode == 200) {
        final data = response.data;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', data['token']);
        
        _isAuthenticated = true;
        _user = data['user'];
        _role = _user?['role'];
        await prefs.setString('role', _role ?? '');
        
        notifyListeners();
        return {
          'success': true,
          'role': _role,
        };
      }
    } catch (e) {
      print(e);
      if (e is DioException) {
        return {
          'success': false,
          'message': e.response?.data['message'] ?? 'Login failed',
        };
      }
    }
    return {
      'success': false,
      'message': 'Login failed. Please check your connection.',
    };
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    try {
      dynamic dataToSubmit;
      
      if (userData.containsKey('avatar') || userData.containsKey('cnic') || userData.containsKey('certificates')) {
        // Multi-part form data if there are files
        final formDataMap = Map<String, dynamic>.from(userData);
        
        final avatar = formDataMap.remove('avatar');
        final cnic = formDataMap.remove('cnic');
        final certificates = formDataMap.remove('certificates');
        
        // Remove any other null values
        formDataMap.removeWhere((key, value) => value == null);
        
        final formData = FormData.fromMap(formDataMap);
        
        if (avatar != null && avatar is XFile) {
          final bytes = await avatar.readAsBytes();
          formData.files.add(MapEntry(
            'avatar',
            MultipartFile.fromBytes(bytes, filename: avatar.name.contains('.') ? avatar.name : '${avatar.name}.jpg'),
          ));
        }
        
        if (cnic != null && cnic is XFile) {
          final bytes = await cnic.readAsBytes();
          formData.files.add(MapEntry(
            'cnic',
            MultipartFile.fromBytes(bytes, filename: cnic.name.contains('.') ? cnic.name : '${cnic.name}.jpg'),
          ));
        }
        
        if (certificates != null && certificates is XFile) {
          final bytes = await certificates.readAsBytes();
          formData.files.add(MapEntry(
            'certificates',
            MultipartFile.fromBytes(bytes, filename: certificates.name.contains('.') ? certificates.name : '${certificates.name}.jpg'),
          ));
        }
        
        dataToSubmit = formData;
      } else {
        dataToSubmit = userData;
      }

      final response = await _apiClient.dio.post('/auth/register', data: dataToSubmit);
      return {
        'success': response.statusCode == 201,
        'requiresOTP': response.data['requiresOTP'] ?? false,
      };
    } catch (e) {
      print(e);
    }
    return {'success': false, 'requiresOTP': false};
  }

  Future<bool> verifyOTP(String email, String otp) async {
    try {
      final response = await _apiClient.dio.post('/auth/verify-otp', data: {
        'email': email,
        'otp': otp,
      });
      return response.statusCode == 200;
    } catch (e) {
      print(e);
      return false;
    }
  }

  Future<bool> updateAvatar(XFile file) async {
    try {
      print('DEBUG: Starting avatar upload for ${file.name}');
      final bytes = await file.readAsBytes();
      final formData = FormData.fromMap({
        'avatar': MultipartFile.fromBytes(bytes, filename: file.name),
      });

      final response = await _apiClient.dio.post('/users/me/avatar', data: formData);
      print('DEBUG: Upload response status: ${response.statusCode}');
      if (response.statusCode == 200) {
        print('DEBUG: New avatar URL from server: ${response.data['avatarUrl']}');
        await checkAuth();
        return true;
      }
    } catch (e) {
      if (e is DioException) {
        print('DEBUG: Avatar upload failed: ${e.response?.data ?? e.message}');
      } else {
        print('DEBUG: Avatar upload error: $e');
      }
    }
    return false;
  }

  Future<bool> updateProfile(Map<String, dynamic> profileData) async {
    try {
      final response = await _apiClient.dio.put('/users/me', data: profileData);
      if (response.statusCode == 200) {
        await checkAuth();
        return true;
      }
    } catch (e) {
      print('Error updating profile: $e');
    }
    return false;
  }

  Future<void> completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isFirstTime', false);
    _isFirstTime = false;
    notifyListeners();
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('role');
    _isAuthenticated = false;
    _role = null;
    _user = null;
    notifyListeners();
  }
}
