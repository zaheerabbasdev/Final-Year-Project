import 'package:flutter/foundation.dart';
import '../api_client.dart';

class HandshakeService extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  Future<String?> generateToken(int bookingId) async {
    try {
      _isLoading = true;
      notifyListeners();

      final response = await _apiClient.dio.post(
        '/bookings/$bookingId/handshake/generate',
      );

      return response.data['token'];
    } catch (e) {
      debugPrint('Error generating handshake token: $e');
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> verifyToken(int bookingId, String handshakeToken) async {
    try {
      _isLoading = true;
      notifyListeners();

      await _apiClient.dio.post(
        '/bookings/$bookingId/handshake/verify',
        data: {'token': handshakeToken},
      );

      return true;
    } catch (e) {
      debugPrint('Error verifying handshake token: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
