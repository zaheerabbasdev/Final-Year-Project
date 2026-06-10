import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../shared/services/review_service.dart';
import '../../../shared/widgets/review_card.dart';
import '../../../core/theme.dart';

class ProviderReviewsScreen extends StatefulWidget {
  final int providerId;

  const ProviderReviewsScreen({super.key, required this.providerId});

  @override
  State<ProviderReviewsScreen> createState() => _ProviderReviewsScreenState();
}

class _ProviderReviewsScreenState extends State<ProviderReviewsScreen> {
  final List<dynamic> _reviews = [];
  bool _isLoading = false;
  bool _hasMore = true;
  int _offset = 0;
  final int _limit = 20;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _fetchReviews();
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent * 0.8 &&
          !_isLoading &&
          _hasMore) {
        _fetchReviews();
      }
    });
  }

  Future<void> _fetchReviews() async {
    if (_isLoading || !_hasMore) return;

    setState(() => _isLoading = true);

    final newReviews = await context.read<ReviewService>().fetchProviderReviews(
          widget.providerId,
          limit: _limit,
          offset: _offset,
        );

    if (mounted) {
      setState(() {
        _reviews.addAll(newReviews);
        _isLoading = false;
        _offset += _limit;
        if (newReviews.length < _limit) {
          _hasMore = false;
        }
      });
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).appColors;
    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.surface,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: colors.text, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'All Reviews',
          style: GoogleFonts.outfit(
            color: colors.text,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
      body: _reviews.isEmpty && _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
          : _reviews.isEmpty
              ? _buildEmptyState()
              : Container(
                  color: colors.background,
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                    itemCount: _reviews.length + (_hasMore ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == _reviews.length) {
                        return const Center(
                          child: Padding(
                            padding: EdgeInsets.all(16.0),
                            child: CircularProgressIndicator(color: AppTheme.primaryColor),
                          ),
                        );
                      }
                      return ReviewCard(review: _reviews[index]);
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState() {
    return Builder(
      builder: (context) {
        final colors = Theme.of(context).appColors;
        return Center(
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.05),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.rate_review_outlined,
                    size: 64,
                    color: AppTheme.primaryColor.withOpacity(0.8),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'No reviews yet',
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    color: colors.text,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Reviews from customers will appear here.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    color: colors.subtext,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
