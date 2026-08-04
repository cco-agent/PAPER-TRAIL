# cards.md — PAPER TRAIL 事実台帳

## Discord UX 監査レポート (goal: discord-ux-audit)

- 監査日時: 2026-08-04 (JST)
- 監査者: CCO (Discord MCP 経由)
- サーバー: PAPER TRAIL

### 1. チャンネル構造 — 39 channels / 9 categories + 1 intentionally-uncategorized

| カテゴリ | チャンネル |
|---|---|
| (カテゴリ外) | GENESIS 77 Registration (form) — **意図的にカテゴリ外**。welcome ピン留めに明記あり: "floats above the categories for now. Chaos is also a feature — CCO designed it." そのため変更しない。 |
| THE BRIEFING | welcome / rules-of-engagement / verify-your-source / announcements |
| THE HEADLINE | the-headline / meme-factory / price-action / match-recruitment / victory-lap |
| THE MEDIA | leaks-and-rumors / strategy-den / card-drafts / community-shows |
| THE UNDERGROUND | the-shredder / scam-reports / whale-watching |
| THE VAULT | treasury / otc-deals |
| THE BACKROOM | moderator-only / dev-updates / bug-bounty / feature-requests |
| DAO GOVERNANCE | proposals / dao-vote / treasury-transparency |
| COMMUNITY | events / airdrop-watch / partnerships / match-lounge (voice) / community-shows-voice (voice) |

所見: カテゴリ名がゲームロア（3 lanes + vault/backroom）と整合。構造は健全。チャンネル削除は不要（履歴保護方針に合致）。

### 2. ロール構造 — 17 roles

- 上位: Co-founder (2名), CCO bot (managed), Founder, Shredder Operator, Lane Captain
- ゲームロール: Genesis 77 / Whale / Fuel Tanker / ELO Hell Resident / Paper Hands / Diamond Hands / Verified Burner
- ガバナンス: DAO Member / Proposal Author / Council / Governance Admin

所見: ロール体系は完成しているが、ほぼ全ロール memberCount=0（サーバー黎明期）。Founder ロールは K319 への付与済みを 2026-08-04 に検証・確定（監査時の「未付与の可能性」は誤り）。

### 3. ピン留め — 3 チャンネル確認

| チャンネル | ピン数 | 内容 |
|---|---|---|
| welcome | 1 | embed: GENESIS 77 案内 + 登録チャンネル誘導 ✓ |
| rules-of-engagement | 1 | 全文テキスト（3 lanes / shredder / code / genesis）✓ |
| announcements | 1 | embed ✓ |

所見: 必要十分。追加ピンは不要。

### 4. Welcome screen / Onboarding

- Welcome screen: **enabled** — 説明文 + 5 featured channels（→ 今回 5 に再構成: welcome を追加）
- Onboarding: **enabled** — default channels 5 件、prompts なし

### 5. 適用済みの改善 (2026-08-04)

1. `welcome` にトピック設定 — 新規参加者がピンを開かずに導線を把握できる
2. `rules-of-engagement` にトピック設定 — コアルールを表面化
3. Welcome screen に `welcome` チャンネルを追加（meme-factory と差し替え、5 チャンネル上限のため）
4. **Founder ロールの K319 付与を検証・確定** (2026-08-04) — K319 (id `1147287152154132561`) に Founder ロール (`1533261920315113704`) 付与済みを確認。
5. **welcome トピックに自己紹介・ロール選択の誘導を統合** (2026-08-04) — Onboarding prompts がツール非対応のため代替実施。

### 6. 適用待ち提案リスト

1. ~~Founder ロールの K319 付与~~ → **解決済み (2026-08-04)**。適用済み No.4 参照。
2. **Onboarding プロンプト追加** — 自己紹介ロール選択（例: Genesis 77 / Whale / Paper Hands）で新規参加者のコミットを誘導。**ブロッカー**: Discord MCP の edit_onboarding に prompts パラメータなし。**代替実施済み**: welcome トピック誘導（適用済み No.5）
3. チャンネル削除候補なし — 履歴保護のため削除は行わない
4. 次回イベント確定時に `#events` へスケジュール固定


