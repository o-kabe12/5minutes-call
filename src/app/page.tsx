
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// import { isCreatedToday } from '@/lib/utils';

export default function Home() {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCreateRoom = () => {
    // パスコードの検証：6桁の数字であることをチェック
    if (!/^\d{6}$/.test(passcode)) {
      setError('パスコードは6桁の数字を入力してください');
      return;
    }

    // // 既に今日ルームを作成済みかチェック
    // if (isCreatedToday()) {
    //   setError('既に今日はルームを作成済みです。明日また利用してください。');
    //   return;
    // }

    // ルーム作成の記録
    localStorage.setItem('lastCreatedRoom', JSON.stringify({
      date: new Date().toISOString(),
      passcode
    }));

    // ルームページへ遷移
    router.push(`/room/${passcode}`);
  };

  const handleEnterRoom = () => {
    // パスコードの検証：6桁の数字であることをチェック
    if (!/^\d{6}$/.test(passcode)) {
      setError('パスコードは6桁の数字を入力してください');
      return;
    }

    // ルームへ遷移
    router.push(`/room/${passcode}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6">
      <div className="w-full max-w-md">
        <h1 className="text-center text-4xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tight">５分通話</h1>

        <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
          <div className="mb-6">
            <label htmlFor="passcode" className="block text-left text-sm font-medium text-gray-300 mb-2">
              パスコード（6桁の数字）
            </label>
            <input
              type="text"
              id="passcode"
              maxLength={6}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
                setError('');
              }}
              placeholder="例: 123456"
            />
            {error && <p className="mt-2 text-red-600 text-xs font-medium">{error}</p>}
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={handleCreateRoom}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 font-medium"
            >
              ルームを作成する
            </button>
            <button
              onClick={handleEnterRoom}
              className="bg-gray-700 text-gray-300 py-3 px-4 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 font-medium"
            >
              ルームに入室する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}