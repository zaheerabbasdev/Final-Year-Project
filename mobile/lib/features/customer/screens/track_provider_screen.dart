import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/language_provider.dart';
import '../../../core/services/socket_service.dart';
import '../../../core/theme.dart';
import '../../customer/job_service.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Isolated map widget — only rebuilds when the provider's position changes.
// Keeping the GoogleMap in its own StatefulWidget prevents it from being torn
// down and re-inflated every time the parent screen calls setState (e.g. on
// each GPS update or animation tick), which was causing the Davey jank.
// ─────────────────────────────────────────────────────────────────────────────
class _TrackingMap extends StatefulWidget {
  final GoogleMapController? controller;
  final void Function(GoogleMapController) onMapCreated;
  final LatLng? providerPosition;
  final String providerName;
  final String serviceProviderLabel;

  const _TrackingMap({
    required this.controller,
    required this.onMapCreated,
    required this.providerPosition,
    required this.providerName,
    required this.serviceProviderLabel,
  });

  @override
  State<_TrackingMap> createState() => _TrackingMapState();
}

// _TrackingMapState animates the provider marker between GPS updates so it
// glides smoothly instead of teleporting — the same effect Careem / Uber use
// for their car icons.  Each time the parent passes a new providerPosition,
// didUpdateWidget interpolates from the last animated position to the new one
// over 1.2 s using an ease-in-out curve.
class _TrackingMapState extends State<_TrackingMap> with TickerProviderStateMixin {
  static const LatLng _defaultCenter = LatLng(33.6844, 73.0479);

  // Current rendered position of the marker (interpolated).
  LatLng? _displayPosition;

  AnimationController? _animController;
  Animation<double>? _latAnim;
  Animation<double>? _lngAnim;

  @override
  void didUpdateWidget(_TrackingMap oldWidget) {
    super.didUpdateWidget(oldWidget);

    final target = widget.providerPosition;
    if (target == null) return;

    // Starting point: last animated position, or the target itself on first fix.
    final from = _displayPosition ?? target;

    // Skip if the position is essentially the same (heartbeat re-emit).
    final dlat = (from.latitude  - target.latitude ).abs();
    final dlng = (from.longitude - target.longitude).abs();
    if (dlat < 0.000005 && dlng < 0.000005) {
      // Still show the pin if this is the very first fix.
      if (_displayPosition == null) setState(() => _displayPosition = target);
      return;
    }

    // Stop any in-progress animation and start a new one.
    _animController?.stop();
    _animController?.dispose();

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _latAnim = Tween<double>(begin: from.latitude,  end: target.latitude)
        .animate(CurvedAnimation(parent: _animController!, curve: Curves.easeInOut));
    _lngAnim = Tween<double>(begin: from.longitude, end: target.longitude)
        .animate(CurvedAnimation(parent: _animController!, curve: Curves.easeInOut));

    _animController!.addListener(() {
      if (mounted) {
        setState(() {
          _displayPosition = LatLng(_latAnim!.value, _lngAnim!.value);
        });
      }
    });

    // Snap to exact target when the animation finishes (avoids floating-point drift).
    _animController!.addStatusListener((status) {
      if (status == AnimationStatus.completed && mounted) {
        setState(() => _displayPosition = target);
      }
    });

    _animController!.forward();
  }

