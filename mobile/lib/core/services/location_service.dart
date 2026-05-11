import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart' show debugPrint;
import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart' as geocoding;
import 'package:google_maps_flutter/google_maps_flutter.dart';

/// All geocoding goes through our own backend proxy at /api/geocode
/// This completely avoids CORS issues on Chrome/web.
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
    // 1) Try backend proxy (works on web + native, no CORS)
    try {
      final response = await _dio.get(
        '$_kGeoProxyBase/reverse',
        queryParameters: {'lat': lat, 'lon': lng},
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        // display_name contains the full detailed address exactly as the user requested
        final displayName = data['display_name'] as String?;
        if (displayName != null && displayName.isNotEmpty) return displayName;
      }
    } catch (e) {
      debugPrint('Backend reverse geocode error: $e');
    }

    // 2) Native-only fallback: platform geocoder
    if (!kIsWeb) {
      try {
        final placemarks = await geocoding.placemarkFromCoordinates(lat, lng);
        if (placemarks.isNotEmpty) {
          final p = placemarks[0];
          final parts = <String>[];
          if ((p.street ?? '').isNotEmpty) parts.add(p.street!);
          if ((p.subLocality ?? '').isNotEmpty) parts.add(p.subLocality!);
          if ((p.locality ?? '').isNotEmpty) parts.add(p.locality!);
          if ((p.administrativeArea ?? '').isNotEmpty) parts.add(p.administrativeArea!);
          if ((p.country ?? '').isNotEmpty) parts.add(p.country!);
          final seen = <String>{};
          final unique = parts.where((e) => e.isNotEmpty && seen.add(e)).toList();
          if (unique.isNotEmpty) return unique.join(', ');
        }
      } catch (e) {
        debugPrint('Platform reverse geocode error: $e');
      }
    }

    // Last resort: show coordinates
    return '${lat.toStringAsFixed(5)}, ${lng.toStringAsFixed(5)}';
  }

  // ─── Forward geocode: text query → LatLng ─────────────────────────────────
  Future<LatLng?> searchLocation(String query) async {
    // 1) Try backend proxy (works on web + native, no CORS)
    try {
      final response = await _dio.get(
        '$_kGeoProxyBase/search',
        queryParameters: {'q': query, 'limit': 1},
      );

      if (response.statusCode == 200 && response.data != null) {
        final results = response.data as List<dynamic>;
        if (results.isNotEmpty) {
          final first = results[0] as Map<String, dynamic>;
          final lat = double.tryParse(first['lat'].toString());
          final lng = double.tryParse(first['lon'].toString());
          if (lat != null && lng != null) {
            debugPrint('Geocode found: $lat, $lng for "$query"');
            return LatLng(lat, lng);
          }
        }
      }
    } catch (e) {
      debugPrint('Backend search error: $e');
    }

    // 2) Native-only fallback: platform geocoder
    if (!kIsWeb) {
      try {
        final locations = await geocoding.locationFromAddress(query);
        if (locations.isNotEmpty) {
          return LatLng(locations[0].latitude, locations[0].longitude);
        }
      } catch (e) {
        debugPrint('Platform search error: $e');
      }
    }

    return null;
  }
}
