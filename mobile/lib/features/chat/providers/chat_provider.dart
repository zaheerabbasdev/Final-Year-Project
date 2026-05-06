import 'package:flutter/material.dart';
import 'package:dio/dio.dart' as dio;
import '../../../core/api_client.dart';
import '../models/chat_message.dart';


class ChatProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  List<ChatMessage> _messages = [];
  List<ChatSummary> _chats = [];
  bool _isLoading = false;
  bool _isOtherTyping = false;
  int? _typingJobId;
  int? _activeJobId;
  int? _activeOtherUserId;

  List<ChatMessage> get messages => _messages;
  List<ChatSummary> get chats => _chats;
  bool get isLoading => _isLoading;
  bool get isOtherTyping => _isOtherTyping;
  int? get typingJobId => _typingJobId;
  int? get activeJobId => _activeJobId;
  int? get activeOtherUserId => _activeOtherUserId;

  void setActiveConversation(int? jobId, int? otherUserId) {
    _activeJobId = jobId;
    _activeOtherUserId = otherUserId;
  }


  // Socket callback to emit typing events
  Function(Map<String, dynamic>)? onEmitTyping;
  Function(Map<String, dynamic>)? onEmitStopTyping;


  Future<void> fetchChatList() async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiClient.dio.get('/messages/list');
      if (response.statusCode == 200) {
        _chats = (response.data as List)
            .map((json) => ChatSummary.fromJson(json))
            .toList();
      }
    } catch (e) {
      print('Error fetching chat list: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchMessages(int jobId, int otherUserId) async {
    _activeJobId = jobId;
    _activeOtherUserId = otherUserId;
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiClient.dio.get('/messages/$jobId/$otherUserId');
      if (response.statusCode == 200) {
        _messages = (response.data as List)
            .map((json) => ChatMessage.fromJson(json))
            .toList();
      }
    } catch (e) {
      print('Error fetching messages: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }


  Future<void> sendMessage(int jobId, int receiverId, String content) async {
    try {
      await _apiClient.dio.post('/messages/send', data: {
        'job_id': jobId,
        'receiver_id': receiverId,
        'content': content,
      });
    } catch (e) {
      print('Error sending message: $e');
    }
  }

  Future<void> sendImage(int jobId, int receiverId, String imagePath) async {
    try {
      String fileName = imagePath.split('/').last;
      dio.FormData formData = dio.FormData.fromMap({
        'job_id': jobId,
        'receiver_id': receiverId,
        'image': await dio.MultipartFile.fromFile(imagePath, filename: fileName),
      });

      await _apiClient.dio.post('/messages/send', data: formData);
    } catch (e) {
      print('Error sending image: $e');
    }
  }


  void setOtherTyping(bool typing, int jobId) {
    _isOtherTyping = typing;
    _typingJobId = jobId;
    notifyListeners();
  }

  void emitTyping(int jobId, int receiverId, int senderId) {
    onEmitTyping?.call({
      'jobId': jobId,
      'receiverId': receiverId,
      'senderId': senderId,
    });
  }

  void emitStopTyping(int jobId, int receiverId, int senderId) {
    onEmitStopTyping?.call({
      'jobId': jobId,
      'receiverId': receiverId,
      'senderId': senderId,
    });
  }


  Future<void> markAsRead(int jobId, int senderId) async {
    try {
      await _apiClient.dio.put('/messages/read/$jobId/$senderId');
      // Update local state to reflect all messages from this sender as read
      for (var i = 0; i < _chats.length; i++) {
        if (_chats[i].jobId == jobId && _chats[i].otherUserId == senderId) {
          final old = _chats[i];
          _chats[i] = ChatSummary(
            jobId: old.jobId,
            jobTitle: old.jobTitle,
            otherUserId: old.otherUserId,
            otherUserName: old.otherUserName,
            otherUserAvatar: old.otherUserAvatar,
            otherUserRole: old.otherUserRole,
            lastMessage: old.lastMessage,
            lastMessageTime: old.lastMessageTime,
            isRead: true,
          );
          break;
        }
      }
      notifyListeners();
    } catch (e) {
      print('Error marking read: $e');
    }
  }

  void receiveMessage(ChatMessage message) {
    // Check if message already exists (prevents duplicates from socket + optimistic/refresh)
    if (_messages.any((m) => m.id == message.id)) return;

    // Check if this message belongs to the active conversation
    if (_activeJobId == message.jobId && 
        (_activeOtherUserId == message.senderId || _activeOtherUserId == message.receiverId)) {
      
      // If it's from the other person, mark as read on backend
      if (message.senderId == _activeOtherUserId) {
        markAsRead(message.jobId, message.senderId);
      }
      
      _messages.add(message);
      notifyListeners();
    }
    
    // Also update the chat list summary
    _updateChatListWithNewMessage(message);
  }



  void _updateChatListWithNewMessage(ChatMessage message) {
    final index = _chats.indexWhere((c) => c.jobId == message.jobId);
    if (index != -1) {
      final oldChat = _chats[index];
      final updatedChat = ChatSummary(
        jobId: oldChat.jobId,
        jobTitle: oldChat.jobTitle,
        otherUserId: oldChat.otherUserId,
        otherUserName: oldChat.otherUserName,
        otherUserAvatar: oldChat.otherUserAvatar,
        otherUserRole: oldChat.otherUserRole,
        lastMessage: message.content,
        lastMessageTime: message.createdAt,
        isRead: (_messages.isNotEmpty && _messages.first.jobId == message.jobId),
      );
      
      _chats.removeAt(index);
      _chats.insert(0, updatedChat);
    } else {
      fetchChatList();
    }
    notifyListeners();
  }

}
