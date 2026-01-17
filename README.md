# React + WebAssembly パフォーマンス検証

React アプリケーションにおいて、状態管理ロジックを **JavaScript** と **WebAssembly (Rust)** で実装した場合のパフォーマンスを比較検証するプロジェクトです。

## 検証の目的

Amazon Prime Video が採用している「UI描画はJS / ロジックはRust+WASM」というアーキテクチャに着想を得て、以下を検証します：

- 大量データのフィルタ・ソート処理における処理時間の差
- 処理時間の**ばらつき（分散）**の違い
- どの条件でWASMが有効かを明らかにする

## セットアップ

### 必要な環境

- Node.js 18+
- Rust（rustup経由でインストール）
- wasm-pack

### インストール手順

```bash
# 1. 依存パッケージをインストール
npm install

# 2. wasm-pack をインストール（未インストールの場合）
cargo install wasm-pack

# 3. WASM モジュールをビルド
npm run build:wasm

# 4. 開発サーバーを起動
npm run dev
```

## 使い方

1. ブラウザで `http://localhost:5173` を開く
2. **Data Size** を選択（10,000 / 20,000 / 50,000）
3. **Load Data** ボタンでデータを読み込む
4. **Run Benchmark** ボタンで JS vs WASM の比較を実行

### ベンチマーク結果の見方

| 列 | 説明 |
|---|---|
| Operation | テストした操作（フィルタ、ソートなど） |
| JS | JavaScript の平均処理時間 |
| WASM | WebAssembly の平均処理時間 |
| Speedup | 速度向上率（1以上ならWASMが速い） |

## プロジェクト構成

```
├── src/
│   ├── components/     # React UIコンポーネント
│   ├── reducers/       # JS版・WASM版の状態管理
│   ├── utils/          # データ生成・計測ユーティリティ
│   └── types/          # TypeScript型定義
├── wasm-reducer/       # Rust WASMモジュール
│   ├── src/lib.rs      # Rust実装
│   └── Cargo.toml
└── CLAUDE.md           # 設計書
```

## アーキテクチャ

### JavaScript版
```
UI操作 → jsReducer() → 新しいState → React再描画
```
- 毎回全データをコピー・フィルタ・ソート

### WebAssembly版
```
UI操作 → wasmXxx() → ViewState（軽量） → React再描画
```
- データはWASM内部に保持
- 操作結果の軽量なViewStateのみをJSに返却
- 表示用アイテムは必要時に取得

## npm スクリプト

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run build:wasm` | WASMモジュールのビルド |
| `npm run build:all` | WASM + アプリの全ビルド |

## 技術スタック

- **フロントエンド**: React 19 + TypeScript
- **ビルド**: Vite
- **WASM**: Rust + wasm-pack + wasm-bindgen
- **状態管理**: useReducer (JS) / 内部State (WASM)