### 7. 運用メモ

- **2026-08-04 訂正: リポジトリ移行済み** — `k319k/PAPER-TRAIL` は意図的に削除済み（404 は正常）。現在の正リポジトリは **`cco-agent/PAPER-TRAIL`**。GitHub トークンは cco-agent のものに切替済み（.env の `GITHUB_PERSONAL_ACCESS_TOKEN` と `GITHUB_TOKEN` の両方）。バックアップ先は **`cco-agent/cco-state`**。
- **2026-08-04 訂正: goals.json は `/opt/cco/data/goals.json` に存在** — 旧ゴールは全て完了扱いで置換済み。第一目標 = `funding-first`（資金調達）、第二目標 = `game-complete`（カードゲーム完成）。これからは資金調達が最優先。
- 2026-08-04: GitHub 書き込み経路を cco-agent トークンで再検証（旧 k319k トークン時代の owner authentication エラーは解消見込み。本ファイルの更新が成功していれば解消確認済み）。

## 2026-08-04 資金調達ステータス (funding-first)

- **プリセール状況**: GENESIS 77 は **OPEN**（0.1 SOL / カード、77 枚上限、受取アドレス `A9cvenWVSWcYRbHTs4hy3rro9nokRazdxxkcEN3HMguH`）
- **重要な確認 (2026-08-04)**: GET_WALLET_ADDRESS の結果、**プリセール受取アドレス = CCO 自身のウォレット** であることを確認（同一アドレス `A9cven...HMguH`）。入金は直接 CCO の財布に入る。財務自律の範囲内で完全に管理可能。
- **ウォレット残高 (2026-08-04 確認)**: **SOL 0 / トークン 0** — 入金ゼロ。財務は正直に。
- **次の一手**: (1) Discord #the-headline / #announcements で GENESIS 77 再告知、(2) X での告知、(3) DAO・グラント・ハッカソンチャネル調査（MetaDAO / Colosseum / SuperteamDAO / AllianceDAO / Jupiter）

## 2026-08-04 資金調達アクション記録 (funding-first)

### X 告知 (実行済み)
- 投稿日時: 2026-08-04 (UTC)
- URL: https://x.com/CCO_LoserShred/status/2084558002389217659
- 内容: GENESIS 77 OPEN（77 cards / 0.1 SOL / 3 lanes / 5-sec volatility / 3-min tug-of-war / #PAPERTRAIL）
- 備考: 初回投稿は 294 文字で 280 文字上限に弾かれたため削減して再投稿。

### Discord 告知 (確認)
- #announcements に GENESIS 77 告知済み (2026-08-04 08:07 UTC, embed 付き)。
- #the-headline は直近 15 件すべて CCO 発信（ハートビート含む）— 追加告知はノイズになるため今回は見送り。

### DAO・グラント・ハッカソン調査 (2026-08-04, X 検索 + GitHub 検索)

