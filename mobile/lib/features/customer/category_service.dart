import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class CategoryService extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _categories = [];
  bool _isLoading = false;

  List<dynamic> get categories => _categories;
  bool get isLoading => _isLoading;

  Future<void> fetchCategories() async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiClient.dio.get('/categories');
      _categories = response.data;
    } catch (e) {
      print(e);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
