export function connectToSignalingServer(passcode: string): { socket: WebSocket; send: (message: any) => void; onMessage: (handler: (message: any) => void) => void } {
  const socket = new WebSocket(`wss://5minutes-call.koo710128.workers.dev/room/${passcode}`);
  const listeners: ((msg: any) => void)[] = [];

  // WebSocketの状態ログを追加
  socket.addEventListener('open', () => {
    console.log('✅ シグナリングサーバーに接続しました');
  });

  socket.addEventListener('close', () => {
    console.log('🔌 シグナリングサーバーから切断されました');
  });

  socket.addEventListener('error', (err) => {
    console.error('❌ シグナリングサーバー接続エラー:', err);
  });

  socket.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('📩 シグナリングサーバーからの受信:', data);
      listeners.forEach((listener) => listener(data));
    } catch (err) {
      console.error('受信メッセージのパースエラー:', err);
    }
  });

  const send = (message: any) => {
    const enrichedMessage = {
      ...message,
      roomId: passcode
    };
    
    const json = JSON.stringify(enrichedMessage);
    console.log('📤 シグナリングサーバーへ送信:', enrichedMessage);

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(json);
    } else {
      console.log('⏳ WebSocket接続待機中。接続後に送信します');
      const sendOnOpen = () => {
        socket.send(json);
        socket.removeEventListener('open', sendOnOpen);
      };
      socket.addEventListener('open', sendOnOpen);
    }
  };

  const onMessage = (handler: (message: any) => void) => {
    listeners.push(handler);
  };

  return { socket, send, onMessage };
}