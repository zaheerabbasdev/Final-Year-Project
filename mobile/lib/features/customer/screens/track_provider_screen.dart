import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../../../core/services/socket_service.dart';

/// Customer-facing screen showing the provider's live GPS position on a map.
class TrackProviderScreen extends StatefulWidget {
  final int jobId;
  final int customerId;
  final int providerId;
  final String providerName;

  const TrackProviderScreen({
    super.key,
    required this.jobId,
    required this.customerId,
    required this.providerId,
    required this.providerName,
  });

  @override
  State<TrackProviderScreen> createState() => _TrackProviderScreenState();
}

class _TrackProviderScreenState extends State<TrackProviderScreen>
    with SingleTickerProviderStateMixin {
  GoogleMapController? _mapController;
  LatLng? _providerPosition;
  bool _isWaiting = true;
  bool _locationStopped = false;
  late final AnimationController _pulseController;

  // Default center (will move to provider once first update arrives)
  static const LatLng _defaultCenter = LatLng(33.6844, 73.0479); // Islamabad

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();

    // Start listening for provider_location events
    final socket = context.read<SocketService>();
    socket.listenProviderLocation(_onLocationUpdate);
    socket.listenProviderLocationStopped(_onLocationStopped);
  }

  void _onLocationUpdate(Map<String, dynamic> data) {
    print('DEBUG: _onLocationUpdate called with data: $data');
    
    final int? jobId = data['jobId'] is int
        ? data['jobId']
        : int.tryParse(data['jobId'].toString());

    print('DEBUG: Parsed jobId: $jobId, Expected jobId: ${widget.jobId}');

    // Only process updates for THIS job
    if (jobId != widget.jobId) {
      print('DEBUG: JobId mismatch, ignoring update');
      return;
    }

    final double? lat = double.tryParse(data['latitude'].toString());
    final double? lng = double.tryParse(data['longitude'].toString());

    print('DEBUG: Parsed lat: $lat, lng: $lng');

    if (lat == null || lng == null) {
      print('DEBUG: Lat or lng is null, ignoring update');
      return;
    }

    final newPos = LatLng(lat, lng);

    print('DEBUG: Updating UI with new position: ${newPos.latitude}, ${newPos.longitude}');

    setState(() {
      _providerPosition = newPos;
      _isWaiting = false;
      _locationStopped = false;
    });

    // Animate camera to new position
    _mapController?.animateCamera(
      CameraUpdate.newLatLngZoom(newPos, 16),
    );
  }

  void _onLocationStopped(Map<String, dynamic> data) {
    print('DEBUG: _onLocationStopped called with data: $data');
    
    final int? jobId = data['jobId'] is int
        ? data['jobId']
        : int.tryParse(data['jobId'].toString());

    // Only process stops for THIS job
    if (jobId != widget.jobId) {
      print('DEBUG: JobId mismatch in _onLocationStopped, ignoring');
      return;
    }

    print('DEBUG: Setting _locationStopped to true for jobId: $jobId');

    setState(() {
      _locationStopped = true;
      _providerPosition = null;
    });
  }

  @override
  void dispose() {
    // Stop listening
    context.read<SocketService>().stopListeningProviderLocation();
    _pulseController.dispose();
    _mapController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.white.withOpacity(0.92),
        elevation: 0,
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(Icons.arrow_back_ios_new, size: 16, color: Color(0xFF1E293B)),
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Live Tracking',
              style: TextStyle(
                color: Color(0xFF1E293B),
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            Text(
              widget.providerName,
              style: const TextStyle(
                color: Color(0xFF64748B),
                fontSize: 13,
                fontWeight: FontWeight.normal,
              ),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: _isWaiting
                  ? const Color(0xFFF59E0B).withOpacity(0.1)
                  : const Color(0xFF10B981).withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _isWaiting ? Icons.hourglass_top : Icons.circle,
                  size: 10,
                  color: _isWaiting ? const Color(0xFFF59E0B) : const Color(0xFF10B981),
                ),
                const SizedBox(width: 6),
                Text(
                  _isWaiting ? 'Waiting...' : 'LIVE',
                  style: TextStyle(
                    color: _isWaiting ? const Color(0xFFF59E0B) : const Color(0xFF10B981),
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: Stack(
        children: [
          // ─── Google Map ─────────────────────────────────────────────────
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: _providerPosition ?? _defaultCenter,
              zoom: 14,
            ),
            onMapCreated: (controller) => _mapController = controller,
            myLocationEnabled: true,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
            mapToolbarEnabled: false,
            markers: _providerPosition != null
                ? {
                    Marker(
                      markerId: const MarkerId('provider'),
                      position: _providerPosition!,
                      icon: BitmapDescriptor.defaultMarkerWithHue(
                        BitmapDescriptor.hueViolet,
                      ),
                      infoWindow: InfoWindow(
                        title: widget.providerName,
                        snippet: 'Service Provider',
                      ),
                    ),
                  }
                : {},
          ),

          // ─── Waiting Overlay ────────────────────────────────────────────
          if (_isWaiting || _locationStopped)
            Center(
              child: Container(
                margin: const EdgeInsets.all(40),
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (!_locationStopped)
                      AnimatedBuilder(
                        animation: _pulseController,
                        builder: (context, child) {
                          return Transform.scale(
                            scale: 1.0 + (_pulseController.value * 0.15),
                            child: child,
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: const Color(0xFF6366F1).withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.share_location,
                            size: 40,
                            color: Color(0xFF6366F1),
                          ),
                        ),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEF4444).withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.location_off,
                          size: 40,
                          color: Color(0xFFEF4444),
                        ),
                      ),
                    const SizedBox(height: 24),
                    Text(
                      _locationStopped ? 'Location Sharing Stopped' : 'Waiting for Provider',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _locationStopped
                          ? 'The provider has stopped\nsharing their location'
                          : 'The provider needs to enable\nlocation sharing from their app',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 14,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // ─── Bottom Info Card ───────────────────────────────────────────
          if (!_isWaiting)
            Positioned(
              left: 16,
              right: 16,
              bottom: 32,
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF6366F1).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(
                        Icons.directions_walk,
                        color: Color(0xFF6366F1),
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            widget.providerName,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1E293B),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF10B981),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                'Sharing location • On the way',
                                style: TextStyle(
                                  color: Color(0xFF10B981),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                          if (_providerPosition != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              '${_providerPosition!.latitude.toStringAsFixed(5)}, ${_providerPosition!.longitude.toStringAsFixed(5)}',
                              style: const TextStyle(
                                color: Color(0xFF94A3B8),
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    // Re-center button
                    IconButton(
                      onPressed: () {
                        if (_providerPosition != null) {
                          _mapController?.animateCamera(
                            CameraUpdate.newLatLngZoom(_providerPosition!, 16),
                          );
                        }
                      },
                      icon: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF6366F1).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.my_location,
                          color: Color(0xFF6366F1),
                          size: 20,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
