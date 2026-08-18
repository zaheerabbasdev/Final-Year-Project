import 'package:flutter/material.dart';
import 'package:dio/dio.dart' as dio;
import 'package:image_picker/image_picker.dart';
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


  Future<void> sendMessage(int jobId, int receiverId, String content,
      {int senderId = 0}) async {
    // Optimistic update — show the message immediately so the chat feels instant.
    // We use a negative timestamp-based ID as a temporary local key.
    final tempId = -(DateTime.now().millisecondsSinceEpoch);
    if (senderId != 0 && _activeJobId == jobId) {
      final opt = ChatMessage(
        id: tempId,
        jobId: jobId,
        senderId: senderId,
        receiverId: receiverId,
        content: content,
        imageUrl: null,
        isRead: false,
        createdAt: DateTime.now(),
      );
      _messages.add(opt);
      notifyListeners();
    }

    try {
      await _apiClient.dio.post('/messages/send', data: {
        'job_id': jobId,
        'receiver_id': receiverId,
        'content': content,
      });
    } catch (e) {
      // Roll back the optimistic message on failure
      _messages.removeWhere((m) => m.id == tempId);
      notifyListeners();
      print('Error sending message: $e');
    }
  }

  Future<void> sendImage(int jobId, int receiverId, String imagePath) async {
    try {
      // For cross-platform support (Web/Mobile), read bytes first
      final XFile xFile = XFile(imagePath);
      final bytes = await xFile.readAsBytes();
      final fileName = xFile.name.isNotEmpty ? xFile.name : 'image.jpg';

      dio.FormData formData = dio.FormData.fromMap({
        'job_id': jobId.toString(),
        'receiver_id': receiverId.toString(),
        'image': dio.MultipartFile.fromBytes(
          bytes,
          filename: fileName,
        ),
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
    // Replace any matching optimistic message (negative temp ID, same sender/content/job)
    _messages.removeWhere((m) =>
        m.id < 0 &&
        m.senderId == message.senderId &&
        m.content == message.content &&
        m.jobId == message.jobId);

    // Check if real message already exists (prevents duplicates from socket + refresh)
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
