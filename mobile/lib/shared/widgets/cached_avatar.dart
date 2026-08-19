import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

/// A CircleAvatar backed by [CachedNetworkImage].
/// Images are stored on disk and served from cache on subsequent loads,
/// eliminating repeated network requests for the same avatar URL.
class CachedAvatar extends StatelessWidget {
  final String? imageUrl;
  final double radius;
  final IconData fallbackIcon;

  const CachedAvatar({
    super.key,
    required this.imageUrl,
    this.radius = 24,
    this.fallbackIcon = Icons.person_rounded,
  });

  Widget _placeholder() => CircleAvatar(
        radius: radius,
        backgroundColor: const Color(0xFF003B95).withOpacity(0.10),
        child: Icon(fallbackIcon, size: radius, color: const Color(0xFF003B95)),
      );

  @override
  Widget build(BuildContext context) {
    final url = imageUrl;
    if (url == null || url.isEmpty) return _placeholder();

    return CachedNetworkImage(
      imageUrl: url,
      imageBuilder: (_, imageProvider) => CircleAvatar(
        radius: radius,
        backgroundImage: imageProvider,
      ),
      placeholder: (_, __) => _placeholder(),
      errorWidget: (_, __, ___) => _placeholder(),
    );
  }
}
