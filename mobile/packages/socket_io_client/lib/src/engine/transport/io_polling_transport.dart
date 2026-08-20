// io_polling_transport.dart
//
// Native (dart:io) HTTP long-polling transport for socket.io on Android / iOS.
//
// The published socket_io_client package only ships IOWebSocketTransport for
// native targets.  Some mobile networks (carrier transparent proxies) strip
// the "Upgrade: websocket" header, which makes direct WebSocket connections
// time out.  HTTP long-polling is immune to that problem because it uses
// ordinary GET / POST requests over port 80.
//
// This class is a clean re-implementation of PollingTransport that replaces
// the browser-only XMLHttpRequest with dart:io's HttpClient.  All engine.io
// packet encode / decode logic is delegated to PacketParser (from
// socket_io_common) so it stays in sync with the server-side protocol.
//
// Usage: wire it into io_transports.dart so that the 'polling' name maps to
// this class instead of IOWebSocketTransport.

import 'dart:async';
import 'dart:convert';
import 'dart:io' as io;

import 'package:logging/logging.dart';
import 'package:socket_io_client/src/engine/transport.dart';
import 'package:socket_io_common/src/engine/parser/parser.dart';

final Logger _logger = Logger('socket_io:transport.IOPollingTransport');

class IOPollingTransport extends Transport {
  @override
  String? name = 'polling';

  // true while an outstanding long-poll GET is in flight
  bool polling = false;

  // Reused across the lifetime of this transport; force-closed on doClose()
  final io.HttpClient _httpClient = io.HttpClient()
    ..connectionTimeout = const Duration(seconds: 30)
    ..idleTimeout = const Duration(seconds: 60);

  IOPollingTransport(Map opts) : super(opts);

  // ─── Transport lifecycle ──────────────────────────────────────────────────

  @override
  void doOpen() {
    _poll();
  }

  @override
  void doClose() {
    _logger.fine('closing IOPollingTransport');

    void sendClosePacket([_]) {
      _logger.fine('writing close packet');
      write([
        {'type': 'close'}
      ]);
    }

    if ('open' == readyState) {
      sendClosePacket();
    } else {
      // Not open yet — send the close packet once we are
      once('open', sendClosePacket);
    }

    // Force-close idle HTTP connections so pending long-poll GETs are aborted
    _httpClient.close(force: true);
  }

  // ─── Packet write ─────────────────────────────────────────────────────────

  @override
  void write(List packets) {
    writable = false;
    PacketParser.encodePayload(packets, callback: (data) {
      _doWrite(data, (_) {
        writable = true;
        emitReserved('drain');
      });
    });
  }

  // ─── Pause (called by engine before upgrading to WebSocket) ───────────────

  @override
  void pause(Function() onPause) {
    readyState = 'pausing';

    void doPause() {
      _logger.fine('paused');
      readyState = 'paused';
      onPause();
    }

    if (polling || writable != true) {
      var remaining = 0;
      if (polling) {
        remaining++;
        once('pollComplete', (_) {
          if (--remaining == 0) doPause();
        });
      }
      if (writable != true) {
        remaining++;
        once('drain', (_) {
          if (--remaining == 0) doPause();
        });
      }
    } else {
      doPause();
    }
  }

  // ─── Internal polling loop ────────────────────────────────────────────────

  void _poll() {
    _logger.fine('polling');
    polling = true;
    _doPoll();
    emitReserved('poll');
  }

  // Override onData from Transport to handle engine.io's multi-packet payload
  // format (packets separated by the record-separator character \x1e).
  @override
  void onData(data) {
    _logger.fine('polling got data $data');

    final packets = PacketParser.decodePayload(data, socket?.binaryType) as List;
    bool closed = false;

    for (final packet in packets) {
      if ('opening' == readyState && packet['type'] == 'open') {
        onOpen();
      }

      if (packet['type'] == 'close') {
        onClose({'description': 'transport closed by the server'});
        closed = true;
        break;
      }

      onPacket(packet);
    }

    if (!closed && 'closed' != readyState) {
      polling = false;
      emitReserved('pollComplete');

      if ('open' == readyState) {
        _poll(); // keep the long-poll cycle going
      } else {
        _logger.fine('ignoring poll — transport state "$readyState"');
      }
    }
  }

  // ─── URL construction ─────────────────────────────────────────────────────

  String _uri() {
    // Take a copy so we never mutate the shared query map
    final q = Map<String, dynamic>.from(query ?? {});
    final schema = (opts['secure'] == true) ? 'https' : 'http';
    return createUri(schema, q);
  }

  // ─── HTTP GET (long-poll receive) ─────────────────────────────────────────

  void _doPoll() async {
    final url = _uri();
    _logger.fine('IO xhr poll: $url');
    try {
      final request = await _httpClient.getUrl(Uri.parse(url));
      _applyExtraHeaders(request);
      final response = await request.close();

      if (response.statusCode < 200 || response.statusCode >= 300) {
        onError('xhr poll error', 'status ${response.statusCode}');
        return;
      }

      final body = await response.transform(utf8.decoder).join();
      onData(body);
    } catch (e) {
      // Catch SocketException, HttpException, etc.
      onError('xhr poll error', e.toString());
    }
  }

  // ─── HTTP POST (send) ─────────────────────────────────────────────────────

  void _doWrite(dynamic data, Function fn) async {
    final url = _uri();
    _logger.fine('IO xhr write: $url');
    try {
      final request = await _httpClient.postUrl(Uri.parse(url));
      request.headers.contentType =
          io.ContentType('text', 'plain', charset: 'UTF-8');
      _applyExtraHeaders(request);

      if (data is String) {
        request.write(data);
      } else if (data is List<int>) {
        request.add(data);
      }

      final response = await request.close();
      await response.drain<void>();
      fn(null);
    } catch (e) {
      onError('xhr post error', e.toString());
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  void _applyExtraHeaders(io.HttpClientRequest request) {
    final extra = opts['extraHeaders'];
    if (extra is Map) {
      extra.forEach((k, v) => request.headers.add(k.toString(), v.toString()));
    }
  }
}
