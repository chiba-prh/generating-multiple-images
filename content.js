(async () => {
  // 1. URLから「自分は何番目のタブか」を判定
  const urlParams = new URLSearchParams(window.location.search);
  const splitIdx = urlParams.get('split_idx');

  if (splitIdx === null) return; // 拡張機能以外から開いた場合は何もしない

  // 2. ストレージからデータ（画像とコマンド）を取得
  const data = await chrome.storage.local.get('geminiTask');
  if (!data.geminiTask) return;

  const { image, commands } = data.geminiTask;
  const myCommand = commands[parseInt(splitIdx)];

  // 3. ページが完全に読み込まれる（入力欄が出る）のを待つ
  const waitForElement = (selector) => {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) {
          clearInterval(interval);
          resolve(el);
        }
      }, 500);
    });
  };

  // Geminiの入力欄（role="textbox"）を待つ
  const inputBox = await waitForElement('div[role="textbox"]');

  // 4. 画像を貼り付ける (Base64 -> Blob -> ClipboardEvent)
  async function pasteImage(base64Data) {
    const res = await fetch(base64Data);
    const blob = await res.blob();
    const file = new File([blob], "image.png", { type: "image/png" });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true
    });

    inputBox.dispatchEvent(pasteEvent);
  }

  await pasteImage(image);

  // 画像のアップロード処理に少し時間がかかる場合があるため、一瞬待機
  setTimeout(() => {
    // 5. テキストを入力
    inputBox.innerText = myCommand;
    // 入力イベントを発生させて、Gemini側に文字が入ったことを認識させる
    inputBox.dispatchEvent(new InputEvent('input', { bubbles: true }));

    // 6. 送信ボタンをクリック
    setTimeout(() => {
      // aria-labelが「メッセージを送信」または「Send message」のボタンを探す
      const sendBtn = document.querySelector('button[aria-label*="送信"], button[aria-label*="Send"]');
      if (sendBtn) {
        sendBtn.click();
      }
    }, 1000); // テキスト入力後の微調整時間
  }, 1500); // 画像貼り付け後の待ち時間

})();