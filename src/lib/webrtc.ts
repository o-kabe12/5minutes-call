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
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
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
  });

  signaling.onMessage((message) => {
    console.log('📨 signaling からの受信:', message);
    if (message.type === 'signal') {
      console.log('📥 peer.signal に渡す:', message.data); 
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

function isInitiator(passcode: string): boolean {
  const firstChar = passcode.charCodeAt(0);
  return firstChar % 2 === 0;
}
