import 'package:flutter/material.dart';
import '../../../core/api_client.dart';

class BookingService extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _bookings = [];
  bool _isLoading = false;

  List<dynamic> get bookings => _bookings;
  bool get isLoading => _isLoading;

  Future<void> fetchBookings() async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiClient.dio.get('/bookings');
      _bookings = response.data;
    } catch (e) {
      print('Error fetching bookings: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateBookingStatus(int id, String status) async {
    try {
      final response = await _apiClient.dio.put('/bookings/$id', data: {
        'status': status,
      });
      if (response.statusCode == 200) {
        await fetchBookings();
        return true;
      }
    } catch (e) {
      print('Error updating booking status: $e');
    }
    return false;
  }

  Future<bool> markJobCompletedOrAwaiting(int jobId, String status) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiClient.dio.put('/bookings/job/$jobId/status', data: {
        'status': status,
      });
      return response.statusCode == 200;
    } catch (e) {
      print('Error updating booking status by job: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>?> getBookingByJobId(int jobId) async {
    try {
      final response = await _apiClient.dio.get('/bookings/job/$jobId');
      return response.data;
    } catch (e) {
      print('Error fetching booking by job: $e');
      return null;
    }
  }
}
