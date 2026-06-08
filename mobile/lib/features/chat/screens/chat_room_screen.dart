import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import '../providers/chat_provider.dart';
import '../../../features/auth/auth_service.dart';
import '../../../core/api_client.dart';
import '../models/chat_message.dart';
import '../../../core/theme.dart';

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
  bool _wasEmpty = true;

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
    final isEmpty = _messageController.text.trim().isEmpty;
    if (_wasEmpty != isEmpty) {
      setState(() {
        _wasEmpty = isEmpty;
      });
    }

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
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        iconTheme: const IconThemeData(color: AppTheme.textColor),
        titleSpacing: 0,
        title: InkWell(
          onTap: () {},
          child: Row(
            children: [
              _buildAppBarAvatar(),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.otherUserName,
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        color: AppTheme.textColor,
                        fontWeight: FontWeight.bold,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (chatProvider.isOtherTyping && chatProvider.typingJobId == widget.jobId)
                      Text(
                        'typing...',
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          color: AppTheme.secondaryColor,
                          fontWeight: FontWeight.w600,
                        ),
                      )
                    else
                      Text(
                        'Online',
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          color: AppTheme.subtextColor,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.videocam_outlined, color: AppTheme.textColor),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.call_outlined, color: AppTheme.textColor),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.more_vert_rounded, color: AppTheme.textColor),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: chatProvider.isLoading && chatProvider.messages.isEmpty
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
                : _buildMessageList(chatProvider.messages, currentUserId),
          ),
          _buildMessageInput(),
        ],
      ),
    );
  }

  Widget _buildAppBarAvatar() {
    final avatarUrl = ApiClient.getImageUrl(widget.otherUserAvatar);
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.1),
        shape: BoxShape.circle,
      ),
      child: ClipOval(
        child: (avatarUrl != null && !avatarUrl.contains('/null') && !avatarUrl.endsWith('/'))
            ? Image.network(
                avatarUrl,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => _buildAvatarPlaceholder(),
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return const Center(
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryColor),
                    ),
                  );
                },
              )
            : _buildAvatarPlaceholder(),
      ),
    );
  }

  Widget _buildAvatarPlaceholder() {
    final initials = widget.otherUserName.isNotEmpty ? widget.otherUserName[0].toUpperCase() : '?';
    return Center(
      child: Text(
        initials,
        style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontWeight: FontWeight.bold, fontSize: 18),
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
            _buildMessageBubbleWithAvatar(message, isMe),
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
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        dateStr,
        style: GoogleFonts.outfit(
          fontSize: 12,
          color: AppTheme.primaryColor,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildMessageBubbleWithAvatar(ChatMessage message, bool isMe) {
    return Row(
      mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        if (!isMe) ...[
          _buildMessageAvatar(message.senderAvatar, message.senderName),
          const SizedBox(width: 4),
        ],
        _buildMessageBubble(message, isMe),
      ],
    );
  }

  Widget _buildMessageAvatar(String? avatar, String? name) {
    final avatarUrl = ApiClient.getImageUrl(avatar);
    return Container(
      width: 28,
      height: 28,
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.1),
        shape: BoxShape.circle,
      ),
      child: ClipOval(
        child: (avatarUrl != null && !avatarUrl.contains('/null') && !avatarUrl.endsWith('/'))
            ? Image.network(
                avatarUrl,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => _buildSmallAvatarPlaceholder(name),
              )
            : _buildSmallAvatarPlaceholder(name),
      ),
    );
  }

  Widget _buildSmallAvatarPlaceholder(String? name) {
    final initials = (name != null && name.isNotEmpty) ? name[0].toUpperCase() : '?';
    return Center(
      child: Text(
        initials,
        style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontSize: 12, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message, bool isMe) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: isMe ? AppTheme.primaryColor : Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: const Radius.circular(16),
          topRight: const Radius.circular(16),
          bottomLeft: Radius.circular(isMe ? 16 : 4),
          bottomRight: Radius.circular(isMe ? 4 : 16),
        ),
        boxShadow: isMe
            ? null
            : [
                BoxShadow(
                  color: AppTheme.textColor.withOpacity(0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      constraints: BoxConstraints(
        maxWidth: MediaQuery.of(context).size.width * 0.72,
      ),
      child: Stack(
        children: [
          Padding(
            padding: EdgeInsets.only(
              left: 8,
              top: 4,
              right: message.content.length < 20 ? 64 : 8,
              bottom: 22,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (message.imageUrl != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        ApiClient.getImageUrl(message.imageUrl!)!,
                        fit: BoxFit.cover,
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return Container(
                            height: 200,
                            width: double.infinity,
                            color: Colors.grey[100],
                            child: const Center(
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                if (message.content.isNotEmpty)
                  Text(
                    message.content,
                    style: GoogleFonts.outfit(
                      fontSize: 15,
                      color: isMe ? Colors.white : AppTheme.textColor,
                      fontWeight: FontWeight.w400,
                      height: 1.3,
                    ),
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
                  style: GoogleFonts.outfit(
                    color: isMe ? Colors.white.withOpacity(0.7) : AppTheme.subtextColor,
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (isMe) ...[
                  const SizedBox(width: 4),
                  Icon(
                    Icons.done_all_rounded,
                    size: 15,
                    color: message.isRead ? AppTheme.secondaryColor : Colors.white60,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageInput() {
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    return Container(
      padding: EdgeInsets.fromLTRB(16, 8, 16, bottomPadding > 0 ? bottomPadding : 20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: AppTheme.textColor.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: AppTheme.backgroundColor,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
                ),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.sentiment_satisfied_alt_outlined, color: AppTheme.subtextColor),
                      onPressed: () {},
                    ),
                    Expanded(
                      child: RawKeyboardListener(
                        focusNode: FocusNode(),
                        onKey: (event) {
                          if (event is RawKeyDownEvent && 
                              event.logicalKey == LogicalKeyboardKey.enter && 
                              !event.isShiftPressed) {
                            _sendMessage();
                          }
                        },
                        child: TextField(
                          controller: _messageController,
                          textInputAction: TextInputAction.send,
                          onSubmitted: (_) => _sendMessage(),
                          style: GoogleFonts.outfit(
                            color: AppTheme.textColor,
                            fontSize: 15,
                          ),
                          decoration: InputDecoration(
                            hintText: 'Type a message...',
                            hintStyle: GoogleFonts.outfit(color: AppTheme.subtextColor),
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                          ),
                          maxLines: 5,
                          minLines: 1,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.attach_file_rounded, color: AppTheme.subtextColor),
                      onPressed: _pickImage,
                    ),
                    if (_messageController.text.isEmpty)
                      IconButton(
                        icon: const Icon(Icons.camera_alt_outlined, color: AppTheme.subtextColor),
                        onPressed: () => _pickImage(source: ImageSource.camera),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            GestureDetector(
              onTap: _sendMessage,
              child: Container(
                width: 48,
                height: 48,
                decoration: const BoxDecoration(
                  color: AppTheme.primaryColor,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _messageController.text.isEmpty ? Icons.mic_none_rounded : Icons.send_rounded,
                  color: Colors.white,
                  size: 22,
                ),
              ),
            ),
          ],
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