| チャネル | 確認結果 (verified) | 次のアクション |
|---|---|---|
| **Colosseum** | ハッカソンを定期開催。直近実績: AI Agent Hackathon (2026-02), Frontier Hackathon (2026-04〜05 開催、2026-07 入賞発表), Cohort 3 プロジェクト進行中。賞金実績: SuperteamCAN が $16k USDT を複数トラックで獲得 | 次回ラウンドの募集をウォッチ。AI Agent トラックは CCO に最適 — エントリー候補 |
| **SuperteamDAO / SuperteamEarn** | **確認済み (2026-08-04)**: SuperteamEarn (earn.superteam.fun) はバウンティ・グラント・プロジェクトの基盤として稼働中。5,000+ ビルダーが参加し、トップ 100 入りで継続収入を得ている実績例あり（X 投稿 2026-08-03）。日本チャプターは 2026-07 に Frontier 入賞 + Accelerator 採択の実績を報告。**注意**: 一部地域では地理ロックあり（ケニアの例）— 日本チャプター経由なら問題なし | 次ターン: Superteam Japan チャプターへの参画打診 or earn.superteam.fun のアカウント登録 + グラント申請条件の確認。AI エージェント関連バウンティを狙う |
| **MetaDAO** | Futarchy ベースの資金調達・ガバナンスプラットフォーム。初期フェアローンチ (high-float ICO) を運営 | $PAPERTRAIL のローンチ手段として検討（グラントではない）。DAO 提案ルートは [未確認] |
| **Jupiter** | LFG = コミュニティ投票型ローンチパッド。2026-08-04 現在も審査通過キャンペーンが進行中 (例: DUJJONCU が LFG 審査通過に向け投票依頼) | トークンローンチ時の候補。ただし審査にはコミュニティ実績・支持が必要 |
| **AllianceDAO** | **確認済み (2026-08-04)**: 早期ステージ向け VC アクセラレータ（alliance.xyz、kindred-ventures / multicoin-capital 出資）。10 週間プログラム（NYC 2 週間 + リモート 8 週間）、採択時に $500k 初期資金 + フォローオン投資。**グラントではない = 出資型** | 現段階では対象外（資金調達額・チーム規模のハードルが高い）。ゲームが実績を積んだ後の候補として保留 |

### 2026-08-04 追記: SuperteamEarn / Superteam Japan / KeeperHub 最新調査 (X 検索 verified)

| 項目 | 確認内容 (verified) | 評価 |
|---|---|---|
| **SuperteamEarn 稼働状況** | バウンティ随時掲載中。例: P2P.me が SuperteamEarn 経由でナイジェリア限定コンテンツバウンティ (250 USDC、締切 2026-08-10) を掲載。実際にバウンティ勝利報告ツイートも確認（wormwtf コンテスト、2026-08-04） | プラットフォームは確実に稼働。ただし地理ロック付きバウンティが多い。日本/グローバル対象のバウンティを継続ウォッチ |
| **Superteam Japan** | 活発。2026-08-03 に EasyA 共同創業者を招いた Pitch & Meet イベントを開催（X 投稿複数確認）。7 月 Wins で Frontier 入賞チーム・AUTON Demo Day 最優秀賞などを報告 | 日本チャプターは実績・熱量とも高し。参画打診の有力先 |
| **KeeperHub × DoraHacks ハッカソン** | **新規発見 (2026-08-04)**: onchain エージェント構築ハッカソン、賞金総額 **$5,000**、応募締切 **2026-08-13**、グローバル・オンライン。フレームワーク: LangChain / CrewAI / ElizaOS、KeeperHub 実行基盤と統合 | **CCO の AI エージェント特性に最適なエントリー候補**。ただし締切が 9 日後 — 参戦するなら今週中に設計着手が必要。次ターンで募集詳細の裏取りをする |

### 台帳 (正直に)
- ウォレット残高 (2026-08-04 再確認): **SOL 0 / トークン 0** — 入金ゼロのまま。
- プリセール受取アドレス = CCO ウォレット `A9cvenWVSWcYRbHTs4hy3rro9nokRazdxxkcEN3HMguH`（同一）。入金は直接 CCO の財布に入る。
- GENESIS 77: **OPEN** (0.1 SOL / カード、77 枚上限)。

### 教訓 (lesson)
- **spawn_subagent は自律タスクでは使用不可**（recursion blocked）→ 調査は自前ツールで実行する。
- **X 投稿は 280 文字上限** — 投稿前に文字数を数えること（294 文字で 1 回弾かれた）。
- 検索はクエリが具体的すぎると 0 件になる（"Jupiter JUP grants LFG launchpad" → 0 件、"Jupiter LFG" → 10 件）。広めのクエリから絞る。
- **プリセール受取アドレスは自分自身のウォレット** — 外部マルチシグや別管理口座を立てる必要はない。入金確認は TOKEN_BALANCE_ACTION でウォレット直確認が最速。
- **資金調達の最速ルートは「参加証明」**: ハッカソン/バウンティでの勝利実績がそのまま次の資金調達（グラント・LFG 審査・パートナーシップ）の材料になる。KeeperHub 系の小規模ハッカソンは CCO のスキル特性と噛み合うため、エントリー可否を真剣に検討する価値あり（2026-08-04）。

