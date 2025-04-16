import { formatTime } from '@/lib/utils';

interface CallTimerProps {
  timeLeft: number;
  connected: boolean;
}

export default function CallTimer({ timeLeft, connected }: CallTimerProps) {
  return (
    <div className="text-center">
      <div className="text-lg font-medium mb-2 text-white">残り時間</div>
      <div className={`text-4xl font-bold ${
        timeLeft <= 60 ? 'text-red-600' : 'text-white'
      }`}>
        {connected ? formatTime(timeLeft) : '--:--'}
      </div>
    </div>
  );
} 