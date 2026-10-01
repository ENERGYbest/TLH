/* ═══ ตั้งค่าระบบ ═══ */
(async function () {
  if (document.body.dataset.page !== "settings")
    throw new Error("[TLH] settings.js ถูกโหลดผิดหน้า");

  if (!Auth.require(["admin", "tlh"])) return;
  API.boot();
  Sidebar.render(); Topbar.render(); Toast.init(); Modal.init();

  const root = U.$("#page-root");
  let S = DATA.settings;
  const saveS = () => { U.store("tlh_settings", S); };

  const THEME_COLORS = {
    red: "#D01B22", navy: "#1F3A6E", green: "#178A66", violet: "#683BC4"
  };
  const DEFAULT_SHIFTS = [
    { id: "08-17", start: "08:00", end: "17:00" },
    { id: "13-22", start: "13:00", end: "22:00" },
    { id: "16-1", start: "16:00", end: "01:00" },
    { id: "20-5", start: "20:00", end: "05:00" }
  ];
  const DEFAULT_OT_RATES = [
    { id: "workday", label: "OT วันทำงาน", value: 1.5 },
    { id: "holidayWork", label: "ทำงานวันหยุด (ในเวลาปกติ)", value: 2 },
    { id: "holidayOvertime", label: "OT วันหยุด", value: 3 }
  ];
  const workShifts = () => DEFAULT_SHIFTS.map(shift => ({
    ...shift,
    ...(S.workShifts || []).find(saved => saved.id === shift.id)
  }));
  const overtimeRates = () => DEFAULT_OT_RATES.map(rate => ({
    ...rate,
    value: Number(S.overtimeRates?.[rate.id] ?? rate.value)
  }));

  function applyTheme(name) {
    S.theme = name;
    const th = THEMES[name] || THEMES.red;
    Object.entries(th).forEach(([k, v]) =>
      document.documentElement.style.setProperty("--red-" + k, v));
  }

  function siteCandidates() {
    return DATA.projects
      .filter(p => !S.locations.some(l => l.includes(p.id)))
      .map(p => p.id + " · " + p.name);
  }

  function render() {
    const shifts = workShifts();
    const rates = overtimeRates();
    root.innerHTML = `
    <div class="page-head">
      <div><h1>ตั้งค่าระบบ</h1>
        <p class="sub">บันทึกขึ้น Supabase — ใช้ได้ทุกเครื่อง</p></div>
    </div>

    <div class="settings-grid">

      <div class="card card-pad">
        <div class="section-title"><h2>${Icons.get("calendar", 17)} กะงานและอัตรา OT</h2></div>
        <div class="shift-config-list">
          ${shifts.map((shift, index) => `
            <div class="shift-config-row">
              <b>กะ ${String(index + 1).padStart(2, "0")}</b>
              <label class="field"><span>เวลาเข้า</span><input class="input" type="time" id="shift-start-${shift.id}" value="${U.esc(shift.start)}"></label>
              <label class="field"><span>เวลาออก</span><input class="input" type="time" id="shift-end-${shift.id}" value="${U.esc(shift.end)}"></label>
            </div>`).join("")}
        </div>
        <div class="ot-rate-list">
          <h3>อัตราค่าล่วงเวลา</h3>
          ${rates.map(rate => `
            <label class="ot-rate-row" for="ot-rate-${rate.id}">
              <span>${rate.label}</span>
              <span class="ot-rate-input"><input class="input" type="number" min="0.5" step="0.5" id="ot-rate-${rate.id}" value="${rate.value}"><b>เท่า</b></span>
            </label>`).join("")}
        </div>
        <button class="btn btn-primary mt-3" id="st-save-work-rules">บันทึกกะงานและอัตรา OT</button>
      </div>

      <div class="card card-pad">
        <div class="section-title"><h2>${Icons.get("target", 17)} ไซต์งาน (ใช้เลือกตอนเช็คอิน)</h2></div>
        <div id="loc-list">${S.locations.map((l, i) => locItem(l, i)).join("")}</div>
        <div class="field">
          <label>${Icons.get("folder", 14)} เลือกงานที่ยังไม่ได้เพิ่ม (${siteCandidates().length} งาน)</label>
          <select class="select" id="loc-pick">
            <option value="">— เลือกงานจากรายการโปรเจกต์ —</option>
            ${siteCandidates().map(c => `<option value="${U.esc(c)}">${U.esc(c)}</option>`).join("")}
            <option value="__custom">✏️ พิมพ์ชื่อไซต์เอง…</option>
          </select>
        </div>
        <div class="field hidden" id="loc-custom-wrap">
          <label>ชื่อไซต์งาน (พิมพ์เอง)</label>
          <input class="input" id="loc-new" placeholder="เช่น ออฟฟิศชั่วคราว หน้างานลูกค้า …">
        </div>
        <button class="btn btn-primary" id="loc-add" style="width:100%">
          ${Icons.get("plus", 15)} เพิ่มไซต์งาน
        </button>
      </div>

      <div class="card card-pad">
        <div class="section-title"><h2>${Icons.get("grid", 17)} ธีมสีระบบ</h2></div>
        <div class="theme-swatches">
          ${Object.entries(THEME_COLORS).map(([k, c]) => `
          <button class="swatch ${S.theme === k ? "active" : ""}" data-theme="${k}"
                  style="background:${c}" title="${k}"></button>`).join("")}
        </div>
        <p class="small muted mt-2">แดง TLH / น้ำเงิน / เขียว / ม่วง</p>
      </div>

      <div class="card card-pad">
        <div class="section-title"><h2>${Icons.get("briefcase", 17)} ข้อมูลบริษัท</h2></div>
        <div class="field"><label>ชื่อบริษัท (ไทย)</label>
          <input class="input" id="co-name" value="${U.esc(DATA.company.name)}"></div>
        <div class="field"><label>ชื่อบริษัท (อังกฤษ)</label>
          <input class="input" id="co-en" value="${U.esc(DATA.company.nameEn)}"></div>
        <div class="form-2col">
          <div class="field"><label>โทรศัพท์</label>
            <input class="input" id="co-tel" value="${U.esc(DATA.company.tel)}"></div>
          <div class="field"><label>แฟกซ์</label>
            <input class="input" id="co-fax" value="${U.esc(DATA.company.fax)}"></div>
        </div>
        <button class="btn btn-primary" id="co-save">บันทึกข้อมูลบริษัท</button>
      </div>

      <div class="card card-pad danger-zone" style="grid-column:1/-1">
        <div class="section-title"><h2>${Icons.get("download", 17)} ข้อมูลระบบ</h2></div>
        <p class="small muted">บัญชี ${DATA.staff.length} · รายการเช็คอิน ${(U.store("tlh_attendance") || []).length} รายการ</p>
        <div class="head-actions mt-3" style="justify-content:flex-start">
          <button class="btn btn-outline" id="sys-export">${Icons.get("download", 15)} สำรองข้อมูล (JSON)</button>
          <label class="btn btn-outline" style="cursor:pointer">
            ${Icons.get("layers", 15)} กู้คืนข้อมูล
            <input type="file" id="sys-import" accept=".json" hidden>
          </label>
          <button class="btn btn-danger" id="sys-clear">${Icons.get("trash", 15)} ล้างข้อมูลเช็คอินทั้งหมด</button>
        </div>
      </div>
    </div>`;

    bind();
  }

  const locItem = (l, i) => `
    <div class="loc-item">
      <span class="txt truncate">${U.esc(l)}</span>
      <button class="btn-icon" data-delloc="${i}" title="ลบ">${Icons.get("trash", 15)}</button>
    </div>`;

  function bind() {
    U.$("#st-save-work-rules").onclick = () => {
      const shifts = DEFAULT_SHIFTS.map(shift => ({
        id: shift.id,
        start: U.$(`#shift-start-${shift.id}`).value,
        end: U.$(`#shift-end-${shift.id}`).value
      }));
      const rates = Object.fromEntries(DEFAULT_OT_RATES.map(rate => [
        rate.id, Number(U.$(`#ot-rate-${rate.id}`).value)
      ]));
      if (shifts.some(shift => !shift.start || !shift.end) ||
          Object.values(rates).some(value => !Number.isFinite(value) || value < 0.5)) {
        Toast.show("กรุณาตรวจสอบเวลาและอัตรา OT", "error"); return;
      }
      S.workShifts = shifts;
      S.overtimeRates = rates;
      delete S.workShift;
      delete S.workStart;
      delete S.workEnd;
      delete S.lateAfter;
      saveS(); Toast.show("บันทึกกะงานและอัตรา OT แล้ว", "success");
    };

    U.$("#loc-pick").onchange = e => {
      const custom = e.target.value === "__custom";
      U.$("#loc-custom-wrap").classList.toggle("hidden", !custom);
      if (custom) U.$("#loc-new").focus();
    };
    U.$("#loc-add").onclick = () => {
      const pick = U.$("#loc-pick").value;
      let v = "";
      if (pick === "__custom") v = U.$("#loc-new").value.trim();
      else if (pick) v = pick;
      if (!v) { Toast.show("เลือกงาน หรือเลือก 'พิมพ์เอง' ก่อน", "error"); return; }
      if (S.locations.includes(v)) { Toast.show("ไซต์นี้มีอยู่แล้ว", "error"); return; }
      S.locations.push(v); saveS();
      render();
      Toast.show("เพิ่มไซต์งานแล้ว", "success");
    };
    U.$("#loc-new").addEventListener("keydown", e => {
      if (e.key === "Enter") U.$("#loc-add").click();
    });
    U.$$("[data-delloc]").forEach(b => b.onclick = () => {
      S.locations.splice(Number(b.dataset.delloc), 1);
      saveS(); render(); Toast.show("ลบไซต์งานแล้ว", "success");
    });

    U.$$("[data-theme]").forEach(b => b.onclick = () => {
      applyTheme(b.dataset.theme); saveS(); render();
      Toast.show("เปลี่ยนธีมแล้ว", "success");
    });

    U.$("#co-save").onclick = () => {
      DATA.company.name   = U.$("#co-name").value.trim() || DATA.company.name;
      DATA.company.nameEn = U.$("#co-en").value.trim()  || DATA.company.nameEn;
      DATA.company.tel    = U.$("#co-tel").value.trim() || DATA.company.tel;
      DATA.company.fax    = U.$("#co-fax").value.trim() || DATA.company.fax;
      U.store("tlh_company", DATA.company);
      Toast.show("บันทึกข้อมูลบริษัทแล้ว (รีเฟรชเพื่อเห็นทั้งระบบ)", "success");
    };

    U.$("#sys-export").onclick = () => {
      const data = {
        staff: DATA.staff, members: DATA.members, clients: DATA.clients,
        projects: DATA.projects, settings: S,
        attendance: U.store("tlh_attendance") || [], company: DATA.company
      };
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      a.download = "tlh_backup.json"; a.click();
      Toast.show("สำรองข้อมูลแล้ว", "success");
    };
    U.$("#sys-import").onchange = e => {
      const f = e.target.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const d = JSON.parse(rd.result);
          if (d.staff)      U.store("tlh_staff", d.staff);
          if (d.members)    U.store("tlh_members", d.members);
          if (d.clients)    U.store("tlh_clients", d.clients);
          if (d.projects)   U.store("tlh_projects", d.projects);
          if (d.settings)   U.store("tlh_settings", d.settings);
          if (d.attendance) U.store("tlh_attendance", d.attendance);
          if (d.company)    U.store("tlh_company", d.company);
          Toast.show("กู้คืนข้อมูลแล้ว — รีเฟรชหน้า", "success");
          setTimeout(() => location.reload(), 900);
        } catch { Toast.show("ไฟล์ไม่ถูกต้อง", "error"); }
      };
      rd.readAsText(f);
    };

    /* 🆕 ล้างเช็คอิน — ลบบน Supabase จริง + ตรวจผล + แจ้งเตือนถ้าล้มเหลว */
    U.$("#sys-clear").onclick = () => {
      Modal.open({
        title: "ยืนยันการล้างข้อมูล",
        body: "<p>ลบรายการเช็คอินทั้งหมด (ทุกเครื่อง รวมลิงก์รูป) — ไม่สามารถย้อนกลับได้ ยืนยันหรือไม่?</p>",
        foot: `<button class="btn btn-outline" data-close>ยกเลิก</button>
               <button class="btn btn-danger" id="clr-yes">ลบทั้งหมด</button>`
      });
      U.$("#clr-yes").onclick = async () => {
        const btn = U.$("#clr-yes");
        btn.disabled = true;
        btn.textContent = "⏳ กำลังลบ…";
        try {
          if (API.enabled()) {
            await API.clearAttendance();     /* ลบบนคลาวด์ + เคลียร์ในเครื่อง */
          } else {
            localStorage.setItem("tlh_attendance", "[]");
          }
          Modal.close(); render();
          Toast.show("ล้างข้อมูลเช็คอินทั้งหมดแล้ว ✓", "success");
        } catch (err) {
          Toast.show("ลบไม่สำเร็จ: " + err.message, "error", 5000);
          btn.disabled = false;
          btn.textContent = "ลบทั้งหมด";
        }
      };
    };
  }

  render();
  API.onCloud(() => { S = DATA.settings; render(); });
})();