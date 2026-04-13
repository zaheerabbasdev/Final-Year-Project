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

  @override
  void initState() {
    super.initState();
    _pickedLocation = widget.initialLocation;
  }

  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
    if (_pickedLocation == null) {
      _getUserLocation();
    }
  }

  Future<void> _getUserLocation() async {
    try {
      final position = await _locationService.getCurrentLocation();
      if (position != null) {
        final newLoc = LatLng(position.latitude, position.longitude);
        setState(() => _pickedLocation = newLoc);
        _mapController?.animateCamera(CameraUpdate.newLatLngZoom(newLoc, 15));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pick Location'),
        actions: [
          if (_pickedLocation != null)
            IconButton(
              icon: const Icon(Icons.check),
              onPressed: () => Navigator.pop(context, _pickedLocation),
            ),
        ],
      ),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: _pickedLocation ?? const LatLng(33.6844, 73.0479), // Default to Islamabad
              zoom: 12,
            ),
            onMapCreated: _onMapCreated,
            onTap: (latLng) => setState(() => _pickedLocation = latLng),
            markers: _pickedLocation == null
                ? {}
                : {
                    Marker(
                      markerId: const MarkerId('picked'),
                      position: _pickedLocation!,
                    ),
                  },
          ),
          Positioned(
            bottom: 24,
            left: 24,
            right: 24,
            child: ElevatedButton.icon(
              onPressed: _getUserLocation,
              icon: const Icon(Icons.my_location),
              label: const Text('Use Current Location'),
            ),
          ),
        ],
      ),
    );
  }
}
