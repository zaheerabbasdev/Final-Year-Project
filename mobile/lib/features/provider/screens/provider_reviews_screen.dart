import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../shared/services/review_service.dart';
import '../../../shared/widgets/review_card.dart';

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
          'All Reviews',
          style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold),
        ),
      ),
      body: _reviews.isEmpty && _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _reviews.isEmpty
              ? const Center(child: Text('No reviews yet', style: TextStyle(color: Color(0xFF94A3B8))))
              : ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(24),
                  itemCount: _reviews.length + (_hasMore ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index == _reviews.length) {
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.all(16.0),
                          child: CircularProgressIndicator(),
                        ),
                      );
                    }
                    return ReviewCard(review: _reviews[index]);
                  },
                ),
    );
  }
}
