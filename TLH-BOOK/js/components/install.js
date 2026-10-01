/* ═══ install — mount() ปุ่มขวาบน · prompt() ปุ่มถาวรในหน้าโปรไฟล์ ═══ */
const Install = (() => {
  let deferred = null;
  let slot = null;
  const KEY_HIDE = "tlh_install_dismiss";

  const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.navigator.standalone === true;
  const dismissed = () => {
    try { return localStorage.getItem(KEY_HIDE) === "1"; } catch (_) { return false; }
  };

  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferred = e;
    render();
  });
  window.addEventListener("appinstalled", () => { deferred = null; render(); });

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  function mount(sel) {
    const el = document.querySelector(sel);
    if (!el) return;
    slot = el;
    render();
  }

  function render() {
    if (!slot) return;
    if (isStandalone() || dismissed()) { slot.innerHTML = ""; return; }

    slot.innerHTML = `
      <button class="install-btn" id="ins-btn" title="ติดตั้งแอปลงมือถือ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>ติดตั้ง</span>
      </button>`;

    document.getElementById("ins-btn").onclick = prompt;
  }

  async function requestInstall() {
    const installEvent = deferred;
    if (!installEvent) {
      Toast.show("คุณติดตั้งไปแล้ว หรือ เบราว์เซอร์นี้ไม่สามารถติดตั้งได้", "error");
      return;
    }
    deferred = null;
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice && choice.outcome === "accepted")
        Toast.show("ติดตั้งแอปเรียบร้อยแล้ว", "success");
    } catch (_) {
      Toast.show("เปิดหน้าต่างติดตั้งไม่สำเร็จ", "error");
    }
    render();
  }

  function prompt() {
    if (isStandalone()) {
      Modal.open({
        title: "ติดตั้งแอปแล้ว",
        body: `<p>อุปกรณ์นี้ติดตั้งแอป TLH เช็คอินอยู่แล้ว</p>`,
        foot: `<button class="btn btn-primary" data-close>ตกลง</button>`
      });
      return;
    }
    if (deferred) {
      requestInstall();
      return;
    }
    Modal.open({
      title: "ยืนยันติดตั้งแอป",
      body: `<p>ต้องการติดตั้งแอป TLH เช็คอินบนอุปกรณ์นี้หรือไม่?</p>`,
      foot: `
        <button class="btn btn-outline" data-close>ยกเลิก</button>
        <button class="btn btn-primary" id="ins-confirm">ติดตั้ง</button>`
    });
    document.getElementById("ins-confirm").onclick = () => {
      Modal.close();
      requestInstall();
    };
  }

  return { mount, prompt };
})();
window.Install = Install;