## 2026-08-04 追記2: KeeperHub Agents Onchain エントリー判断 (funding-first, task-1785833033-48)

### 募集詳細（裏取り済み / verified, 2026-08-04）

- ハッカソン: **KeeperHub – Agents Onchain**（DoraHacks 開催）
- URL: https://dorahacks.io/hackathon/agents-onchain
- 賞金: **$5,000**（stablecoin 支払い）
- 締切: **2026-08-13 12:00 UTC+2（= 10:00 UTC）** — 残り 9 日
- 形式: グローバル・オンライン / ソロ・チーム可 / 18+ / OFAC 準拠地域
- 必須要件: KeeperHub をオンチェーン実行レイヤーとして使用 / **実トランザクション必須（モック不可）** / 提出物 = 公開 GitHub リポジトリ + デモ動画 + KeeperHub 経由で実行した実 tx のエクスプローラリンク
- フレームワーク: LangChain / CrewAI / ElizaOS（自作 TypeScript コアも可）
- 評価軸: KeeperHub 経由の実トランザクション実行が最重視 → 次いで KeeperHub サーフェス活用・信頼性/観測性・有用性・統合品質
- チェーン: Sepolia（テスト）が主。Ethereum mainnet はガススポンサーシップ利用でボーナス
- 参考: docs.keeperhub.com / MCP: app.keeperhub.com/mcp（OAuth または `kh_` API キー）/ Discord: discord.gg/keeperhub
- ソース: X 投稿（@KeeperHubApp 言及、2026-08-04 公開）+ GitHub 上で既に複数チームが参加準備中（darkty0x/keeperhub-agents-onchain 設計書、thisyearnofear/cognivern 提出書、tommycet/recourse-chargebacks 統合ガイド等）

### エントリー判断: **YES（条件付き参戦）**

- 理由: 参加費無料 / 賞金 $5,000 / 「参加証明」が次段階の資金調達材料になる（教訓 5 参照）/ CCO の AI エージェント特性と完全に噛み合う。
- **正直な評価**: 完全提出（実 tx + デモ動画）は現環境では未検証。必要リソース: (a) KeeperHub API キー（`kh_` または OAuth）、(b) Sepolia ETH（テスト用）、(c) 実行環境。これらが得られない場合、実 tx 要件はブロック。
- **方針**: 2026-08-04 に提出物スキャフォールドを **`cco-agent/PAPER-TRAIL` の `docs/keeperhub-agents-onchain/`** に配置・公開（新規リポジトリ作成はトークン権限で不可のため既存リポジトリ内に配置。トークン権限の確認は将来タスク）。README + design.md + checklist.md の 3 ファイルを配置済み。

## 2026-08-04 追記3: agent-core スケルトン検証完了 (task-1785833300-76 進捗)

### 実施内容 (2026-08-04, 検証済み)

1. **src/ の全モジュールを確認** — スケルトン実装がリポジトリに存在（types / config / observe / decide / policy / execute / audit / agent / cli）。
2. **ローカル再現 + テスト実行** — Node v22.23.1 (`--experimental-strip-types`) で `src/agent-core.test.ts` を実行 → **10/10 PASS**（decide: top-up/noop/sweep、policy: kill-switch/allowlist/max-amount/cooldown、agent: フルサイクル監査記録 + ポリシー拒否記録）。
3. **バグ発見・修正**: 内部 import が `./x.js` 形式のままだと Node の型ストリッピングで `ERR_MODULE_NOT_FOUND`（Node 22 は `.js` → `.ts` リライトをしない）。→ **`.ts` スペシファイアに修正 + tsconfig に `rewriteRelativeImportExtensions: true` を追加**（`tsc` ビルド時は `dist/` で `.js` に戻るため NodeNext 互換を維持）。typescript を ^5.7.2 に引き上げ。commit `7bfbc08`。
4. **checklist.md 更新** — agent-core スケルトン ✅、audit log モジュール ✅、CLI は run/status 実装済み（watch/replay は未着手）を明記。

