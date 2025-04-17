'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CallTimer from '@/components/CallTimer';
import CallControls from '@/components/CallControls';
import { setupWebRTC, SignalingState } from '@/lib/webrtc';
import { connectToSignalingServer } from '@/lib/signaling';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const passcode = params.passcode as string;
  const [connected, setConnected] = useState(false);
  const [signalingState, setSignalingState] = useState<SignalingState>('waiting');
  const [timeLeft, setTimeLeft] = useState(300);
  const [showAlert, setShowAlert] = useState(false);
  const peerRef = useRef<any>(null);
  const timerId = useRef<NodeJS.Timeout | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const setupCall = async () => {
      try {
        const { socket, send, onMessage } = connectToSignalingServer(passcode);

        onMessage((message) => {
          switch (message.type) {
            case 'participants':
              console.log('👥 現在の参加者数:', message.count);
              break;
            default:
              console.warn('未処理のメッセージタイプ:', message);
          }
        });

        const { peer, localStream, remoteStream, state } = await setupWebRTC(passcode, {
          send,
          onMessage,
        });

        peerRef.current = peer;
        localStreamRef.current = localStream;
        remoteStreamRef.current = remoteStream;

        if (localAudioRef.current) {
          localAudioRef.current.srcObject = localStream;
        }

        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
        }

        setSignalingState(state);

        peer.on('connect', () => {
          setConnected(true);
          setSignalingState('connected');
          startTimer();
        });

        peer.on('close', () => {
          setConnected(false);
          setSignalingState('disconnected');
          cleanupCall();
        });

        peer.on('error', (err: any) => {
          console.error('Peer error:', err);
          setSignalingState('error');
        });
      } catch (error) {
        console.error('Failed to setup WebRTC:', error);
        setSignalingState('error');
      }
    };

    setupCall();
    return () => cleanupCall();
  }, [passcode]);

  const startTimer = () => {
    if (timerId.current) clearInterval(timerId.current);

    timerId.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === 60) {
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 3000);
        }

        if (prev <= 1) {
          cleanupCall();
          router.push('/');
          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  };

  const cleanupCall = () => {
    if (timerId.current) {
      clearInterval(timerId.current);
      timerId.current = null;
    }

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
  };

  const handleDisconnect = () => {
    cleanupCall();
    router.push('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-sky-100 to-blue-600 tracking-tight">ルーム: <span className="font-light">{passcode}</span></h1>

        <div className="relative w-full bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 text-center">
          {showAlert && (
            <div className="absolute top-0 left-0 right-0 transform -translate-y-full bg-white-500 text-white p-3 rounded-t-lg font-medium">
              残り1分です！
            </div>
          )}

          <div className="mb-6">
            <CallTimer timeLeft={timeLeft} connected={connected} />
          </div>

          <div className="mb-6">
            {!connected && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-300">
                  {signalingState === 'waiting' && '相手の接続を待っています...'}
                  {signalingState === 'connecting' && '接続中...'}
                  {signalingState === 'error' && '接続エラーが発生しました。'}
                  {signalingState === 'disconnected' && '接続が切断されました。'}
                </p>
              </div>
            )}

            {connected && (
              <div className="bg-gradient-to-r from-sky-900 to-blue-900 p-4 rounded-lg">
                <p className="text-sky-300 font-medium">接続しました！</p>
              </div>
            )}
          </div>

          <CallControls connected={connected} onDisconnect={handleDisconnect} />

          <audio ref={localAudioRef} muted autoPlay playsInline className="hidden" />
          <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
        </div>
      </div>
    </div>
  );
}
