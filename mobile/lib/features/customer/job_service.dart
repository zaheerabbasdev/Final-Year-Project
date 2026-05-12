import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/api_client.dart';

class JobService extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _jobs = [];
  bool _isLoading = false;

  List<dynamic> _providerBids = [];

  List<dynamic> get jobs => _jobs;
  List<dynamic> get providerBids => _providerBids;
  bool get isLoading => _isLoading;

  Future<void> fetchJobs({Map<String, dynamic>? filters}) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiClient.dio.get('/jobs', queryParameters: filters);
      print('DEBUG: Jobs from API: ${response.data}'); // THIS WILL SHOW US THE DATA
      _jobs = response.data;
    } catch (e) {
      print(e);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createJob(Map<String, dynamic> jobData, List<XFile> images) async {
    try {
      final Map<String, dynamic> formDataMap = Map.from(jobData);
      
      // Remove nulls/empty strings but KEEP boolean values like is_negotiable
      formDataMap.removeWhere((key, value) => value == null || value == '');
      
      if (images.isNotEmpty) {
        final List<MultipartFile> imageFiles = [];
        for (var image in images) {
          final bytes = await image.readAsBytes();
          imageFiles.add(MultipartFile.fromBytes(bytes, filename: image.name));
        }
        formDataMap['images'] = imageFiles;
      }

      final formData = FormData.fromMap(formDataMap);
      final response = await _apiClient.dio.post('/jobs', data: formData);
      if (response.statusCode == 201) {
        await fetchJobs(); // Refresh the list so the new job shows up
        return true;
      }
      return false;
    } catch (e) {
      print('Error creating job: $e');
      return false;
    }
  }


  Future<Map<String, dynamic>?> getJobById(int id) async {
    try {
      final response = await _apiClient.dio.get('/jobs/$id');
      return response.data;
    } catch (e) {
      print(e);
      return null;
    }
  }

  Future<List<dynamic>> fetchJobBids(int jobId) async {
    try {
      final response = await _apiClient.dio.get('/bids/job/$jobId');
      return response.data;
    } catch (e) {
      print('Error fetching job bids: $e');
      return [];
    }
  }

  Future<bool> acceptBid(int bidId) async {
    try {
      final response = await _apiClient.dio.put('/bids/$bidId/accept');
      if (response.statusCode == 200) {
        await fetchJobs();
        return true;
      }
    } catch (e) {
      print('Error accepting bid: $e');
    }
    return false;
  }
  Future<void> fetchProviderBids() async {
    try {
      final response = await _apiClient.dio.get('/bids/my/bids');
      _providerBids = response.data;
      notifyListeners();
    } catch (e) {
      print('Error fetching provider bids: $e');
    }
  }

  Future<bool> createBid(Map<String, dynamic> bidData) async {
    try {
      final response = await _apiClient.dio.post('/bids', data: bidData);
      if (response.statusCode == 201) {
        await fetchProviderBids();
        return true;
      }
      return false;
    } catch (e) {
      print('Error creating bid: $e');
      return false;
    }
  }
}
