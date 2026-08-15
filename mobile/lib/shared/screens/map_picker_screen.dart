import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../../core/providers/language_provider.dart';
import '../../core/services/location_service.dart';
import '../../core/theme.dart';

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
  List<Map<String, dynamic>> _suggestions = [];
  Timer? _debounce;
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _pickedLocation = widget.initialLocation;
    if (_pickedLocation != null) {
      _fetchAddress(_pickedLocation!.latitude, _pickedLocation!.longitude);
    }
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    _mapController?.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged() {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      if (_searchController.text.isNotEmpty) {
        _getAutocomplete(_searchController.text);
      } else {
        setState(() => _suggestions = []);
      }
    });
  }

  Future<void> _getAutocomplete(String input) async {
    final results = await _locationService.getAutocomplete(input);
    if (mounted) {
      setState(() => _suggestions = results);
    }
  }

  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
    if (_pickedLocation == null) {
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) _getUserLocation();
      });
    }
  }

  Future<void> _fetchAddress(double lat, double lng) async {
    setState(() => _isLoadingAddress = true);
    final address = await _locationService.getAddressFromLatLng(lat, lng);
    if (mounted) {
      setState(() {
        _currentAddress = address;
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
        setState(() {
          _pickedLocation = newLoc;
          _suggestions = [];
        });
        _mapController?.animateCamera(CameraUpdate.newLatLngZoom(newLoc, 15));
        await _fetchAddress(newLoc.latitude, newLoc.longitude);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: Colors.red.shade600,
            behavior: SnackBarBehavior.floating,
            action: SnackBarAction(
              label: context.read<LanguageProvider>().t('mapPicker.retry'),
              textColor: Colors.white,
              onPressed: _getUserLocation,
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoadingCurrentLocation = false);
    }
  }

  Future<void> _onMapTapped(LatLng latLng) async {
    setState(() {
      _pickedLocation = latLng;
      _suggestions = [];
    });
    _mapController?.animateCamera(CameraUpdate.newLatLng(latLng));
    await _fetchAddress(latLng.latitude, latLng.longitude);
  }

  Future<void> _selectSuggestion(Map<String, dynamic> suggestion) async {
    final description = suggestion['description'] as String;
    final lat = double.tryParse(suggestion['lat']?.toString() ?? '');
    final lng = double.tryParse(suggestion['lng']?.toString() ?? '');
    
    _searchController.text = description;
    setState(() {
      _suggestions = [];
    });
    FocusScope.of(context).unfocus();

    if (lat != null && lng != null) {
      final newLoc = LatLng(lat, lng);
      setState(() => _pickedLocation = newLoc);
      _mapController?.animateCamera(CameraUpdate.newLatLngZoom(newLoc, 15));
      await _fetchAddress(lat, lng);
    } else {
      // Fallback if coordinates are missing
      setState(() => _isSearching = true);
      try {
        final result = await _locationService.searchLocation(description);
        if (result != null && mounted) {
          setState(() => _pickedLocation = result);
          _mapController?.animateCamera(CameraUpdate.newLatLngZoom(result, 15));
          await _fetchAddress(result.latitude, result.longitude);
        }
      } finally {
        if (mounted) setState(() => _isSearching = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).appColors;
    final lang = context.watch<LanguageProvider>();
    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.surface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: colors.text),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          lang.t('mapPicker.title'),
          style: TextStyle(
            color: colors.text,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          Column(
            children: [
              // ─── Search Bar ───────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Container(
                  decoration: BoxDecoration(
                    color: colors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF6366F1), width: 1.5),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: lang.t('mapPicker.searchHint'),
                      hintStyle: TextStyle(
                        color: colors.subtext,
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
                          : const Icon(
                              Icons.search,
                              color: Color(0xFF64748B),
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
                          Text(
                            lang.t('mapPicker.useCurrentLocation'),
                            style: const TextStyle(
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
                      Text(
                        lang.t('mapPicker.addressLabel'),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          color: colors.text,
                        ),
                      ),
                      Expanded(
                        child: Text(
                          _isLoadingAddress
                              ? lang.t('mapPicker.fetchingAddress')
                              : (_currentAddress ?? lang.t('mapPicker.determiningLocation')),
                          style: TextStyle(
                            fontSize: 14,
                            color: colors.text,
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
                          color: colors.surface,
                          borderRadius: BorderRadius.circular(8),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.12),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            _buildMapTypeButton(lang.t('mapPicker.mapView'), MapType.normal),
                            _buildMapTypeButton(lang.t('mapPicker.satellite'), MapType.satellite),
                          ],
                        ),
                      ),
                    ),

                    // ─── My Location Button ────────────
                    Positioned(
                      // Lift above the nav bar + extra breathing room
                      bottom: MediaQuery.of(context).padding.bottom + 100,
                      left: 16,
                      child: GestureDetector(
                        onTap: _isLoadingCurrentLocation ? null : _getUserLocation,
                        child: Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            color: colors.surface,
                            shape: BoxShape.circle,
                            border: Border.all(color: colors.border, width: 1),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.25),
                                blurRadius: 8,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: _isLoadingCurrentLocation
                              ? Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: AppTheme.secondaryColor,
                                  ),
                                )
                              : Icon(
                                  Icons.my_location,
                                  // Theme-aware so icon is visible in dark mode
                                  color: colors.text,
                                  size: 26,
                                ),
                        ),
                      ),
                    ),

                    // ─── Confirm Button ───────────────────
                    Positioned(
                      // Lift above the nav bar
                      bottom: MediaQuery.of(context).padding.bottom + 32,
                      right: 16,
                      child: GestureDetector(
                        onTap: _pickedLocation != null
                            ? () => Navigator.pop(context, _pickedLocation)
                            : null,
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            color: _pickedLocation != null
                                ? AppTheme.secondaryColor
                                : colors.border,
                            shape: BoxShape.circle,
                            boxShadow: _pickedLocation != null
                                ? [
                                    BoxShadow(
                                      color: AppTheme.secondaryColor.withOpacity(0.4),
                                      blurRadius: 16,
                                      offset: const Offset(0, 6),
                                    ),
                                  ]
                                : [],
                          ),
                          child: const Icon(
                            Icons.done_all,
                            color: Colors.white,
                            size: 30,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          // ─── Autocomplete Suggestions Overlay ─────────────────────
          if (_suggestions.isNotEmpty)
            Positioned(
              top: 65, // Below search bar
              left: 16,
              right: 16,
              child: Container(
                constraints: const BoxConstraints(maxHeight: 300),
                decoration: BoxDecoration(
                  color: colors.surface,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.15),
                      blurRadius: 15,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: ListView.separated(
                  shrinkWrap: true,
                  padding: EdgeInsets.zero,
                  itemCount: _suggestions.length,
                  separatorBuilder: (context, index) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final suggestion = _suggestions[index];
                    return ListTile(
                      leading: const Icon(Icons.place, color: Color(0xFF64748B)),
                      title: Text(
                        suggestion['description'],
                        style: const TextStyle(fontSize: 14),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      onTap: () => _selectSuggestion(suggestion),
                    );
                  },
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMapTypeButton(String label, MapType type) {
    final bool isActive = _currentMapType == type;
    final colors = Theme.of(context).appColors;
    return GestureDetector(
      onTap: () => setState(() => _currentMapType = type),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? AppTheme.secondaryColor : colors.surface,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? Colors.white : colors.text,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}
