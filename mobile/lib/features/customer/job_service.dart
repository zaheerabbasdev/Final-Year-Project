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
      Response response;
      if (filters != null && filters['recommended'] == true) {
        final cleanFilters = Map<String, dynamic>.from(filters)..remove('recommended');
        try {
          response = await _apiClient.dio.get('/ai/matching-jobs', queryParameters: cleanFilters);
        } catch (_) {
          // AI endpoint failed — fall back to standard job listing
          final fallbackFilters = Map<String, dynamic>.from(cleanFilters);
          fallbackFilters['status'] = 'open';
          response = await _apiClient.dio.get('/jobs', queryParameters: fallbackFilters);
        }
      } else {
        response = await _apiClient.dio.get('/jobs', queryParameters: filters);
      }
      _jobs = response.data is List ? response.data : [];
    } catch (e) {
      _jobs = [];
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
      return false;
    }
  }


  Future<Map<String, dynamic>?> getJobById(int id) async {
    try {
      final response = await _apiClient.dio.get('/jobs/$id');
      return response.data;
    } catch (e) {
      debugPrint(e.toString());
      return null;
    }
  }

  Future<List<dynamic>> fetchJobBids(int jobId) async {
    try {
      final response = await _apiClient.dio.get('/bids/job/$jobId');
      return response.data;
    } catch (e) {
      debugPrint('Error fetching job bids: $e');
      return [];
    }
  }

  /// Accepts a bid.  Returns a map with:
  ///   {'success': true}  — on success
  ///   {'success': false, 'message': String}  — on failure (passes back the
  ///     server's error message so the UI can distinguish balance errors from
  ///     other failures).
  Future<Map<String, dynamic>> acceptBid(int bidId) async {
    try {
      final response = await _apiClient.dio.put('/bids/$bidId/accept');
      if (response.statusCode == 200) {
        await fetchJobs();
        return {'success': true};
      }
      final msg = response.data is Map ? response.data['message'] as String? : null;
      return {'success': false, 'message': msg ?? 'Failed to accept bid'};
    } on DioException catch (e) {
      final msg = e.response?.data is Map
          ? e.response!.data['message'] as String?
          : null;
      debugPrint('Error accepting bid: $e');
      return {'success': false, 'message': msg ?? 'Failed to accept bid'};
    } catch (e) {
      debugPrint('Error accepting bid: $e');
      return {'success': false, 'message': 'An error occurred. Please try again.'};
    }
  }
  Future<void> fetchProviderBids() async {
    try {
      final response = await _apiClient.dio.get('/bids/my/bids');
      _providerBids = response.data;
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching provider bids: $e');
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
      debugPrint('Error creating bid: $e');
      return false;
    }
  }

  Future<bool> expressAccept(int jobId) async {
    try {
      final response = await _apiClient.dio.post('/jobs/$jobId/express-accept');
      if (response.statusCode == 200) {
        await fetchJobs();
        return true;
      }
    } catch (e) {
      debugPrint('Error in express hire: $e');
    }
    return false;
  }

  Future<Map<String, dynamic>?> getSuggestedBidPrice(int jobId) async {
    try {
      final response = await _apiClient.dio.get('/ai/suggest-bid/$jobId');
      return response.data;
    } catch (e) {
      debugPrint('Error fetching suggested bid price: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> getAutocompleteSuggestions(String partialText) async {
    try {
      final response = await _apiClient.dio.post('/ai/autocomplete', data: {
        'partialDescription': partialText,
      });
      return response.data;
    } catch (e) {
      debugPrint('Error getting autocomplete suggestion: $e');
      return null;
    }
  }

  Future<bool> cancelJob(int jobId) async {
    try {
      final response = await _apiClient.dio.put('/jobs/$jobId', data: {'status': 'cancelled'});
      if (response.statusCode == 200) {
        await fetchJobs();
        return true;
      }
    } catch (e) {
      debugPrint('Error cancelling job: $e');
    }
    return false;
  }
}
