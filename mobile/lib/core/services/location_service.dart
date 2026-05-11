import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart' show debugPrint;
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class LocationService {
  // ─── Get current GPS position ───────────────────────────────────────────────
  Future<Position?> getCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return Future.error('Location services are disabled.');
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return Future.error('Location permissions are denied.');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return Future.error(
          'Location permissions are permanently denied. Please enable them in your phone settings.');
    }

    return await Geolocator.getCurrentPosition();
  }

  // ─── Reverse geocode lat/lng → human-readable address ───────────────────────
  Future<String?> getAddressFromLatLng(double lat, double lng) async {
    if (kIsWeb) {
      // geocoding package doesn't support web; return coordinate string instead
      return '${lat.toStringAsFixed(5)}, ${lng.toStringAsFixed(5)}';
    }

    try {
      final List<Placemark> placemarks =
          await placemarkFromCoordinates(lat, lng);

      if (placemarks.isNotEmpty) {
        final Placemark p = placemarks[0];

        // Build a rich address similar to the reference image
        final List<String> parts = [];

        // Plus code / sub-locality / street
        if ((p.street ?? '').isNotEmpty) parts.add(p.street!);
        if ((p.subLocality ?? '').isNotEmpty) parts.add(p.subLocality!);
        if ((p.locality ?? '').isNotEmpty) parts.add(p.locality!);
        if ((p.subAdministrativeArea ?? '').isNotEmpty) {
          parts.add(p.subAdministrativeArea!);
        }
        if ((p.administrativeArea ?? '').isNotEmpty) {
          parts.add(p.administrativeArea!);
        }
        if ((p.country ?? '').isNotEmpty) parts.add(p.country!);
        if ((p.isoCountryCode ?? '').isNotEmpty) parts.add(p.isoCountryCode!);

        // Remove duplicates while preserving order
        final seen = <String>{};
        final unique =
            parts.where((e) => e.isNotEmpty && seen.add(e)).toList();

        if (unique.isNotEmpty) return unique.join(', ');
      }
    } catch (e) {
      debugPrint('Geocoding error: $e');
    }

    return null;
  }

  // ─── Forward geocode: text query → LatLng ───────────────────────────────────
  Future<LatLng?> searchLocation(String query) async {
    if (kIsWeb) return null; // geocoding not supported on web

    try {
      final List<Location> locations = await locationFromAddress(query);
      if (locations.isNotEmpty) {
        return LatLng(locations[0].latitude, locations[0].longitude);
      }
    } catch (e) {
      debugPrint('Search location error: $e');
    }

    return null;
  }
}
