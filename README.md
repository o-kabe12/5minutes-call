# 5分通話

1日1回、パスコードを使って5分間だけ通話できるWebアプリケーション。

## 概要

「5分通話」は、ユーザーが1日1回だけ作成できる4桁のパスコードを使って、5分間だけの音声通話を実現するWebアプリケーションです。
シンプルなUIと機能に絞り、短い時間で集中した会話を楽しむことができます。

## 主な機能

- 4桁のパスコードでルーム作成（1日1回のみ）
- WebRTCを使用したブラウザ間の音声通話
- 5分間の通話タイマー
- 通話終了1分前の警告アラート

## 技術スタック

- フロントエンド: Next.js, TypeScript, TailwindCSS
- WebRTC: simple-peer
- デプロイ: Cloudflare Pages
- シグナリングサーバー: Cloudflare Workers & Durable Objects

## 開発方法

### 必要条件

- Node.js 18.0以上
- npm 9.0以上

### セットアップ

```bash
# インストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# 本番環境の起動
npm run start
```

### デプロイ

Cloudflare Pagesにデプロイするには:

1. Cloudflareアカウントを作成
2. Cloudflare Pagesにプロジェクトを連携
3. `wrangler.toml`の設定に従ってデプロイ

```bash
# Cloudflare Workersのデプロイ
npx wrangler deploy
```

## 使い方

1. トップページで4桁のパスコードを入力してルームを作成
2. 作成されたルームのURLを相手に共有
3. 相手がURLにアクセスし同じパスコードを入力
4. 両者が接続されると自動的に5分間の通話が開始
5. 5分経過すると自動的に通話が終了

## ライセンス

ISC 