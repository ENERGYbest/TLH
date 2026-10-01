/* ═══ sidebar — Admin เต็ม · tlh (หัวหน้างาน) เหมือน Admin แต่ย่อรอ "แสดงเพิ่มเติม" ═══ */
const Sidebar = (() => {
  const NAV_ADMIN = [
    { key: "dashboard",  label: "Dashboard",          icon: "grid",      href: "index.html" },
    { key: "projects",   label: "Projects",           icon: "folder",    href: "projects.html", badge: DATA.projects.length },
    { key: "attendance", label: "รายงานการเข้างาน",  icon: "user",      href: "attendance.html" },
    { key: "entities",   label: "จัดการ PM / ลูกค้า", icon: "briefcase", href: "entities.html" },
    { key: "users",      label: "จัดการ User",        icon: "layers",    href: "users.html" },
    { key: "settings",   label: "ตั้งค่าระบบ",         icon: "sliders",   href: "settings.html" }
  ];
  const NAV_USER = [
    { key: "timesheet", label: "เช็คอินของฉัน", icon: "camera", href: "timesheet.html" }
  ];
  const BNAV_ADMIN = ["dashboard", "projects", "users", "attendance", "settings"];
  const BNAV_TLH = ["dashboard"];
  let shellEventsBound = false;
  let moreOpen = false;

  function render() {
    const u = Auth.user();
    if (!u) return;
    const el = document.getElementById("sidebar");
    if (!el) return;
    const page = document.body.dataset.page;
    const isTlh = u.role === "tlh";
    const isAdmin = u.role === "admin";

    const roleLabel = isAdmin ? "Admin" : isTlh ? "หัวหน้างาน" : "User";
    const rest = NAV_ADMIN.filter(n => n.key !== "dashboard");

    let navHTML = "";
    if (isAdmin) {
      navHTML =
        '<div class="nav-group-label">เมนูหลัก</div>' +
        NAV_ADMIN.map(n =>
          '<a class="nav-item ' + (page === n.key ? "active" : "") + '" href="' + n.href + '">' +
            Icons.get(n.icon, 19) + "<span>" + n.label + "</span>" +
            (n.badge ? '<span class="nav-badge">' + n.badge + "</span>" : "") +
          "</a>"
        ).join("");
    } else if (isTlh) {
      navHTML =
        '<div class="nav-group-label">ภาพรวม</div>' +
        '<a class="nav-item ' + (page === "dashboard" ? "active" : "") + '" href="index.html">' +
          Icons.get("grid", 19) + "<span>Dashboard</span>" +
        "</a>" +
        '<button class="nav-item nav-more-btn" id="nav-more">' +
          '<span style="width:19px;flex:none;text-align:center">' + (moreOpen ? "▾" : "▸") + "</span>" +
          "<span>" + (moreOpen ? "ซ่อนเมนู" : "แสดงเพิ่มเติม") + "</span>" +
        "</button>" +
        '<div id="nav-more-box" class="' + (moreOpen ? "" : "hidden") + '">' +
          rest.map(n =>
            '<a class="nav-item ' + (page === n.key ? "active" : "") + '" href="' + n.href + '">' +
              Icons.get(n.icon, 19) + "<span>" + n.label + "</span>" +
              (n.badge ? '<span class="nav-badge">' + n.badge + "</span>" : "") +
            "</a>"
          ).join("") +
        "</div>";
    } else {
      navHTML =
        '<div class="nav-group-label">เมนู</div>' +
        NAV_USER
          .map(n =>
            '<a class="nav-item ' + (page === n.key ? "active" : "") + '" href="' + n.href + '">' +
              Icons.get(n.icon, 19) + "<span>" + n.label + "</span>" +
            "</a>"
          ).join("");
    }

    el.innerHTML =
      '<div class="sidebar-brand">' +
        '<img class="brand-logo" src="' + DATA.company.logo + '" alt="" onerror="this.style.display=\'none\'">' +
        '<div class="min-w-0">' +
          '<div class="brand-name truncate">' + DATA.company.name + "</div>" +
          '<div class="brand-sub truncate">' + DATA.company.sub + "</div>" +
        "</div>" +
      "</div>" +
      '<nav class="sidebar-nav">' + navHTML + "</nav>" +
      '<div class="sidebar-foot">' +
        '<div class="side-user">' +
          U.avatar(u.empId) +
          '<div class="meta" style="min-width:0">' +
            '<div class="name truncate">' + U.esc(u.name) + "</div>" +
            '<div class="role truncate">' + U.esc(u.position) + " · " + roleLabel + "</div>" +
          "</div>" +
          '<button class="btn-icon" id="side-logout" title="ออกจากระบบ" ' +
            'style="color:rgba(255,255,255,.7)">' + Icons.get("logout", 17) + "</button>" +
        "</div>" +
      "</div>";

    U.$("#side-logout").onclick = function () { Auth.logout(); };

    const moreBtn = U.$("#nav-more");
    if (moreBtn) moreBtn.onclick = function () {
      moreOpen = !moreOpen;
      render();
    };

    /* Bottom nav (มือถือ): Admin + tlh */
    const bn = document.getElementById("bottom-nav");
    if (bn) {
      if (isAdmin || isTlh) {
        const items = isTlh ? BNAV_TLH : BNAV_ADMIN;
        bn.innerHTML = items.map(k => {
          const n = NAV_ADMIN.find(x => x.key === k);
          return '<a class="bnav-item ' + (page === k ? "active" : "") + '" href="' + n.href + '">' +
            Icons.get(n.icon, 20) + "<span>" + n.label.split(" ")[0] + "</span></a>";
        }).join("");
        document.body.classList.add("has-bnav");
      } else {
        bn.innerHTML = "";
        document.body.classList.remove("has-bnav");
      }
    }

    const backdrop = document.getElementById("sidebar-backdrop");
    if (!shellEventsBound) {
      document.addEventListener("click", e => {
        if (!e.target.closest("[data-toggle-sidebar]")) return;
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("sidebar-backdrop");
        if (!sidebar || !overlay) return;
        const open = sidebar.classList.toggle("open");
        overlay.classList.toggle("show", open);
      });
      if (backdrop) backdrop.addEventListener("click", () => {
        el.classList.remove("open");
        backdrop.classList.remove("show");
      });
      shellEventsBound = true;
    }
  }
  return { render };
})();
window.Sidebar = Sidebar;