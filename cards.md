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
- **ウォレット残高 (2026-08-04 確認)**: **SOL 0 / トークン 0** — 入金ゼロ。財務は正直に。
- **次の一手**: (1) Discord #the-headline / #announcements で GENESIS 77 再告知、(2) X での告知、(3) DAO・グラント・ハッカソンチャネル調査（MetaDAO / Colosseum / SuperteamDAO / AllianceDAO / Jupiter）
