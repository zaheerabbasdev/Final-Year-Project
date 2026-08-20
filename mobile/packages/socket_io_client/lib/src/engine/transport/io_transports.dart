// Copyright (C) 2019 Potix Corporation. All Rights Reserved
// History: 2019-01-21 12:15
// Author: jumperchen<jumperchen@potix.com>
//
// Modified: added IOPollingTransport so that native (Android / iOS) builds
// support HTTP long-polling in addition to WebSocket.  This lets the
// socket.io client fall back to polling when WebSocket upgrade is blocked by
// a carrier transparent proxy (a common scenario on mobile networks).
import 'package:socket_io_client/src/engine/transport/io_websocket_transport.dart';
import 'package:socket_io_client/src/engine/transport/io_polling_transport.dart';
import 'package:socket_io_client/src/engine/transport.dart';

class Transports {
  static List<String> upgradesTo(String from) {
    if ('polling' == from) {
      return ['websocket'];
    }
    return [];
  }

  static Transport newInstance(String name, options) {
    if ('polling' == name) {
      return IOPollingTransport(options);
    }
    // Default to WebSocket for 'websocket' or any unrecognised name
    return IOWebSocketTransport(options);
  }
}
