/* ═══ bootcheck — ฟ้องเมื่อ "พังจริง" เท่านั้น · ลบจอแดงเก่าทุกโหลด ═══ */
(function () {
  "use strict";

  /* ทุกครั้งที่สคริปต์นี้รัน = เคลียร์จอแดงค้างจากรอบก่อนทิ้งก่อน */
  function clearOld() {
    try {
      var old = document.getElementById("tlh-bootcheck");
      if (old) old.remove();
    } catch (_) {}
  }
  clearOld();
  document.addEventListener("DOMContentLoaded", clearOld);
  window.addEventListener("load", clearOld);

  function fail(file, detail) {
    try {
      if (!document.body) return;
      clearOld();                              /* เคลียร์ของเก่าก่อนโชว์ใหม่ */
      var d = document.createElement("div");
      d.id = "tlh-bootcheck";
      d.style.cssText =
        "position:fixed;inset:0;z-index:99999;background:rgba(87,10,13,.97);" +
        "display:flex;align-items:center;justify-content:center;padding:24px;" +
        "font-family:Kanit,sans-serif";
      d.innerHTML =
        '<div style="max-width:560px;background:#fff;color:#383E4A;border-radius:16px;' +
        'padding:26px;box-shadow:0 20px 60px rgba(0,0,0,.4)">' +
        '<h2 style="margin:0 0 8px;color:#A8141A;font-size:18px">⚠️ ระบบโหลดไม่สำเร็จ</h2>' +
        '<p style="margin:0 0 10px;font-size:14.5px"><b>ไฟล์ที่พัง: ' + String(file) + '</b></p>' +
        '<p style="margin:0 0 14px;font-size:13px;line-height:1.7;color:#5A6272">' + String(detail) + '</p>' +
        '<span id="tlh-bc-close" style="font-size:12px;color:#D01B22;cursor:pointer;text-decoration:underline">คลิกเพื่อปิดหน้าต่างนี้</span>' +
        '</div>';
      document.body.appendChild(d);
      var c = d.querySelector("#tlh-bc-close");
      if (c) c.onclick = function () { d.remove(); };
    } catch (_) {}
  }

  var PAGE = {
    dashboard:  "js/pages/dashboard.js",
    projects:   "js/pages/projects.js",
    board:      "js/pages/board.js",
    attendance: "js/pages/attendance.js",
    entities:   "js/pages/entities.js",
    users:      "js/pages/users.js",
    settings:   "js/pages/settings.js",
    timesheet:  "js/pages/timesheet.js",
    profile:    "js/pages/profile.js",
    login:      "js/pages/login.js"
  };
  var NEEDS = {
    dashboard:  ["Sidebar", "Topbar", "Toast", "Modal", "Charts", "ProjectForm"],
    projects:   ["Sidebar", "Topbar", "Toast", "Modal", "ProjectForm"],
    board:      ["Sidebar", "Topbar", "Toast", "Modal", "ProjectForm"],
    attendance: ["Sidebar", "Topbar", "Toast", "Modal"],
    entities:   ["Sidebar", "Topbar", "Toast", "Modal"],
    users:      ["Sidebar", "Topbar", "Toast", "Modal"],
    settings:   ["Sidebar", "Topbar", "Toast", "Modal"],
    timesheet:  ["Toast", "Modal", "Camera", "Install"],
    profile:    ["Toast", "Modal", "Camera", "Install"],
    login:      ["Toast", "Install"]
  };
  var WHERE = {
    Sidebar: "js/components/sidebar.js", Topbar: "js/components/topbar.js",
    Toast: "js/components/toast.js", Modal: "js/components/modal.js",
    Charts: "js/components/charts.js", ProjectForm: "js/components/projectForm.js",
    Camera: "js/components/camera.js", Install: "js/components/install.js"
  };

  function checkCore() {
    try {
      if (typeof DATA === "undefined")
        return fail("js/data.js", "โค้ดซ้ำหรือตัดไม่ครบ — Ctrl+A ลบทั้งหมด แล้ววางใหม่ทั้งไฟล์ (ห้ามวางต่อท้ายของเก่า)");
      if (typeof U === "undefined")
        return fail("js/utils.js", "โค้ดซ้ำหรือตัดไม่ครบ — Ctrl+A ลบหมดแล้ววางใหม่");
      if (typeof Icons === "undefined")
        return fail("js/components/icons.js", "โค้ดซ้ำหรือตัดไม่ครบ — Ctrl+A ลบหมดแล้้ววางใหม่");
      if (typeof API === "undefined")
        return fail("js/api.js", "โค้ดซ้ำหรือตัดไม่ครบ — Ctrl+A ลบหมดแล้้ววางใหม่ (ห้ามวางต่อท้าย!)");
      if (typeof Modal !== "undefined" && typeof Modal.setOnClose !== "function")
        return fail("js/components/modal.js", "เวอร์ชันเก่า ไม่มี Modal.setOnClose — ลบทั้งไฟล์แล้ววางเวอร์ชันล่าสุด");
      if (typeof API !== "undefined" && typeof API.deleteAttendance !== "function")
        return fail("js/api.js", "เวอร์ชันเก่า ไม่มี API.deleteAttendance — ลบทั้งไฟล์แล้้ววางเวอร์ชันล่าสุด");
    } catch (_) {}
    return false;
  }

  /* ตรวจ 3 รอบ (3/7/12 วิ) — ฟ้องเฉพาะเมื่อพังติดกันครบทุกรอบ = พังจริง */
  var missCount = {};
  function checkPage() {
    try {
      var page = document.body ? document.body.getAttribute("data-page") : null;
      if (!page || !PAGE[page]) return;

      /* คอมโพเนนต์ที่หน้านี้ต้องใช้ — ต้องขาดติดกัน 2 รอบถึงฟ้อง */
      var needs = NEEDS[page] || [];
      for (var i = 0; i < needs.length; i++) {
        var n = needs[i];
        if (typeof window[n] === "undefined") {
          missCount[n] = (missCount[n] || 0) + 1;
          if (missCount[n] >= 2)
            return fail(WHERE[n] || n, "หน้านี้ต้องใช้ " + n + " แต่ไม่ได้โหลด — เช็ค <script> ใน HTML หรือไฟล์พัง/โค้ดซ้ำ (ลบทั้งไฟล์แล้้ววางใหม่)");
          return;                                  /* ยังไม่แจ้ง รอรอบหน้า */
        } else {
          missCount[n] = 0;
        }
      }

      /* #page-root ว่าง — ต้องว่างติดกัน 3 รอบ (12 วิ) ถึงฟ้อง (กันหน้าโหลดช้า) */
      var root = document.getElementById("page-root");
      if (root && !root.innerHTML.trim()) {
        missCount._render = (missCount._render || 0) + 1;
        if (missCount._render >= 3)
          fail(PAGE[page], "JS ของหน้านี้รันไม่ถึงขั้น render — ลบทั้งไฟล์แล้้ววางเวอร์ชันล่าสุดใหม่อีกครั้ง กัน copy ไม่ครบ");
      } else {
        missCount._render = 0;
      }
    } catch (_) {}
  }

  window.addEventListener("load", function () {
    if (checkCore()) return;
    setTimeout(checkPage, 3000);
    setTimeout(checkPage, 7000);
    setTimeout(checkPage, 12000);
  });
})();