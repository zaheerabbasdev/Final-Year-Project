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

  /// Returns the booking with [bookingId] from the current user's booking list.
  /// Used by the provider's QR screen to poll for status changes (confirmed →
  /// in_progress) after the customer scans the QR code.
  Future<Map<String, dynamic>?> getBookingById(int bookingId) async {
    try {
      final response = await _apiClient.dio.get('/bookings/my');
      if (response.data is List) {
        for (final item in response.data as List) {
          final b = item as Map<String, dynamic>;
          final rawId = b['id'];
          if (rawId == bookingId ||
              rawId?.toString() == bookingId.toString()) {
            return b;
          }
        }
      }
      return null;
    } catch (e) {
      print('Error fetching booking by id: $e');
      return null;
    }
  }

  Future<bool> cancelBooking(int bookingId) async {
    try {
      final response = await _apiClient.dio.put('/bookings/$bookingId/cancel');
      if (response.statusCode == 200) {
        await fetchBookings();
        return true;
      }
    } catch (e) {
      print('Error cancelling booking: $e');
    }
    return false;
  }
}
