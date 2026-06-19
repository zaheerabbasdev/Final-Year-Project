import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Stores the auth token in the platform keystore/keychain instead of
/// plaintext SharedPreferences.
class TokenStorage {
  static const _storage = FlutterSecureStorage();
  static const _key = 'token';

  static Future<String?> getToken() => _storage.read(key: _key);

  static Future<void> setToken(String token) =>
      _storage.write(key: _key, value: token);

  static Future<void> clearToken() => _storage.delete(key: _key);
}