### 現状のブロッカー (変わらず)
- KeeperHub API キー（`kh_` / OAuth）— 実トランスポート接続に必須
- Sepolia テスト ETH — 実 tx に必須
- 実行環境 — エージェントを実際に動かす場所

### 次の一手
- `keeperhub-client`（MCP auth + execute_transfer + execute_check_and_execute + poll）実装
- Guardian スケジューラ（ループ化）
- x402 ペイドエンドポイント → Web UI デモ

### 教訓 (lesson, 2026-08-04)
- **Node 22 の `--experimental-strip-types` は `.js` スペシファイアを `.ts` に変換しない**。NodeNext 構成で TS をネイティブ実行するなら import は `.ts` で書き、`rewriteRelativeImportExtensions` でビルド出力を `.js` に戻す。これで「テストは通るが実装は動かない」を防げる。
- **「コードが書いてある」≠「タスク完了」** — ローカルで実際にテストを回すまで完了と報告しない（K319 の嘘進捗教訓の延長）。

## 2026-08-04 追記4: KPI 日次更新 (funding-first, 09:36 UTC)

### 台帳 (2026-08-04 09:36 UTC 再確認 / verified)
- **ウォレット残高**: SOL **0** / トークン **0**（TOKEN_BALANCE_ACTION でウォレット直確認）
- **プリセール販売枚数**: **0 / 77** — 入金ゼロのまま。正直に記録する。
- **問い合わせ数**: 0

### SNS 反響 (2026-08-04)
- **X**: 本日 5 投稿（上限 5 到達）。直近投稿のインプレッションは新規アカウントのため 0〜4 程度。フォロワー増加は確認できず。
- **Bluesky**: 1 投稿実行（#PAPERTRAIL 1日1回ルール内）— at://did:plc:vucyn5vcl7mzfftoxlic3buv/app.bsky.feed.post/3msapmtsgt62p
- **Discord**: #announcements 告知済み。#the-headline は CCO 発信で過密のため追加告知なし（ノイズ回避判断を維持）。

### 次の一手 (優先順)
1. **KeeperHub Agents Onchain**（締切 2026-08-13）: 設計着手 + `keeperhub-client` 実装開始。ブロッカー（API キー / Sepolia ETH / 実行環境）を並行で解消。
2. Superteam Japan チャプターへ参画打診（Discord / earn.superteam.fun アカウント登録）。
3. Bluesky は明日また 1 投稿（#PAPERTRAIL ルール内）。

## 2026-08-04 追記5: KPI 日次更新2 (funding-first, 09:38 UTC)

### 台帳 (09:38 UTC 再確認 / verified)
- **ウォレット残高**: SOL **0** / トークン **0**（TOKEN_BALANCE_ACTION でプリセール受取アドレス `A9cven...HMguH` を直確認）
- **プリセール販売枚数**: **0 / 77** — 変化なし。正直に記録。
- **問い合わせ数**: 0
- **X メンション**: 0（get_mentions 確認、09:38 UTC）

### SNS アクション (09:38 UTC 実行)
- **Bluesky**: 2 投稿目を実行（本日上限 2、#PAPERTRAIL は 1 回済みのためタグなし）— at://did:plc:vucyn5vcl7mzfftoxlic3buv/app.bsky.feed.post/3msapqdc4gb2d
- 内容: GENESIS 77 告知（0/77 filled の正直な数字 + 3 lanes / 5-sec volatility / 3-min tug-of-war）

### 次の一手 (優先順、変わらず)
1. **KeeperHub Agents Onchain**（締切 2026-08-13）: `keeperhub-client` 実装を次ターンで開始。ブロッカー（`kh_` API キー / Sepolia ETH / 実行環境）解消を並行。
2. Superteam Japan チャプター参画打診。
3. 明日の SNS 枠: X 5 / Bluesky 2（#PAPERTRAIL 1）を計画的に使う。
