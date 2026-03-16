document.getElementById('runBtn').addEventListener('click', async () => {
  const fileInput = document.getElementById('imageInput');
  const file = fileInput.files[0];

  if (!file) {
    alert("画像を選択してください");
    return;
  }

  const commands = [
    document.getElementById('cmd1').value,
    document.getElementById('cmd2').value,
    document.getElementById('cmd3').value,
    document.getElementById('cmd4').value
  ];

  const reader = new FileReader();
  
  // ファイル読み込みが完了した時の処理
  reader.onload = async (e) => {
    console.log("画像の読み込みが完了しました");
    const imageData = e.target.result;

    try {
      // データを保存
      await chrome.storage.local.set({
        geminiTask: {
          image: imageData,
          commands: commands,
          timestamp: Date.now()
        }
      });
      console.log("ストレージに保存しました");

      // 画面サイズの計算（整数にするために Math.floor を徹底）
      const screenW = Math.floor(screen.availWidth);
      const screenH = Math.floor(screen.availHeight);
      const halfW = Math.floor(screenW / 2);
      const halfH = Math.floor(screenH / 2);

      const positions = [
        { left: 0,     top: 0 },
        { left: halfW, top: 0 },
        { left: 0,     top: halfH },
        { left: halfW, top: halfH }
      ];

      // ウィンドウを作成
      for (let i = 0; i < 4; i++) {
        chrome.windows.create({
          url: `https://gemini.google.com/app?split_idx=${i}`,
          type: 'normal', // 最初は安定性のために 'normal' でテストしましょう
          left: positions[i].left,
          top: positions[i].top,
          width: halfW,
          height: halfH
        }, (win) => {
          if (chrome.runtime.lastError) {
            console.error("ウィンドウ作成エラー:", chrome.runtime.lastError);
          } else {
            console.log(`ウィンドウ ${i} を作成しました`);
          }
        });
      }
    } catch (err) {
      console.error("実行中にエラーが発生しました:", err);
    }
  };

  // これを忘れると reader.onload が走りません！
  reader.readAsDataURL(file);
});

// プレビュー表示用
document.getElementById('imageInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.getElementById('preview');
      const container = document.getElementById('previewContainer');
      img.src = ev.target.result;
      container.style.display = 'block'; // コンテナを表示
    };
    reader.readAsDataURL(file);
  }
});