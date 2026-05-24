import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/chat_provider.dart';
import '../../../core/api_client.dart';
import '../../../core/theme.dart';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({super.key});

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ChatProvider>().fetchChatList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final chatProvider = context.watch<ChatProvider>();

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(
          'Chats',
          style: GoogleFonts.outfit(color: AppTheme.textColor, fontWeight: FontWeight.bold, fontSize: 22),
        ),
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: Colors.white,
      ),
      body: chatProvider.isLoading && chatProvider.chats.isEmpty
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
          : chatProvider.chats.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  color: AppTheme.primaryColor,
                  onRefresh: () => chatProvider.fetchChatList(),
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                    itemCount: chatProvider.chats.length,
                    itemBuilder: (context, index) {
                      final chat = chatProvider.chats[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.textColor.withOpacity(0.02),
                              blurRadius: 15,
                              offset: const Offset(0, 5),
                            ),
                          ],
                        ),
                        child: ListTile(
                          onTap: () {
                            context.push('/chat-room', extra: {
                              'jobId': chat.jobId,
                              'otherUserId': chat.otherUserId,
                              'otherUserName': chat.otherUserName,
                              'otherUserAvatar': chat.otherUserAvatar,
                            });
                          },
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          leading: CircleAvatar(
                            radius: 28,
                            backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                            backgroundImage: chat.otherUserAvatar != null
                                ? NetworkImage(ApiClient.getImageUrl(chat.otherUserAvatar!)!)
                                : null,
                            child: chat.otherUserAvatar == null
                                ? const Icon(Icons.person, color: AppTheme.primaryColor, size: 28)
                                : null,
                          ),
                          title: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  chat.otherUserName,
                                  style: GoogleFonts.outfit(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: AppTheme.textColor,
                                  ),
                                ),
                              ),
                              Text(
                                DateFormat('hh:mm a').format(chat.lastMessageTime),
                                style: GoogleFonts.outfit(
                                  color: AppTheme.subtextColor,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 4),
                              Text(
                                chat.jobTitle,
                                style: GoogleFonts.outfit(
                                  color: AppTheme.secondaryColor,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  if (chat.lastMessage.isEmpty && chat.lastMessageTime != null)
                                    const Icon(Icons.photo, size: 16, color: AppTheme.subtextColor),
                                  if (chat.lastMessage.isEmpty && chat.lastMessageTime != null)
                                    const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      chat.lastMessage.isEmpty ? 'Photo' : chat.lastMessage,
                                      style: GoogleFonts.outfit(
                                        color: chat.isRead ? AppTheme.subtextColor : AppTheme.textColor,
                                        fontSize: 14,
                                        fontWeight: chat.isRead ? FontWeight.normal : FontWeight.bold,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          trailing: !chat.isRead
                              ? Container(
                                  width: 10,
                                  height: 10,
                                  decoration: const BoxDecoration(
                                    color: AppTheme.secondaryColor,
                                    shape: BoxShape.circle,
                                  ),
                                )
                              : null,
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState() {
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
              child: Icon(Icons.chat_bubble_outline_rounded, size: 64, color: AppTheme.primaryColor.withOpacity(0.8)),
            ),
            const SizedBox(height: 24),
            Text(
              'No conversations yet',
              style: GoogleFonts.outfit(
                fontSize: 20,
                color: AppTheme.textColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Chats regarding active bookings will appear here.',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(color: AppTheme.subtextColor, fontSize: 14, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }
}
