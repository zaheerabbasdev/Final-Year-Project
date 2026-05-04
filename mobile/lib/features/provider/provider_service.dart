import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class ProviderService extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _topProviders = [];
  List<dynamic> _searchResults = [];
  Map<String, dynamic>? _dashboardStats;
  bool _isLoading = false;

  List<dynamic> get topProviders => _topProviders;
  List<dynamic> get searchResults => _searchResults;
  Map<String, dynamic>? get dashboardStats => _dashboardStats;
  bool get isLoading => _isLoading;

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
      }
    } catch (e) {
      print('Error fetching dashboard stats: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
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

  Future<Map<String, dynamic>?> getProviderById(int id) async {
    try {
      final response = await _apiClient.dio.get('/users/providers/$id');
      return response.data;
    } catch (e) {
      print('Error fetching provider by ID: $e');
      return null;
    }
  }
}