  @override
  void dispose() {
    _animController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Use the animated display position so the marker glides; fall back to the
    // raw widget position on the first frame before animation starts.
    final markerPos = _displayPosition ?? widget.providerPosition;

    return GoogleMap(
      initialCameraPosition: CameraPosition(
        target: widget.providerPosition ?? _defaultCenter,
        zoom: 14,
      ),
      onMapCreated: widget.onMapCreated,
      // myLocationEnabled = true forces the map to render a GPS-tracked blue
      // dot at 60 fps even when nothing moves → floods BufferQueueProducer.
      // The provider's position is shown via the marker instead.
      myLocationEnabled: false,
      myLocationButtonEnabled: false,
      zoomControlsEnabled: false,
      mapToolbarEnabled: false,
      markers: markerPos != null
          ? {
              Marker(
                markerId: const MarkerId('provider'),
                position: markerPos,
                icon: BitmapDescriptor.defaultMarkerWithHue(
                  BitmapDescriptor.hueViolet,
                ),
                infoWindow: InfoWindow(
                  title: widget.providerName,
                  snippet: widget.serviceProviderLabel,
                ),
              ),
            }
          : {},
    );
  }
}

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
  bool _isWaiting         = true;
  bool _locationStopped   = false;
  bool _hasReceivedFirstFix = false; // zoom in to 16 on first GPS fix only

  // ── Stale detection ───────────────────────────────────────────────────────
  // _isSignalLost flips to true when no update arrives for > 8 s after the
  // first fix, letting the customer know the provider's connection is unstable.
  DateTime? _lastUpdateTime;
  Timer?    _staleCheckTimer;
  bool      _isSignalLost = false;

  // ── ETA ───────────────────────────────────────────────────────────────────
  double? _jobLat;
  double? _jobLng;
  double? _etaMinutes;  // straight-line estimate to the job location

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

    // Fetch the job's coordinates so we can show an ETA on the tracking screen
    _loadJobLocation();

    // Stale-detection check: fires every 3 s, sets _isSignalLost if no update
    // has arrived in the last 8 s (connection dropped or provider offline).
    _staleCheckTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (_lastUpdateTime == null || !mounted) return;
      final isNowStale =
          DateTime.now().difference(_lastUpdateTime!).inSeconds > 8;
      if (isNowStale != _isSignalLost) {
        setState(() => _isSignalLost = isNowStale);
      }
    });
  }

  // ── Location helpers ────────────────────────────────────────────────────

  /// Fetches the job's coordinates from the API so we can compute an ETA once
  /// the provider's position starts arriving.
  Future<void> _loadJobLocation() async {
    try {
      final job = await context.read<JobService>().getJobById(widget.jobId);
      if (!mounted || job == null) return;
      final lat = double.tryParse(job['lat']?.toString() ?? '');
      final lng = double.tryParse(job['lng']?.toString() ?? '');
      if (lat != null && lng != null) {
        setState(() {
          _jobLat = lat;
          _jobLng = lng;
        });
      }
    } catch (_) {
      // Non-fatal: ETA simply won't display if the job has no coordinates.
    }
  }

  /// Recalculates straight-line ETA from [from] to the job location.
  ///
  /// Uses walking speed (83 m/min ≈ 5 km/h) for < 500 m and vehicle speed
  /// (500 m/min ≈ 30 km/h) for longer distances — similar to Careem's ETA logic.
  void _updateETA(LatLng from) {
    if (_jobLat == null || _jobLng == null) return;
    final distanceM = Geolocator.distanceBetween(
      from.latitude, from.longitude, _jobLat!, _jobLng!,
    );
    final speedMpm = distanceM < 500 ? 83.3 : 500.0;
    final eta = distanceM / speedMpm;
    setState(() => _etaMinutes = eta);
  }

  void _onLocationUpdate(Map<String, dynamic> data) {
    final int? jobId = data['jobId'] is int
        ? data['jobId']
        : int.tryParse(data['jobId'].toString());

    // Only process updates for THIS job
    if (jobId != widget.jobId) return;

    final double? lat = double.tryParse(data['latitude'].toString());
    final double? lng = double.tryParse(data['longitude'].toString());
    if (lat == null || lng == null) return;

    final newPos     = LatLng(lat, lng);
    final wasWaiting = _isWaiting; // capture before setState

    setState(() {
      _providerPosition = newPos;
      _isWaiting        = false;
      _locationStopped  = false;
      _isSignalLost     = false;
      _lastUpdateTime   = DateTime.now();
    });

    // Feature 5 — "On their way" banner on the very first GPS fix.
    if (wasWaiting && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.directions_run, color: Colors.white, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  '${widget.providerName} is on their way!',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          backgroundColor: AppTheme.primaryColor,
          duration: const Duration(seconds: 4),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(16),
        ),
      );
    }

    // Feature 2 — refresh ETA every time the provider's position changes.
    _updateETA(newPos);

    // Camera follow: zoom into 16 on first fix; pan-only on subsequent fixes
    // so the customer's manual zoom level is preserved.
    if (!_hasReceivedFirstFix) {
      _hasReceivedFirstFix = true;
      _mapController?.animateCamera(CameraUpdate.newLatLngZoom(newPos, 16));
    } else {
      _mapController?.animateCamera(CameraUpdate.newLatLng(newPos));
    }
  }

  void _onLocationStopped(Map<String, dynamic> data) {
    final int? jobId = data['jobId'] is int
        ? data['jobId']
        : int.tryParse(data['jobId'].toString());

    if (jobId != widget.jobId) return;

    setState(() {
      _locationStopped  = true;
      _providerPosition = null;
      _isSignalLost     = false;
      _etaMinutes       = null;
    });
  }

  @override
  void dispose() {
    context.read<SocketService>().stopListeningProviderLocation();
    _pulseController.dispose();
    _staleCheckTimer?.cancel();
    // Do NOT dispose _mapController here — _TrackingMap owns its lifetime.
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).appColors;
    // Use read, not watch — language never changes while the screen is open.
    // watch<LanguageProvider> was rebuilding the entire screen (including
    // the expensive GoogleMap widget) every time LanguageProvider notified,
    // causing 292-frame drops and the "Davey!" 3278 ms jank report.
    final lang = context.read<LanguageProvider>();
    return Scaffold(
      backgroundColor: colors.background,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: colors.surface.withOpacity(0.92),
        elevation: 0,
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: colors.surface,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(Icons.arrow_back_ios_new, size: 16, color: colors.text),
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              lang.t('tracking.title'),
              style: TextStyle(
                color: colors.text,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            Text(
              widget.providerName,
              style: TextStyle(
                color: colors.subtext,
                fontSize: 13,
                fontWeight: FontWeight.normal,
              ),
            ),
          ],
        ),
        actions: [
          // ── Status chip: 3 states ─────────────────────────────────────────
          // ⏳ WAITING  — no fix received yet (amber)
          // 📶 SIGNAL LOST — fix received, then gap > 8 s (orange)
          // 🟢 LIVE     — fix received, update ≤ 8 s ago (green)
          Builder(builder: (context) {
            final Color chipColor;
            final IconData chipIcon;
            final String chipLabel;
            if (_isWaiting) {
              chipColor = const Color(0xFFF59E0B); // amber
              chipIcon  = Icons.hourglass_top;
              chipLabel = lang.t('tracking.waiting');
            } else if (_isSignalLost) {
              chipColor = const Color(0xFFF97316); // orange
              chipIcon  = Icons.signal_wifi_statusbar_connected_no_internet_4;
              chipLabel = 'SIGNAL LOST';
            } else {
              chipColor = const Color(0xFF10B981); // green
              chipIcon  = Icons.circle;
              chipLabel = lang.t('tracking.live');
            }
            return Container(
              margin: const EdgeInsets.only(right: 16),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: chipColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(chipIcon, size: 10, color: chipColor),
                  const SizedBox(width: 6),
                  Text(
                    chipLabel,
                    style: TextStyle(
                      color: chipColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
      body: Stack(
        children: [
          // ─── Google Map ─────────────────────────────────────────────────
          // RepaintBoundary: isolates the map's GPU layer so parent-widget
          // repaints don't invalidate the map's render layer and vice-versa.
          RepaintBoundary(
            child: _TrackingMap(
              controller: _mapController,
              onMapCreated: (c) {
                _mapController = c;
                final providerPosition = _providerPosition;
                if (providerPosition != null) {
                  c.animateCamera(
                    CameraUpdate.newLatLngZoom(providerPosition, 16),
                  );
                  _hasReceivedFirstFix = true;
                }
              },
              providerPosition: _providerPosition,
              providerName: widget.providerName,
              serviceProviderLabel: lang.t('tracking.serviceProvider'),
            ),
          ),

          // ─── Waiting Overlay ────────────────────────────────────────────
          if (_isWaiting || _locationStopped)
            Center(
              child: Container(
                margin: const EdgeInsets.all(40),
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: colors.surface,
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
                            color: const Color(0xFF2563EB).withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.share_location,
                            size: 40,
                            color: Color(0xFF2563EB),
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
                      _locationStopped ? lang.t('tracking.locationStopped') : lang.t('tracking.waitingForProvider'),
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: colors.text,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _locationStopped
                          ? lang.t('tracking.locationStoppedDesc')
                          : lang.t('tracking.waitingDesc'),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: colors.subtext,
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
                  color: colors.surface,
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
                        color: const Color(0xFF2563EB).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(
                        Icons.directions_walk,
                        color: Color(0xFF2563EB),
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
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: colors.text,
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
                              Expanded(
                                child: Text(
                                  lang.t('tracking.sharingLocation'),
                                  style: const TextStyle(
                                    color: Color(0xFF10B981),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          // Feature 2 — ETA chip
                          if (_etaMinutes != null) ...[
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFF2563EB).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                _etaMinutes! < 1
                                    ? '🏁 Arriving soon'
                                    : '🕐 ~${_etaMinutes!.round()} min away',
                                style: const TextStyle(
                                  color: Color(0xFF2563EB),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
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
                          color: const Color(0xFF2563EB).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.my_location,
                          color: Color(0xFF2563EB),
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
