/**
 * ユーザーが今日既にルームを作成したかどうかをチェック
 */
// export function isCreatedToday(): boolean {
//   try {
//     const lastCreatedRoom = localStorage.getItem('lastCreatedRoom');
//     if (!lastCreatedRoom) return false;

//     const { date } = JSON.parse(lastCreatedRoom);
//     const lastCreated = new Date(date);
//     const today = new Date();

//     return (
//       lastCreated.getFullYear() === today.getFullYear() &&
//       lastCreated.getMonth() === today.getMonth() &&
//       lastCreated.getDate() === today.getDate()
//     );
//   } catch (error) {
//     console.error('Error checking room creation date:', error);
//     return false;
//   }
// }

/**
 * 指定された秒数を MM:SS 形式にフォーマット
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
} 