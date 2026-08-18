class ChatMessage {
  final int id;
  final int jobId;
  final int senderId;
  final int receiverId;
  final String content;
  final String? imageUrl;
  final bool isRead;
  final DateTime createdAt;
  final String? senderName;
  final String? senderAvatar;

  ChatMessage({
    required this.id,
    required this.jobId,
    required this.senderId,
    required this.receiverId,
    required this.content,
    this.imageUrl,
    required this.isRead,
    required this.createdAt,
    this.senderName,
    this.senderAvatar,
  });


  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      jobId: json['job_id'],
      senderId: json['sender_id'],
      receiverId: json['receiver_id'],
      content: json['content'] ?? '',
      imageUrl: json['image_url'],
      isRead: json['is_read'] == 1 || json['is_read'] == true,
      createdAt: DateTime.parse(json['created_at']).toLocal(),
      senderName: json['sender_name'],
      senderAvatar: json['sender_avatar'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'job_id': jobId,
      'sender_id': senderId,
      'receiver_id': receiverId,
      'content': content,
      'image_url': imageUrl,
      'is_read': isRead,
      'created_at': createdAt.toIso8601String(),
    };
  }

}

class ChatSummary {
  final int jobId;
  final String jobTitle;
  final int otherUserId;
  final String otherUserName;
  final String? otherUserAvatar;
  final String otherUserRole;
  final String lastMessage;
  final DateTime lastMessageTime;
  final bool isRead;

  ChatSummary({
    required this.jobId,
    required this.jobTitle,
    required this.otherUserId,
    required this.otherUserName,
    this.otherUserAvatar,
    required this.otherUserRole,
    required this.lastMessage,
    required this.lastMessageTime,
    required this.isRead,
  });

  factory ChatSummary.fromJson(Map<String, dynamic> json) {
    return ChatSummary(
      jobId: json['job_id'],
      jobTitle: json['job_title'],
      otherUserId: json['other_user_id'],
      otherUserName: json['other_user_name'],
      otherUserAvatar: json['other_user_avatar'],
      otherUserRole: json['other_user_role'],
      lastMessage: json['content'] ?? '',
      lastMessageTime: DateTime.parse(json['created_at']).toLocal(),
      isRead: json['is_read'] == 1 || json['is_read'] == true,
    );
  }

}
