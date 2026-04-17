import 'package:flutter/material.dart';
import '../../../core/api_client.dart';

class ReviewCard extends StatelessWidget {
  final Map<String, dynamic> review;

  const ReviewCard({super.key, required this.review});

  @override
  Widget build(BuildContext context) {
    final customerName = review['customer_name'] ?? 'Unknown User';
    final avatarUrl = ApiClient.getImageUrl(review['customer_avatar']);
    final initial = customerName.isNotEmpty ? customerName[0].toUpperCase() : '?';
    final int rating = int.tryParse(review['rating']?.toString() ?? '0') ?? 0;
    
    // Formatting date
    String dateStr = 'Unknown';
    if (review['created_at'] != null) {
      dateStr = review['created_at'].toString().split('T').first;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: const Color(0xFF6366F1).withOpacity(0.1),
                backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                child: avatarUrl == null
                    ? Text(initial, style: const TextStyle(color: Color(0xFF6366F1), fontWeight: FontWeight.bold))
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      customerName,
                      style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      dateStr,
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                    ),
                  ],
                ),
              ),
              Row(
                children: List.generate(5, (index) {
                  return Icon(
                    index < rating ? Icons.star : Icons.star_border,
                    color: index < rating ? const Color(0xFFF59E0B) : const Color(0xFFE2E8F0),
                    size: 16,
                  );
                }),
              ),
            ],
          ),
          if (review['comment'] != null && review['comment'].isNotEmpty) ...[
            const SizedBox(height: 16),
            Text(
              review['comment'],
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 14, height: 1.5),
            ),
          ],
        ],
      ),
    );
  }
}
