import SimplePeer from 'simple-peer';

export type SignalingState = 'waiting' | 'connecting' | 'connected' | 'disconnected' | 'error';

interface SetupResult {
  peer: SimplePeer.Instance;
  localStream: MediaStream;
  remoteStream: MediaStream;
  state: SignalingState;
}

interface Signaling {
  send: (message: any) => void;
  onMessage: (handler: (message: any) => void) => void;
}

export async function setupWebRTC(passcode: string, signaling: Signaling): Promise<SetupResult> {
  let signalingState: SignalingState = 'waiting';

  const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const remoteStream = new MediaStream();

  const peer = new SimplePeer({
    initiator: isInitiator(passcode),
    trickle: false,
    stream: localStream,
  });

  // Peerからシグナリングデータを受け取ったら送信
  peer.on('signal', (data) => {
    signaling.send({ type: 'signal', data });
  });

  // 相手からのストリームを受信したら、remoteStreamに追加
  peer.on('stream', (stream) => {
    stream.getTracks().forEach((track) => remoteStream.addTrack(track));
  });

  // シグナリングメッセージを受け取ったら、peer.signal() に渡す
  signaling.onMessage((message) => {
    if (message.type === 'signal') {
      peer.signal(message.data);
      signalingState = 'connecting';
    }
  });

  return {
    peer,
    localStream,
    remoteStream,
    state: signalingState,
  };
}

// ハッシュの最初の文字コードによって initiator を決定（簡易なルーム分け）
function isInitiator(passcode: string): boolean {
  const firstChar = passcode.charCodeAt(0);
  return firstChar % 2 === 0;
}
