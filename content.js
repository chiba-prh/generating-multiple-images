(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const splitIdx = urlParams.get('split_idx');
  if (splitIdx === null) return;

  console.log(`[Gemini Splitter] タブ #${splitIdx} 起動`);

  // 1. ストレージからデータを取得
  const data = await chrome.storage.local.get('geminiTask');
  if (!data.geminiTask) {
    console.error("[Gemini Splitter] データが見つかりません");
    return;
  }
  const { image, commands } = data.geminiTask;
  const myCommand = commands[parseInt(splitIdx)];

  // 2. 要素を待機する関数
  const waitForElement = (selector) => {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        const el = document.querySelector(selector);
        // Geminiの入力欄は contenteditable="true" を持っていることが多いです
        if (el && el.offsetHeight > 0) { 
          clearInterval(interval);
          resolve(el);
        }
      }, 500);
    });
  };

  // 3. 入力欄の取得（セレクターを少し広げました）
  const inputBox = await waitForElement('div[contenteditable="true"], div[role="textbox"]');
  console.log("[Gemini Splitter] 入力欄を発見");

  // 4. 画像を貼り付ける関数
  async function pasteImage(base64Data, target) {
    const res = await fetch(base64Data);
    const blob = await res.blob();
    const file = new File([blob], "image_file.png", { type: blob.type });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    target.focus();
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true
    });
    target.dispatchEvent(pasteEvent);
    console.log("[Gemini Splitter] 画像を貼り付けました");
  }

  // ★修正ポイント：inputBox を引数に渡す必要があります
  await pasteImage(image, inputBox);

  // 5. テキスト入力と送信
  // 画像の処理時間を考慮して少し長めに待機
  setTimeout(() => {
    inputBox.innerText = myCommand;
    inputBox.dispatchEvent(new InputEvent('input', { bubbles: true }));
    console.log("[Gemini Splitter] コマンドを入力:", myCommand);

    setTimeout(() => {
      const sendBtn = document.querySelector('button[aria-label*="送信"], button[aria-label*="Send"]');
      if (sendBtn && !sendBtn.disabled) {
        sendBtn.click();
        console.log("[Gemini Splitter] 送信ボタンをクリックしました");
      } else {
        console.warn("[Gemini Splitter] 送信ボタンが見つからないか、無効です");
      }
    }, 1000); 
  }, 2500); // PNGなどの重いファイルに対応するため待機を少し延長

})();