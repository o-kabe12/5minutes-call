import SimplePeer from 'simple-peer';

export type SignalingState = 'waiting' | 'connecting' | 'connected' | 'disconnected' | 'error';

interface SetupResult {
  peer: SimplePeer.Instance;
  localStream: MediaStream;
  remoteStream: MediaStream;
  state: SignalingState;
  updateState: (state: SignalingState) => void;
}

interface Signaling {
  send: (message: any) => void;
  onMessage: (handler: (message: any) => void) => void;
}

// パスコードからイニシエーターかどうかを判定する関数
function isInitiator(passcode: string): boolean {
  if (!passcode || passcode.length === 0) return false;
  const firstChar = passcode.charCodeAt(0);
  const isInit = firstChar % 2 === 0;
  console.log('🔢 initiator判定:', passcode, firstChar, isInit);
  return isInit;
}

export async function setupWebRTC(passcode: string, signaling: Signaling): Promise<SetupResult> {
  let signalingState: SignalingState = 'waiting';
  const initiator = isInitiator(passcode);
  
  console.log('🔄 WebRTC初期化: initiator =', initiator, 'passcode =', passcode);

  const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  console.log('🎤 取得した音声トラック:', localStream.getAudioTracks());
  localStream.getAudioTracks().forEach(track => {
    console.log('🎤 音声トラック状態:', track.id, track.enabled, track.readyState);
  });
  
  const remoteStream = new MediaStream();

  function updateState(newState: SignalingState): void {
    console.log('🔄 状態更新:', signalingState, '->', newState);
    signalingState = newState;
  }

  // 明示的にinitiatorフラグを設定
  const peer = new SimplePeer({
    initiator: initiator,
    trickle: false, // まずはfalseで試す
    stream: localStream,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
    },
  });

  // デバッグ用のログ追加
  console.log('🔧 peer作成完了:', peer);

  peer.on('signal', (data) => {
    console.log('📤 自分の signal を送信:', data);
    signaling.send({ type: 'signal', data });
  });

  peer.on('stream', (stream) => {
    console.log('🎵 リモートストリーム受信:', stream.id);
    stream.getTracks().forEach((track) => remoteStream.addTrack(track));
  });

  peer.on('connect', () => {
    console.log('✅ WebRTC: P2P接続確立しました');
    updateState('connected');
    // 接続確認用のデータ送信
    peer.send('接続テスト');
  });

  peer.on('data', (data) => {
    console.log('📩 データ受信:', data.toString());
  });

  peer.on('error', (err) => {
    console.error('❌ WebRTC エラー:', err);
    updateState('error');
  });

  // シグナリングメッセージの処理
  signaling.onMessage((message) => {
    console.log('📨 signaling からの受信:', message);

    if (message.type === 'connected') {
      console.log('✅ シグナリングサーバーに接続しました');
    }
    else if (message.type === 'participants') {
      console.log('👥 参加者数:', message.count);
      
      // 参加者が2人になったら、かつinitiatorではない場合は明示的にstartメッセージを送信
      if (message.count === 2) {
        console.log('👥 参加者が揃いました');
        if (!initiator) {
          // 非initiator側からstartメッセージを送信
          signaling.send({ type: 'ready_to_connect' });
        } else {
          // イニシエーターの場合はシグナリングを開始
          console.log('🚀 イニシエーターとしてシグナリングを開始します');
          // SimplePeerが自動的にシグナリングを開始するはず
        }
      }
    }
    else if (message.type === 'ready_to_connect' && initiator) {
      // initiator側がシグナリングを開始
      console.log('🚀 接続開始を要求されました。シグナリングを開始します');
      // SimplePeerを再起動してオファーを作成
      // 注: _createOfferなどの内部メソッドにはアクセスできないため、
      // 代わりにシグナリングプロセスをリセットする方法を使用
      if (initiator) {
        try {
          // restart()メソッドがあれば使用
          if (typeof (peer as any).restart === 'function') {
            (peer as any).restart();
          } else {
            // restartがなければ、新しいデータを送信して接続を促す
            peer.send('initiate-connection');
          }
        } catch (e) {
          console.error('⚠️ restart試行エラー:', e);
          // エラーが発生した場合はオファーを作成するためのシグナルを手動で送信
          peer.signal({type: 'renegotiate', renegotiate: true});
        }
      }
    }
    else if (message.type === 'signal' && message.data) {
      try {
        console.log('📥 peer.signal に渡す:', message.data);
        peer.signal(message.data);
        updateState('connecting');
      } catch (e) {
        console.error('❌ シグナリングデータ処理エラー:', e);
      }
    }
  });

  // 接続開始のためのトリガー
  if (initiator) {
    // タイマーを使って遅延実行
    setTimeout(() => {
      console.log('⏱️ タイムアウト後にinitiatorとして接続開始を試みます');
      // 強制的にネゴシエーションを開始
      if (typeof (peer as any).negotiate === 'function') {
        console.log('🔄 negotiate()メソッドを呼び出します');
        (peer as any).negotiate();
      } else {
        // 無理やりシグナリングを開始するための処理
        console.log('🔄 シグナリングプロセスを強制的に開始します');
        signaling.send({ type: 'force_initiate' });
      }
    }, 2000);
  }

  // イベントリスナーを追加して接続状態を監視
  peer.on('close', () => {
    console.log('🔌 接続が閉じられました');
    updateState('disconnected');
  });

  return {
    peer,
    localStream,
    remoteStream,
    state: signalingState,
    updateState
  };
}