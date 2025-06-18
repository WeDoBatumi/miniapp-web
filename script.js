let tg = null;

function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.add('show');
  clearTimeout(notification._timeout);
  notification._timeout = setTimeout(() => {
    notification.classList.remove('show');
  }, 4000);
}

function waitForTelegramReady(callback) {
  const start = Date.now();

  const interval = setInterval(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      clearInterval(interval);
      tg = window.Telegram.WebApp;
      console.log("✅ Telegram WebApp обнаружен через", Date.now() - start, "мс");
      tg.ready();
      tg.expand();
      callback();
    }
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    if (!tg) {
      showNotification("❌ Telegram WebApp API недоступен");
      console.error("Telegram WebApp API НЕ обнаружен даже через 7000 мс");
    }
  }, 7000);
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("📦 DOM загружен. Ждём Telegram.WebApp...");
  waitForTelegramReady(() => {
    console.log("✅ Telegram WebApp инициализирован");
  });
});

const textarea = document.getElementById('autoTextarea');
const counter = document.getElementById('counter');
const mediaInput = document.getElementById('mediaInput');
const mediaPreview = document.getElementById('mediaPreview');
const mediaLabel = document.getElementById('mediaLabel');
const removeBtn = document.getElementById('removeBtn');
const submitBtn = document.querySelector('.submit-btn');

const MAX_IMAGE_SIZE = 15 * 1024 * 1024;

textarea.addEventListener('input', () => {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
  const maxLength = textarea.getAttribute('maxlength');
  const currentLength = textarea.value.length;
  counter.textContent = maxLength - currentLength;
  validateForm();
});

function validateForm() {
  const hasText = textarea.value.trim().length > 0;
  const hasMedia = mediaInput.files.length > 0;
  if (hasText || hasMedia) {
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    submitBtn.style.cursor = 'pointer';
  } else {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    submitBtn.style.cursor = 'default';
  }
}

submitBtn.disabled = true;
submitBtn.style.opacity = '0.5';
submitBtn.style.cursor = 'default';

mediaInput.addEventListener('change', () => {
  const file = mediaInput.files[0];
  if (!file) return;

  mediaLabel.style.display = 'none';
  removeBtn.style.display = 'inline-block';
  mediaPreview.innerHTML = '';

  const url = URL.createObjectURL(file);

  if (file.type.startsWith('video/')) {
    const video = document.createElement('video');
    video.className = 'preview';
    video.src = url;
    video.controls = true;
    mediaPreview.appendChild(video);

    video.onloadedmetadata = () => {
      if (video.duration > 60) {
        showNotification('🙅‍♀️ Видео не должно быть дольше 60 секунд');
        mediaInput.value = '';
        mediaPreview.innerHTML = '';
        mediaLabel.style.display = 'inline-flex';
        removeBtn.style.display = 'none';
        validateForm();
      }
    };
  } else if (file.type.startsWith('image/')) {
    if (file.size > MAX_IMAGE_SIZE) {
      showNotification('🙅‍♀️ Максимум — 15 МБ для изображения');
      mediaInput.value = '';
      mediaLabel.style.display = 'inline-flex';
      removeBtn.style.display = 'none';
      validateForm();
      return;
    }
    const img = document.createElement('img');
    img.src = url;
    img.className = 'preview';
    mediaPreview.appendChild(img);
  }

  validateForm();
});

removeBtn.addEventListener('click', () => {
  mediaInput.value = '';
  mediaPreview.innerHTML = '';
  mediaLabel.style.display = 'inline-flex';
  removeBtn.style.display = 'none';
  validateForm();
});

submitBtn.addEventListener('click', async () => {
  const text = textarea.value.trim();
  const file = mediaInput.files[0];

  if (!tg) {
    showNotification("Telegram WebApp не инициализирован");
    return;
  }

  let mediaBase64 = null;
  let mediaType = null;

  if (file) {
    const buffer = await file.arrayBuffer();
    mediaBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    mediaType = file.type;
  }

  const data = {
    text,
    mediaBase64,
    mediaType,
  };

  tg.sendData(JSON.stringify(data));

  submitBtn.disabled = true;
  submitBtn.innerText = "Отправляется...";
});
// 🧪 Отладка: Telegram WebApp API доступность
try {
  alert("✅ JS загружен!");

  console.log("window.Telegram:", window.Telegram);
  console.log("window.Telegram.WebApp:", window.Telegram?.WebApp);

  if (window.Telegram?.WebApp) {
    alert("📡 Telegram API: OK");
    Telegram.WebApp.expand();
    Telegram.WebApp.ready();
    console.log("✅ Telegram.WebApp готов");
  } else {
    alert("❌ Telegram API НЕ ДОСТУПЕН");
  }
} catch (e) {
  alert("💥 Ошибка в JS: " + e.message);
  console.error("💥 JS error:", e);
}