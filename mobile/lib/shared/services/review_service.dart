import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class ReviewService extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  Future<bool> submitReview({
    required int bookingId,
    required int jobId,
    required int providerId,
    required int rating,
    required String comment,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiClient.dio.post('/reviews', data: {
        'booking_id': bookingId,
        'job_id': jobId,
        'provider_id': providerId,
        'rating': rating,
        'comment': comment,
      });

      return response.statusCode == 201;
    } catch (e) {
      print('Error submitting review: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<List<dynamic>> fetchProviderReviews(int providerId, {int? limit, int? offset}) async {
    try {
      final response = await _apiClient.dio.get(
        '/reviews/provider/$providerId',
        queryParameters: {
          if (limit != null) 'limit': limit,
          if (offset != null) 'offset': offset,
        },
      );
      return response.data;
    } catch (e) {
      print('Error fetching provider reviews: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>?> fetchBookingReview(int bookingId) async {
    try {
      final response = await _apiClient.dio.get('/reviews/booking/$bookingId');
      return response.data;
    } catch (e) {
      // 404 is expected if not reviewed yet
      return null;
    }
  }
}
