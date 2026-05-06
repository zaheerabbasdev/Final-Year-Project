import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import '../providers/chat_provider.dart';
import '../../../features/auth/auth_service.dart';
import '../../../core/api_client.dart';
import '../models/chat_message.dart';

class ChatRoomScreen extends StatefulWidget {
  final int jobId;
  final int otherUserId;
  final String otherUserName;
  final String? otherUserAvatar;

  const ChatRoomScreen({
    super.key,
    required this.jobId,
    required this.otherUserId,
    required this.otherUserName,
    this.otherUserAvatar,
  });

  @override
  State<ChatRoomScreen> createState() => _ChatRoomScreenState();
}

class _ChatRoomScreenState extends State<ChatRoomScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ImagePicker _picker = ImagePicker();
  Timer? _typingTimer;
  bool _isTyping = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ChatProvider>().fetchMessages(widget.jobId, widget.otherUserId);
    });
    _messageController.addListener(_onTextChanged);
  }

  @override
  void dispose() {
    _messageController.removeListener(_onTextChanged);
    _messageController.dispose();
    _typingTimer?.cancel();
    // Clear active conversation in provider
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<ChatProvider>().setActiveConversation(null, null);
      }
    });
    super.dispose();
  }


  void _onTextChanged() {
    final auth = context.read<AuthService>();
    if (auth.user == null) return;
    final currentUserId = auth.user!['id'];
    
    if (!_isTyping && _messageController.text.isNotEmpty) {
      _isTyping = true;
      context.read<ChatProvider>().emitTyping(widget.jobId, widget.otherUserId, currentUserId);
    }

    _typingTimer?.cancel();
    _typingTimer = Timer(const Duration(milliseconds: 2000), () {
      if (_isTyping) {
        _isTyping = false;
        context.read<ChatProvider>().emitStopTyping(widget.jobId, widget.otherUserId, currentUserId);
      }
    });
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final chatProvider = context.watch<ChatProvider>();
    final auth = context.read<AuthService>();
    final currentUserId = auth.user?['id'] ?? 0;

    // Scroll to bottom when messages change
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());

    return Scaffold(
      backgroundColor: const Color(0xFFE5DDD5),
      appBar: AppBar(
        backgroundColor: const Color(0xFF075E54),
        iconTheme: const IconThemeData(color: Colors.white),
        titleSpacing: 0,
        title: InkWell(
          onTap: () {},
          child: Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundImage: widget.otherUserAvatar != null
                    ? NetworkImage(ApiClient.getImageUrl(widget.otherUserAvatar!)!)
                    : null,
                child: widget.otherUserAvatar == null ? const Icon(Icons.person, size: 20, color: Colors.white) : null,
              ),

              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.otherUserName,
                      style: const TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold),
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (chatProvider.isOtherTyping && chatProvider.typingJobId == widget.jobId)
                      const Text(
                        'typing...',
                        style: TextStyle(fontSize: 12, color: Colors.white70, fontStyle: FontStyle.italic),
                      )
                    else
                      const Text(
                        'Online',
                        style: TextStyle(fontSize: 12, color: Colors.white70),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.videocam, color: Colors.white), onPressed: () {}),
          IconButton(icon: const Icon(Icons.call, color: Colors.white), onPressed: () {}),
          IconButton(icon: const Icon(Icons.more_vert, color: Colors.white), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: chatProvider.isLoading && chatProvider.messages.isEmpty
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF075E54)))
                : _buildMessageList(chatProvider.messages, currentUserId),
          ),
          _buildMessageInput(),
        ],
      ),
    );
  }

  Widget _buildMessageList(List<ChatMessage> messages, int currentUserId) {
    if (messages.isEmpty) return const SizedBox.shrink();

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
      itemCount: messages.length,
      itemBuilder: (context, index) {
        final message = messages[index];
        final isMe = message.senderId == currentUserId;
        
        bool showDate = false;
        if (index == 0) {
          showDate = true;
        } else {
          final prevMessage = messages[index - 1];
          if (message.createdAt.day != prevMessage.createdAt.day ||
              message.createdAt.month != prevMessage.createdAt.month ||
              message.createdAt.year != prevMessage.createdAt.year) {
            showDate = true;
          }
        }

        return Column(
          children: [
            if (showDate) _buildDateHeader(message.createdAt),
            _buildMessageBubble(message, isMe),
          ],
        );
      },
    );
  }

  Widget _buildDateHeader(DateTime date) {
    String dateStr;
    final now = DateTime.now();
    if (date.day == now.day && date.month == now.month && date.year == now.year) {
      dateStr = 'Today';
    } else if (date.day == now.day - 1 && date.month == now.month && date.year == now.year) {
      dateStr = 'Yesterday';
    } else {
      dateStr = DateFormat('MMMM dd, yyyy').format(date);
    }

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 16),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFD1E4F5),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        dateStr,
        style: const TextStyle(fontSize: 12, color: Color(0xFF54656F), fontWeight: FontWeight.w500),
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message, bool isMe) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 4),
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: isMe ? const Color(0xFFDCF8C6) : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(12),
            topRight: const Radius.circular(12),
            bottomLeft: Radius.circular(isMe ? 12 : 0),
            bottomRight: Radius.circular(isMe ? 0 : 12),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 1,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.8,
        ),
        child: Stack(
          children: [
            Padding(
              padding: EdgeInsets.only(
                left: 8,
                top: 4,
                right: message.content.length < 20 ? 60 : 8,
                bottom: 20,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (message.imageUrl != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          ApiClient.getImageUrl(message.imageUrl!)!,
                          fit: BoxFit.cover,
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return Container(
                              height: 200,
                              width: double.infinity,
                              color: Colors.grey[200],
                              child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                            );
                          },
                        ),
                      ),
                    ),
                  if (message.content.isNotEmpty)
                    Text(
                      message.content,
                      style: const TextStyle(fontSize: 15, color: Color(0xFF111B21)),
                    ),
                ],
              ),
            ),
            Positioned(
              bottom: 4,
              right: 8,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    DateFormat('hh:mm a').format(message.createdAt),
                    style: TextStyle(color: Colors.grey[600], fontSize: 11),
                  ),
                  if (isMe) ...[
                    const SizedBox(width: 4),
                    Icon(
                      Icons.done_all,
                      size: 16,
                      color: message.isRead ? Colors.blue : Colors.grey,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(25),
                ),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.emoji_emotions_outlined, color: Color(0xFF54656F)),
                      onPressed: () {},
                    ),
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        decoration: const InputDecoration(
                          hintText: 'Message',
                          hintStyle: TextStyle(color: Color(0xFF8696A0)),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(vertical: 10),
                        ),
                        maxLines: 5,
                        minLines: 1,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.attach_file, color: Color(0xFF54656F)),
                      onPressed: _pickImage,
                    ),
                    if (_messageController.text.isEmpty)
                      IconButton(
                        icon: const Icon(Icons.camera_alt, color: Color(0xFF54656F)),
                        onPressed: () => _pickImage(source: ImageSource.camera),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: _sendMessage,
              child: CircleAvatar(
                radius: 24,
                backgroundColor: const Color(0xFF00A884), // WhatsApp Brand Green
                child: Icon(
                  _messageController.text.isEmpty ? Icons.mic : Icons.send,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickImage({ImageSource source = ImageSource.gallery}) async {
    final XFile? image = await _picker.pickImage(source: source);
    if (image != null) {
      context.read<ChatProvider>().sendImage(
        widget.jobId,
        widget.otherUserId,
        image.path,
      );
    }
  }

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty) return;
    
    context.read<ChatProvider>().sendMessage(
      widget.jobId,
      widget.otherUserId,
      _messageController.text.trim(),
    );
    _messageController.clear();
    setState(() {}); // Update to show mic icon if needed
  }
}
