/* ═══ login ═══ */
(async function () {
  if (document.body.dataset.page !== "login")
    throw new Error("[TLH] login.js ถูกโหลดผิดหน้า — ตรวจ <script> ท้าย login.html");

  Toast.init();
  API.boot();

  if (Auth.user()) { Auth.go(Auth.home()); return; }

  const pinInput = U.$("#lg-pin"), pinToggle = U.$("#pin-toggle");
  const renderToggle = () =>
    pinToggle.innerHTML = Icons.get(pinInput.classList.contains("pin-mask") ? "eye" : "x", 17);
  renderToggle();
  pinToggle.onclick = () => {
    pinInput.classList.toggle("pin-mask");
    renderToggle();
    pinInput.focus();
  };

  U.$("#login-form").addEventListener("submit", e => {
    e.preventDefault();
    tryLogin(U.$("#lg-id").value, U.$("#lg-pin").value);
  });

  function fail(msg) {
    const m = U.$("#lg-msg");
    m.textContent = msg;
    m.classList.remove("hidden");
    const card = U.$("#login-card");
    card.classList.remove("login-shake");
    void card.offsetWidth;
    card.classList.add("login-shake");
    pinInput.select();
  }

  function success(r) {
    U.$("#lg-msg").classList.add("hidden");
    Toast.show("ยินดีต้อนรับ " + r.user.name, "success");
    setTimeout(() => Auth.go(Auth.home()), 500);
  }

  function tryLogin(id, pin) {
    const r = Auth.login(id, pin);
    if (r.ok) return success(r);

    if (r.msg.indexOf("ไม่พบรหัสพนักงาน") === 0) {
      const m = U.$("#lg-msg");
      m.textContent = "⏳ กำลังตรวจสอบจากเซิร์ฟเวอร์…";
      m.classList.remove("hidden");
      API.boot().then(ok => {
        const r2 = ok ? Auth.login(id, pin) : null;
        if (r2 && r2.ok) return success(r2);
        fail(ok ? "ไม่พบรหัสพนักงานนี้" : "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — ลองอีกครั้ง");
      });
      return;
    }
    fail(r.msg);
  }
})();