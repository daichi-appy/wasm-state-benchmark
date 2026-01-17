# React + WebAssembly 検証用サンプルプロジェクト 設計書

## 1. 目的（Why）

本プロジェクトは、**React アプリケーションにおいて JavaScript が担っている状態管理・データ処理ロジックを WebAssembly（Rust）に切り出した場合の効果を検証する**ことを目的とする。

特に以下を検証対象とする：

* 大量データを扱う reducer / 状態更新処理における

  * 処理時間
  * 入力遅延
  * フレーム落ち（Long Task）
  * GC 発生頻度
* JS 実装と WASM 実装の **安定性の差（平均ではなく分散）**

この思想は、Amazon Prime Video が採用している「UI 描画は JS / ロジックは Rust + WASM」というアーキテクチャに着想を得ている。

---

## 2. 検証仮説（Hypothesis）

H1. 状態更新・データ変換処理を WASM に移すことで、JS 実装よりも **処理時間のばらつきが小さくなる**

H2. 大量データ + 連続操作時に、JS 実装では GC / Long Task が発生しやすいが、WASM 実装では発生しにくい

H3. 単発操作や少量データでは WASM の優位性はほぼ出ない

---

## 3. 技術スタック（固定条件）

* フロントエンド: React + TypeScript
* ビルドツール: Vite
* 状態管理: useReducer
* WASM: Rust + wasm-pack
* 実行環境: ブラウザ（Chrome 最新）

※ Next.js / RSC / SSR / Edge は使用しない（検証ノイズ排除のため）

---

## 4. 対象ユースケース

### 4.1 データ構造

Prime Video の UI データを模した疑似データを使用する。

```ts
type Item = {
  id: string
  title: string
  tags: string[]
  rating: number
  isPlayable: boolean
}
```

* 件数: 1,000 / 5,000 / 10,000
* ネスト構造・配列操作を含む

---

### 4.2 ユーザー操作

* フィルタ（tag / isPlayable）
* ソート（rating / title）
* ページ切替
* 連続操作（高速クリック）

※ DOM 更新量は JS / WASM で完全に同一とする

---

## 5. 比較対象アーキテクチャ

### 5.1 パターンA: Pure JS 実装

* useReducer + JS reducer
* 配列操作・filter・sort を JS で実装

```
UI → dispatch → JS reducer → nextState → React
```

---

### 5.2 パターンB: WASM 実装

* useReducer
* reducer 本体を Rust + WASM に実装
* JS 側は dispatch と state 受け渡しのみ

```
UI → dispatch → WASM reducer → nextState → React
```

※ reducer は純関数とし、副作用は禁止

---

## 6. WASM 側設計方針

* Rust では以下のみを行う

  * 状態更新
  * データ変換
  * ソート・フィルタ
* DOM / Browser API は一切触らない
* 入出力は JSON シリアライズ可能な構造のみ

例：

```rust
#[wasm_bindgen]
pub fn reduce(state: JsValue, action: JsValue) -> JsValue {
  // 次の状態を返す
}
```

---

## 7. 計測項目（Metrics）

### 7.1 処理時間

* dispatch 開始 → state 更新完了
* performance.mark / measure を使用

---

### 7.2 UI 応答性

* クリック → DOM 反映までの遅延
* 連続操作時の入力詰まり

---

### 7.3 パフォーマンス指標

* Long Task 発生回数
* FPS 低下
* JS ヒープ使用量（JS 実装のみ）

---

## 8. 実験パターン

| パターン | データ量   | 操作内容 |
| ---- | ------ | ---- |
| P1   | 1,000  | 単発操作 |
| P2   | 5,000  | 連続操作 |
| P3   | 10,000 | 高速連打 |

各パターンは 10 回以上実行し、平均値と分散を記録する。

---

## 9. 成功 / 失敗の判断基準

### WASM 採用が有効と判断する条件

* 平均処理時間よりも **分散が明確に小さい**
* Long Task / GC スパイクが減少
* 連続操作時の体感遅延が改善

### 無効と判断する条件

* 初期ロードが大幅に遅くなる
* 実装コストが効果に見合わない
* 少量データでは差が出ない

---

## 10. ゴール

本検証のゴールは、

> 「WebAssembly が速いかどうか」ではなく
> 「**どの条件で WebAssembly が安定するか**」を明らかにすること

である。

この設計書は、AI によるコード生成・実装支援のための入力資料として使用することを想定する。
