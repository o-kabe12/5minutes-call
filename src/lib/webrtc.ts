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

  function updateState(newState: SignalingState) {
    signalingState = newState;
  }

  const peer = new SimplePeer({
    initiator: isInitiator(passcode),
    trickle: true,
    stream: localStream,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    },
  });

  peer.on('signal', (data) => {
    console.log('📤 自分の signal を送信:', data);
    signaling.send({ type: 'signal', data });
  });

  peer.on('stream', (stream) => {
    stream.getTracks().forEach((track) => remoteStream.addTrack(track));
  });

  peer.on('connect', () => {
    console.log('✅ WebRTC: P2P接続確立しました');
    signalingState = 'connected';
    updateState('connected');
  });

  peer.on('error', (err) => {
    console.error('❌ WebRTC エラー:', err);
    signalingState = 'error';
  });
  
  peer.on('close', () => {
    console.log('❌ WebRTC: 接続が閉じられました');
    signalingState = 'disconnected';
  });
  
  peer.on('iceStateChange', (state) => {
    console.log('ℹ️ ICE状態変更:', state);
  });

  signaling.onMessage((message) => {
    console.log('📨 signaling からの受信:', message);
    if (message.type === 'signal' && message.data) {
      try {
        console.log('📥 peer.signal に渡す:', message.data);
        peer.signal(message.data);
        updateState('connecting');
      } catch (e) {
        console.error('❌ シグナリングデータ処理エラー:', e);
        updateState('error');
      }
    } else {
      console.warn('⚠️ 不明なメッセージタイプまたはデータなし:', message);
    }
  });

  console.log('🎤 取得した音声トラック:', localStream.getAudioTracks());
  localStream.getAudioTracks().forEach(track => {
    console.log('🎤 音声トラック状態:', track.id, track.enabled, track.readyState);
  });
  

  return {
    peer,
    localStream,
    remoteStream,
    state: signalingState,
  };
}

function isInitiator(passcode: string): boolean {
  const firstChar = passcode.charCodeAt(0);
  return firstChar % 2 === 0;
}
