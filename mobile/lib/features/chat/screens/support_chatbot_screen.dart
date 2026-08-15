import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme.dart';
import '../../../core/api_client.dart';
import '../../../core/providers/language_provider.dart';

class SupportChatbotScreen extends StatefulWidget {
  const SupportChatbotScreen({super.key});

  @override
  State<SupportChatbotScreen> createState() => _SupportChatbotScreenState();
}

class _SupportChatbotScreenState extends State<SupportChatbotScreen> {
  final _messageController = TextEditingController();
  List<Map<String, dynamic>> _messages = [];
  bool _isWriting = false;
  final ApiClient _apiClient = ApiClient();
  final ScrollController _scrollController = ScrollController();
  List<String> _quickSuggestions = [];
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _initialized = true;
      final lang = context.read<LanguageProvider>();
      _messages = [
        {
          'role': 'assistant',
          'content': 'Hello! I am Kaarkun AI Support. How can I help you navigate the platform today?',
          'time': DateTime.now()
        }
      ];
      _quickSuggestions = [
        'How do I post a job?',
        'Why is my account pending?',
        'How do bids work?',
        'What are the fees?'
      ];
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    setState(() {
      _messages.add({
        'role': 'user',
        'content': text,
        'time': DateTime.now()
      });
      _isWriting = true;
    });
    _messageController.clear();
    _scrollToBottom();

    try {
      final history = _messages.sublist(0, _messages.length - 1).map((m) => {
        'role': m['role'],
        'content': m['content']
      }).toList();

      final response = await _apiClient.dio.post('/ai/support-chatbot', data: {
        'message': text,
        'history': history,
      });

      if (response.statusCode == 200 && response.data != null) {
        final botResponse = response.data['response'] ?? 'I could not process that request.';
        setState(() {
          _messages.add({
            'role': 'assistant',
            'content': botResponse,
            'time': DateTime.now()
          });
        });
      }
    } catch (e) {
      setState(() {
        _messages.add({
          'role': 'assistant',
          'content': 'Connection timeout. Please ensure the server is running and try again.',
          'time': DateTime.now()
        });
      });
    } finally {
      setState(() => _isWriting = false);
      _scrollToBottom();
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
        scrolledUnderElevation: 0,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: colors.text),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.secondaryColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.psychology, color: AppTheme.secondaryColor, size: 22),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  lang.t('chat.chatbot.title'),
                  style: GoogleFonts.outfit(color: colors.text, fontWeight: FontWeight.bold, fontSize: 16),
                ),
                Text(
                  lang.t('chat.chatbot.alwaysOnline'),
                  style: GoogleFonts.outfit(color: AppTheme.successColor, fontWeight: FontWeight.w600, fontSize: 11),
                ),
              ],
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(20),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isUser = msg['role'] == 'user';
                return _buildMessageBubble(msg['content'] as String, isUser, colors);
              },
            ),
          ),
          if (_isWriting)
            Padding(
              padding: const EdgeInsets.only(left: 24, bottom: 8),
              child: Row(
                children: [
                  Text(
                    lang.t('chat.chatbot.aiTyping'),
                    style: GoogleFonts.outfit(fontSize: 12, color: colors.subtext, fontStyle: FontStyle.italic),
                  ),
                ],
              ),
            ),
          if (_messages.length == 1 && !_isWriting) _buildSuggestionsRow(colors),
          _buildInputBar(colors, lang),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(String content, bool isUser, AppColors colors) {
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isUser ? AppTheme.primaryColor : colors.surface,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(20),
            topRight: const Radius.circular(20),
            bottomLeft: Radius.circular(isUser ? 20 : 4),
            bottomRight: Radius.circular(isUser ? 4 : 20),
          ),
          boxShadow: [
            BoxShadow(
              color: colors.text.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Text(
          content,
          style: GoogleFonts.outfit(
            color: isUser ? Colors.white : colors.text,
            fontSize: 14,
            height: 1.4,
          ),
        ),
      ),
    );
  }

  Widget _buildSuggestionsRow(AppColors colors) {
    return Container(
      height: 48,
      margin: const EdgeInsets.only(bottom: 12),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        scrollDirection: Axis.horizontal,
        itemCount: _quickSuggestions.length,
        itemBuilder: (context, index) {
          final suggestion = _quickSuggestions[index];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ActionChip(
              backgroundColor: colors.surface,
              surfaceTintColor: Colors.transparent,
              side: BorderSide(color: colors.border),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              label: Text(
                suggestion,
                style: GoogleFonts.outfit(color: colors.text, fontSize: 13, fontWeight: FontWeight.bold),
              ),
              onPressed: () => _sendMessage(suggestion),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInputBar(AppColors colors, LanguageProvider lang) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final btnColor = isDark ? AppTheme.secondaryColor : AppTheme.primaryColor;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: colors.surface,
        border: Border(top: BorderSide(color: colors.border, width: 1)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _messageController,
                style: GoogleFonts.outfit(color: colors.text, fontSize: 15),
                decoration: InputDecoration(
                  hintText: lang.t('chat.chatbot.askHint'),
                  hintStyle: GoogleFonts.outfit(color: colors.subtext),
                  filled: true,
                  fillColor: colors.background,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide(color: colors.border, width: 1.5),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide(color: colors.border, width: 1.5),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide(color: btnColor, width: 2),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                ),
                onSubmitted: _sendMessage,
              ),
            ),
            const SizedBox(width: 10),
            FloatingActionButton(
              mini: true,
              backgroundColor: btnColor,
              elevation: 2,
              onPressed: () => _sendMessage(_messageController.text),
              child: const Icon(Icons.send, color: Colors.white, size: 18),
            ),
          ],
        ),
      ),
    );
  }
}
