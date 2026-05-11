import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart' show debugPrint;
import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

/// All geocoding goes through our own backend proxy at /api/geocode
/// Now using Google Maps Platform APIs for 100% Google Maps functionality.
const _kGeoProxyBase = 'http://localhost:5000/api/geocode';

class LocationService {
  final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
    headers: {'Accept': 'application/json'},
  ));

  // ─── Get current GPS position ─────────────────────────────────────────────
  Future<Position?> getCurrentLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return Future.error('Location services are disabled.');
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied) {
      return Future.error(
          'Location permission was denied. Please allow location access in your browser and try again.');
    }

    if (permission == LocationPermission.deniedForever) {
      return Future.error(
          'Location permission is permanently denied. Please enable it in your browser/phone settings.');
    }

    return await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 30),
      ),
    );
  }

  // ─── Reverse geocode: lat/lng → human-readable address ────────────────────
  Future<String?> getAddressFromLatLng(double lat, double lng) async {
    try {
      final response = await _dio.get(
        '$_kGeoProxyBase/reverse',
        queryParameters: {'lat': lat, 'lon': lng},
      );

      if (response.statusCode == 200 && response.data != null) {
        return response.data['display_name'] as String?;
      }
    } catch (e) {
      debugPrint('Google Reverse Geocode error: $e');
    }
    return '${lat.toStringAsFixed(5)}, ${lng.toStringAsFixed(5)}';
  }

  // ─── Forward geocode: text query → LatLng ─────────────────────────────────
  Future<LatLng?> searchLocation(String query) async {
    try {
      final response = await _dio.get(
        '$_kGeoProxyBase/search',
        queryParameters: {'q': query},
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        final lat = double.tryParse(data['lat'].toString());
        final lng = double.tryParse(data['lng'].toString());
        if (lat != null && lng != null) {
          return LatLng(lat, lng);
        }
      }
    } catch (e) {
      debugPrint('Google Search error: $e');
    }
    return null;
  }

  // ─── Autocomplete suggestions as user types ───────────────────────────────
  Future<List<Map<String, dynamic>>> getAutocomplete(String input) async {
    if (input.isEmpty) return [];
    try {
      final response = await _dio.get(
        '$_kGeoProxyBase/autocomplete',
        queryParameters: {'input': input},
      );

      if (response.statusCode == 200 && response.data != null) {
        final results = response.data as List<dynamic>;
        return results.map((e) => e as Map<String, dynamic>).toList();
      }
    } catch (e) {
      debugPrint('Google Autocomplete error: $e');
    }
    return [];
  }
}
