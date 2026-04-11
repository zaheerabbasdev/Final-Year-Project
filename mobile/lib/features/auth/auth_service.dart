import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/api_client.dart';

class AuthService extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  bool _isAuthenticated = false;
  bool _isInitialized = false;
  String? _role;
  Map<String, dynamic>? _user;

  bool get isAuthenticated => _isAuthenticated;
  bool get isInitialized => _isInitialized;
  String? get role => _role;
  Map<String, dynamic>? get user => _user;

  Future<void> checkAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final role = prefs.getString('role');
    
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

  Future<bool> login(String email, String password) async {
    try {
      final response = await _apiClient.dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = response.data;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', data['token']);
        
        _isAuthenticated = true;
        _user = data['user'];
        _role = _user?['role'];
        await prefs.setString('role', _role ?? '');
        
        notifyListeners();
        return true;
      }
    } catch (e) {
      print(e);
    }
    return false;
  }

  Future<bool> register(Map<String, dynamic> userData) async {
    try {
      dynamic dataToSubmit;
      
      if (userData.containsKey('avatar') && userData['avatar'] != null) {
        // Multi-part form data if there's an avatar
        final formDataMap = Map<String, dynamic>.from(userData);
        final file = formDataMap.remove('avatar'); // Assuming it's a File or XFile
        
        final formData = FormData.fromMap(formDataMap);
        final fileBytes = await file.readAsBytes();
        final filename = file.name.contains('.') ? file.name : '${file.name}.jpg';
        formData.files.add(MapEntry(
          'avatar',
          MultipartFile.fromBytes(fileBytes, filename: filename),
        ));
        dataToSubmit = formData;
      } else {
        // Remove avatar key if null to avoid sending null
        userData.remove('avatar');
        dataToSubmit = userData;
      }

      final response = await _apiClient.dio.post('/auth/register', data: dataToSubmit);
      return response.statusCode == 201;
    } catch (e) {
      print(e);
    }
    return false;
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
