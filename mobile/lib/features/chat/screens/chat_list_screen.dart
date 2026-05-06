import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../providers/chat_provider.dart';
import '../../../core/api_client.dart';
import 'chat_room_screen.dart';


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
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Chat', style: TextStyle(fontWeight: FontWeight.bold)),

        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
      ),
      body: chatProvider.isLoading && chatProvider.chats.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : chatProvider.chats.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: () => chatProvider.fetchChatList(),
                  child: ListView.separated(
                    itemCount: chatProvider.chats.length,
                    separatorBuilder: (context, index) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final chat = chatProvider.chats[index];
                      return ListTile(
                        onTap: () {
                          // Using context.push if using GoRouter, but for now we'll use MaterialPageRoute
                          // because I haven't added the route to GoRouter yet.
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ChatRoomScreen(
                                jobId: chat.jobId,
                                otherUserId: chat.otherUserId,
                                otherUserName: chat.otherUserName,
                                otherUserAvatar: chat.otherUserAvatar,
                              ),
                            ),
                          );
                        },
                        leading: CircleAvatar(
                          radius: 28,
                          backgroundImage: chat.otherUserAvatar != null
                              ? NetworkImage(ApiClient.getImageUrl(chat.otherUserAvatar!)!)
                              : null,
                          child: chat.otherUserAvatar == null
                              ? const Icon(Icons.person)
                              : null,
                        ),

                        title: Row(
                          children: [
                            Expanded(
                              child: Text(
                                chat.otherUserName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                            Text(
                              DateFormat('hh:mm a').format(chat.lastMessageTime),
                              style: TextStyle(
                                color: Colors.grey[500],
                                fontSize: 12,
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
                              style: TextStyle(
                                color: Theme.of(context).primaryColor,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                if (chat.lastMessage.isEmpty && chat.lastMessageTime != null)
                                  const Icon(Icons.photo, size: 16, color: Colors.grey),
                                if (chat.lastMessage.isEmpty && chat.lastMessageTime != null)
                                  const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    chat.lastMessage.isEmpty ? 'Photo' : chat.lastMessage,
                                    style: TextStyle(
                                      color: Colors.grey[600],
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
                                width: 12,
                                height: 12,
                                decoration: BoxDecoration(
                                  color: Theme.of(context).primaryColor,
                                  shape: BoxShape.circle,
                                ),
                              )
                            : null,
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.chat_bubble_outline, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 20),
          Text(
            'No conversations yet',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Bids you accept will appear here.',
            style: TextStyle(color: Colors.grey[400]),
          ),
        ],
      ),
    );
  }
}
