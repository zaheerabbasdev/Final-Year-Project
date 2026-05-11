import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../core/services/location_service.dart';

class MapPickerScreen extends StatefulWidget {
  final LatLng? initialLocation;
  const MapPickerScreen({super.key, this.initialLocation});

  @override
  State<MapPickerScreen> createState() => _MapPickerScreenState();
}

class _MapPickerScreenState extends State<MapPickerScreen> {
  LatLng? _pickedLocation;
  GoogleMapController? _mapController;
  final LocationService _locationService = LocationService();

  String? _currentAddress;
  bool _isLoadingAddress = false;
  bool _isLoadingCurrentLocation = false;
  MapType _currentMapType = MapType.normal;

  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _pickedLocation = widget.initialLocation;
    if (_pickedLocation != null) {
      _fetchAddress(_pickedLocation!.latitude, _pickedLocation!.longitude);
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _mapController?.dispose();
    super.dispose();
  }

  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
    if (_pickedLocation == null) {
      _getUserLocation();
    }
  }

  Future<void> _fetchAddress(double lat, double lng) async {
    setState(() => _isLoadingAddress = true);
    final address = await _locationService.getAddressFromLatLng(lat, lng);
    if (mounted) {
      setState(() {
        _currentAddress = address ?? '$lat, $lng';
        _isLoadingAddress = false;
      });
    }
  }

  Future<void> _getUserLocation() async {
    setState(() => _isLoadingCurrentLocation = true);
    try {
      final position = await _locationService.getCurrentLocation();
      if (position != null && mounted) {
        final newLoc = LatLng(position.latitude, position.longitude);
        setState(() => _pickedLocation = newLoc);
        _mapController?.animateCamera(CameraUpdate.newLatLngZoom(newLoc, 15));
        await _fetchAddress(newLoc.latitude, newLoc.longitude);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: Colors.red.shade600,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoadingCurrentLocation = false);
    }
  }

  Future<void> _onMapTapped(LatLng latLng) async {
    setState(() => _pickedLocation = latLng);
    _mapController?.animateCamera(CameraUpdate.newLatLng(latLng));
    await _fetchAddress(latLng.latitude, latLng.longitude);
  }

  Future<void> _searchLocation() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) return;

    setState(() => _isSearching = true);
    FocusScope.of(context).unfocus();

    try {
      final result = await _locationService.searchLocation(query);
      if (result != null && mounted) {
        setState(() => _pickedLocation = result);
        _mapController?.animateCamera(CameraUpdate.newLatLngZoom(result, 15));
        await _fetchAddress(result.latitude, result.longitude);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Location not found. Try a different search term.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Search failed: ${e.toString()}'),
            backgroundColor: Colors.red.shade600,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSearching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1E293B)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Select Location',
          style: TextStyle(
            color: Color(0xFF1E293B),
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // ─── Search Bar ───────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF6366F1), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: TextField(
                controller: _searchController,
                onSubmitted: (_) => _searchLocation(),
                decoration: InputDecoration(
                  hintText: 'Search',
                  hintStyle: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 15,
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  suffixIcon: _isSearching
                      ? const Padding(
                          padding: EdgeInsets.all(12),
                          child: SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        )
                      : IconButton(
                          icon: const Icon(
                            Icons.search,
                            color: Color(0xFF64748B),
                          ),
                          onPressed: _searchLocation,
                        ),
                ),
              ),
            ),
          ),

          // ─── Use Current Location Link ────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
            child: Row(
              children: [
                GestureDetector(
                  onTap: _isLoadingCurrentLocation ? null : _getUserLocation,
                  child: Row(
                    children: [
                      _isLoadingCurrentLocation
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF6366F1)),
                            )
                          : const Icon(
                              Icons.my_location,
                              size: 16,
                              color: Color(0xFF6366F1),
                            ),
                      const SizedBox(width: 6),
                      const Text(
                        'Use Current Location',
                        style: TextStyle(
                          color: Color(0xFF6366F1),
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ─── Address Display ──────────────────────────────────────
          if (_pickedLocation != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Address: ',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  Expanded(
                    child: _isLoadingAddress
                        ? const Padding(
                            padding: EdgeInsets.only(top: 2),
                            child: SizedBox(
                              height: 14,
                              width: 14,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          )
                        : Text(
                            _currentAddress ?? '${_pickedLocation!.latitude.toStringAsFixed(5)}, ${_pickedLocation!.longitude.toStringAsFixed(5)}',
                            style: const TextStyle(
                              fontSize: 14,
                              color: Color(0xFF475569),
                              height: 1.4,
                            ),
                          ),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 10),

          // ─── Map View ─────────────────────────────────────────────
          Expanded(
            child: Stack(
              children: [
                GoogleMap(
                  initialCameraPosition: CameraPosition(
                    target: _pickedLocation ?? const LatLng(33.6844, 73.0479),
                    zoom: _pickedLocation != null ? 15 : 12,
                  ),
                  mapType: _currentMapType,
                  onMapCreated: _onMapCreated,
                  onTap: _onMapTapped,
                  markers: _pickedLocation == null
                      ? {}
                      : {
                          Marker(
                            markerId: const MarkerId('picked'),
                            position: _pickedLocation!,
                            infoWindow: InfoWindow(
                              title: _currentAddress ?? 'Selected Location',
                            ),
                          ),
                        },
                  myLocationButtonEnabled: false,
                  zoomControlsEnabled: false,
                ),

                // ─── Map / Satellite Toggle ───────────────────────
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.12),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        _buildMapTypeButton('Map', MapType.normal),
                        _buildMapTypeButton('Satellite', MapType.satellite),
                      ],
                    ),
                  ),
                ),

                // ─── Expand icon (decorative) ─────────────────────
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.12),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.fullscreen,
                      size: 20,
                      color: Color(0xFF475569),
                    ),
                  ),
                ),

                // ─── My Location Button (bottom-left) ────────────
                Positioned(
                  bottom: 96,
                  left: 16,
                  child: GestureDetector(
                    onTap: _isLoadingCurrentLocation ? null : _getUserLocation,
                    child: Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.15),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: _isLoadingCurrentLocation
                          ? const Padding(
                              padding: EdgeInsets.all(12),
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(
                              Icons.my_location,
                              color: Color(0xFF475569),
                              size: 24,
                            ),
                    ),
                  ),
                ),

                // ─── Confirm FAB (bottom-right) ───────────────────
                Positioned(
                  bottom: 24,
                  right: 16,
                  child: GestureDetector(
                    onTap: _pickedLocation != null
                        ? () => Navigator.pop(context, _pickedLocation)
                        : null,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: _pickedLocation != null
                            ? const Color(0xFF6366F1)
                            : const Color(0xFFCBD5E1),
                        shape: BoxShape.circle,
                        boxShadow: _pickedLocation != null
                            ? [
                                BoxShadow(
                                  color: const Color(0xFF6366F1).withValues(alpha: 0.4),
                                  blurRadius: 16,
                                  offset: const Offset(0, 6),
                                ),
                              ]
                            : [],
                      ),
                      child: const Icon(
                        Icons.done_all,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMapTypeButton(String label, MapType type) {
    final bool isActive = _currentMapType == type;
    return GestureDetector(
      onTap: () => setState(() => _currentMapType = type),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? Colors.white : const Color(0xFF64748B),
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}
