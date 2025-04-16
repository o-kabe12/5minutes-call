export function connectToSignalingServer(passcode: string): {
  socket: WebSocket;
  send: (message: any) => void;
  onMessage: (handler: (message: any) => void) => void;
} {
  const socket = new WebSocket(`wss://5minutes-call.koo710128.workers.dev/room/${passcode}`);

  const listeners: ((msg: any) => void)[] = [];
  console.log('WebSocket状態:', socket.readyState);

  socket.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      listeners.forEach((listener) => listener(data));
    } catch (err) {
      console.error('受信メッセージのパースエラー:', err);
    }
  });

  socket.addEventListener('open', () => {
    console.log('✅ WebSocket接続が確立しました');
  });

  socket.addEventListener('close', () => {
    console.log('🔌 WebSocket接続が切断されました');
  });

  socket.addEventListener('error', (err) => {
    console.error('❌ WebSocketエラー:', err, err.target);
  });

  const send = (message: any) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      socket.addEventListener('open', () => {
        socket.send(JSON.stringify(message));
      });
    }
  };

  const onMessage = (handler: (message: any) => void) => {
    listeners.push(handler);
  };

  return { socket, send, onMessage };
}
