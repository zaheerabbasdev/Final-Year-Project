import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class ProviderService extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _topProviders = [];
  List<dynamic> _searchResults = [];
  Map<String, dynamic>? _dashboardStats;
  bool _isLoading = false;
  bool _isOnline = false;

  List<dynamic> get topProviders => _topProviders;
  List<dynamic> get searchResults => _searchResults;
  Map<String, dynamic>? get dashboardStats => _dashboardStats;
  bool get isLoading => _isLoading;
  bool get isOnline => _isOnline;

  Future<void> fetchTopProviders() async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiClient.dio.get('/users/providers/top');
      _topProviders = response.data;
    } catch (e) {
      print('Error fetching top providers: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchDashboardStats() async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiClient.dio.get('/users/me');
      if (response.data != null && response.data['profile'] != null) {
        _dashboardStats = response.data['profile'];
        _isOnline = _dashboardStats?['is_online'] == true || _dashboardStats?['is_online'] == 1 || _dashboardStats?['is_online'] == 'true';
      }
    } catch (e) {
      print('Error fetching dashboard stats: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> toggleOnlineStatus(bool online) async {
    try {
      final response = await _apiClient.dio.patch('/users/me/online-status', data: {'is_online': online});
      if (response.statusCode == 200) {
        _isOnline = online;
        if (_dashboardStats != null) {
          _dashboardStats!['is_online'] = online;
        }
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      print('Error toggling online status: $e');
      return false;
    }
  }

  Future<void> searchProviders(String query) async {
    if (query.isEmpty) {
      _searchResults = [];
      notifyListeners();
      return;
    }
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiClient.dio.get('/users/providers', queryParameters: {'search': query});
      _searchResults = response.data;
    } catch (e) {
      print('Error searching providers: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>?> getUserById(int id) async {
    try {
      final response = await _apiClient.dio.get('/users/$id');
      return response.data;
    } catch (e) {
      print('Error fetching user by ID: $e');
      return null;
    }
  }
}
