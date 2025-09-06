Structural Style Transfer

PRD: 「ヴァイキング解説動画制作」ワークフロー
参照スタイル: オールマイティラボ「ダチョウの解説動画」 制作基盤: Next.js + ARC-Hunyuan-Video-7B + Mulmocast CLI + Armis

1. 参照素材取得
目的: 参照動画のスタイル情報を完全取得し、後のスタイル転写に活用する
* 動画 & 音声ダウンロード
    * yt-dlp で映像・音声を分離取得
    * 字幕が存在する場合は .srt 同時取得
    * Armis特長活用: Armis の URLインポート機能 で直接チャットパネルから取得可能
* 記事取得
    * Wikipedia API で「ヴァイキング」本文取得（JSON/HTML）
    * Armis特長活用: チャットパネルに URL 貼付→自動スクレイピング＆要約

2. 参照動画解析（スタイル抽出）
目的: 演出パターン、ショット構造、音声配置を定量化
* 音声→テキスト変換（ASR）
    * Whisper で台本化、語単位タイムスタンプ付与
* 話者分離
    * pyannote.audio でナレーション・効果音を分離
* ショット検出
    * PySceneDetect でカット境界・ショット長を抽出
* 構造分析（LMM）
    * ARC-Hunyuan-Video-7B に以下を投入：
        * ショット列（時刻＋サムネ）
        * 字幕/台本
        * 音量変化・BGMタイミング
    * 抽出項目:
        * 章立て構造
        * ナレーション割合
        * B-roll頻度
        * テロップ・効果音パターン
    * Armis特長活用: Structural Style Transfer に必要なパラメータを自動数値化し、ワークフローテンプレート化（再利用可）

3. 新規コンテンツ台本生成（ヴァイキング版）
目的: ヴァイキング情報を参照動画のスタイルで再構成
* 記事要約
    * LMMで重要トピックごとに短文化
* スタイル転写
    * 参照動画のショット長、章構成、演出パターンを適用
    * MulmoScript形式（scene, narration, broll, sfx 指定）に変換
    * Armis特長活用: Scriptタブでライブ編集＆差分ビルド確認

4. アセット収集
目的: 台本に沿ったB-roll・効果音・BGMを準備
* B-roll素材
    * Pixabay / Pexels / Wikimedia Commons から取得
    * Armis特長活用: Assetsタブで直接プレビュー・差し替え可能
* 効果音・BGM
    * CC0・商用可の音源を選定
* TTSナレーション生成
    * 日本語TTS（Style-Bert-VITS2）で参照動画の声質再現
    * Armis特長活用: Audioタブで即プレビュー＆波形編集（WaveSurfer.js）

5. タイムライン合成
目的: 台本とアセットを結合し、完成映像を生成
* 映像構築
    * Mulmocast CLI で台本+アセットを統合
    * Armis特長活用: Timelineタブでドラッグ&ドロップ修正、リアルタイム反映
* 映像レンダリング
    * FFmpeg でBGM・効果音ミキシング、字幕焼き込み、トランジション適用
    * 長さ・テンポは参照動画に±10%以内で調整
    * Armis特長活用: Canvasタブでレンダリング前に差分プレビュー

6. 出力 & 公開
目的: 完成品を多用途に展開
* mp4 + JSONワークフロー（テンプレ化）として保存
* YouTube / SNS へ即時アップロード（Armis公開API連携）
* ワークフローは次回制作時のテンプレートとして再利用可

