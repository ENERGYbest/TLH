/* ═══ topbar ═══ */
const Topbar = (() => {
  const TITLES = {
    dashboard: "Dashboard", projects: "All Projects", board: "Project Board",
    attendance: "รายงานการเข้างาน", entities: "จัดการ PM / ลูกค้า",
    users: "จัดการ User", settings: "ตั้งค่าระบบ", profile: "โปรไฟล์ของฉัน"
  };
  const NOTIFS = [
    { icon: "alert",        title: "J693162 Happitat at The Forestias — ลานจอดรถ 80%", time: "10 นาทีที่แล้ว" },
    { icon: "check-circle", title: "J683068 O2O แม็คโคร หางดง — เตรียมส่งมอบงวดถัดไป", time: "2 ชม.ที่แล้ว" },
    { icon: "layers",       title: "งานเก็บ 1 Year Defect 18 งาน — อัปเดตรายการแล้ว",    time: "เมื่อวาน" }
  ];

  function render() {
    const u = Auth.user();
    const el = document.getElementById("topbar");
    el.innerHTML = `
      <button class="icon-btn hamburger" data-toggle-sidebar aria-label="เมนู">${Icons.get("menu", 20)}</button>
      <div class="topbar-title">${TITLES[document.body.dataset.page] || ""}</div>
      <div class="topbar-spacer"></div>

      <div class="search-wrap topbar-search">
        ${Icons.get("search", 16)}
        <input class="input" id="global-search" placeholder="${document.body.dataset.page === "dashboard" ? "ค้นหาชื่อ/รหัสคน หรือรหัสงาน/ชื่องาน" : "ค้นหางาน…"}">
      </div>

      <div class="dropdown" id="dd-notif">
        <button class="icon-btn" data-dd aria-label="แจ้งเตือน">
          ${Icons.get("bell", 19)}<span class="dot"></span>
        </button>
        <div class="dropdown-menu w-wide">
          <div class="dropdown-head"><b>การแจ้งเตือน</b><span class="small muted">3 ใหม่</span></div>
          ${NOTIFS.map(n => `
          <div class="notif-item">
            <div class="ic-wrap">${Icons.get(n.icon, 17)}</div>
            <div><div class="t">${n.title}</div><div class="d">${n.time}</div></div>
          </div>`).join("")}
        </div>
      </div>

      <div class="dropdown" id="dd-profile">
        <button class="avatar-btn" data-dd aria-label="โปรไฟล์">${U.avatar(u.empId)}</button>
        <div class="dropdown-menu">
          <div class="dropdown-head">
            <b>${U.esc(u.name)}</b>
            <div class="small muted">${U.esc(u.position)} · รหัส ${u.empId}</div>
          </div>
          <a class="dropdown-item" href="profile.html">${Icons.get("user", 16)} โปรไฟล์ของฉัน</a>
          ${u.role !== "user" ? `<a class="dropdown-item" href="settings.html">${Icons.get("sliders", 16)} ตั้งค่าระบบ</a>` : ""}
          <div class="dropdown-sep"></div>
          <button class="dropdown-item danger" id="topbar-logout">${Icons.get("logout", 16)} ออกจากระบบ</button>
        </div>
      </div>`;

    U.$$("[data-dd]").forEach(btn => btn.addEventListener("click", e => {
      e.stopPropagation();
      const dd = btn.closest(".dropdown");
      const wasOpen = dd.classList.contains("open");
      U.$$(".dropdown").forEach(d => d.classList.remove("open"));
      if (!wasOpen) dd.classList.add("open");
    }));
    document.addEventListener("click", () =>
      U.$$(".dropdown").forEach(d => d.classList.remove("open")));

    U.$("#topbar-logout").onclick = () => Auth.logout();

    U.$("#global-search").addEventListener("input", U.debounce(e =>
      document.dispatchEvent(new CustomEvent("app:search", { detail: e.target.value })), 250));
  }
  return { render };
})();
window.Topbar = Topbar;