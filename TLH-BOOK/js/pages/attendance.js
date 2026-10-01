/* ═══ attendance — รายงานการเข้างาน (admin + tlh) ═══ */
(async function () {
  if (document.body.dataset.page !== "attendance")
    throw new Error("[TLH] attendance.js ถูกโหลดผิดหน้า");

  if (!Auth.require(["admin", "tlh"])) return;
  API.boot();
  Sidebar.render(); Topbar.render(); Toast.init(); Modal.init();

  const KEY = "tlh_attendance";
  const employeeStaff = DATA.staff.filter(s => s.role !== "admin" && s.role !== "tlh");
  const employeeIds = new Set(employeeStaff.map(s => String(s.empId)));
  const employeeRecords = () => (U.store(KEY) || [])
    .filter(r => employeeIds.has(String(r.empId)));
  let records = employeeRecords();

  let fDate = U.todayISO(), fView = "all", fStaff = "all";
  let view = window.innerWidth <= 768 ? "cards" : "table";
  let viewSelected = false;
  const activeStaff = employeeStaff.filter(s => s.active !== false);
  const nameOf = r => r.name || (DATA.staff.find(s => String(s.empId) === String(r.empId)) || {}).name || "—";

  function render() {
    const dayRecs = records.filter(r => r.date === fDate || r.dateOut === fDate)
      .sort((a, b) => (a.timeIn || "").localeCompare(b.timeIn || ""));

    const checkinsOnDate = records.filter(r => r.date === fDate);
    const checkedIds = new Set(checkinsOnDate.map(r => String(r.empId)));
    const checked    = activeStaff.filter(s => checkedIds.has(String(s.empId)));
    const notChecked = activeStaff.filter(s => !checkedIds.has(String(s.empId)));

    let list;
    if (fView === "out") {
      list = (fStaff === "all" ? notChecked : notChecked.filter(s => String(s.empId) === fStaff))
        .map(s => ({ staff: s }));
    } else {
      list = dayRecs
        .filter(r => fStaff === "all" || String(r.empId) === fStaff)
        .map(r => ({ rec: r }));
    }

    const stat = (icon, cls, num, label) => `
      <div class="card card-hover stat-card">
        <div class="stat-ico ${cls}">${Icons.get(icon, 24)}</div>
        <div><div class="stat-num">${num}</div><div class="stat-label">${label}</div></div>
      </div>`;

    const rows = list.map(item => {
      if (item.rec) {
        const r = item.rec;
        return `<tr>
          <td data-label="สถานะ"><span class="badge b-green">${Icons.get("check-circle", 13)} เช็คอินแล้ว</span></td>
          <td data-label="พนักงาน"><span class="flex items-center gap-2">
            ${U.avatar(r.empId, "avatar-sm")}
            <span><span class="cell-main">${U.esc(nameOf(r))}</span><br>
            <span class="cell-sub">รหัส ${r.empId}</span></span></span></td>
          <td data-label="วันที่เข้า">${U.fmtDate(r.date)}</td>
          <td data-label="เวลาเข้า"><span class="badge b-green">${r.timeIn || "—"}</span></td>
          <td data-label="วันที่ออก">${r.timeOut ? U.fmtDate(r.dateOut || r.date) : "—"}</td>
          <td data-label="เวลาออก">${r.timeOut ? `<span class="badge b-red">${r.timeOut}</span>` : `<span class="badge b-gray">ยังไม่ออก</span>`}</td>
          <td data-label="ไซต์งาน" style="white-space:normal;min-width:200px">${U.esc(r.location)}</td>
          <td data-label="รูปเช็คอิน">${r.photo
            ? `<img class="att-thumb" src="${r.photo}" data-big="${r.rid}" data-photo-kind="checkin" alt="รูปเช็คอิน">`
            : `<span class="att-thumb-empty">${Icons.get("image", 18)}</span>`}</td>
          <td data-label="รูปเช็คเอาท์">${r.photoOut
            ? `<img class="att-thumb" src="${r.photoOut}" data-big="${r.rid}" data-photo-kind="checkout" alt="รูปเช็คเอาท์">`
            : `<span class="att-thumb-empty" style="background:var(--gray-200);color:var(--text-3)">—</span>`}</td>
        </tr>`;
      }
      const s = item.staff;
      return `<tr>
        <td data-label="สถานะ"><span class="badge b-gray">ยังไม่เช็คอิน</span></td>
        <td data-label="พนักงาน"><span class="flex items-center gap-2">
          ${U.avatar(s.empId, "avatar-sm")}
          <span><span class="cell-main">${U.esc(s.name)}</span><br>
          <span class="cell-sub">รหัส ${s.empId} · ${U.esc(s.position)}</span></span></span></td>
        <td data-label="วันที่เข้า">—</td>
        <td data-label="เวลาเข้า">—</td>
        <td data-label="วันที่ออก">—</td>
        <td data-label="เวลาออก">—</td>
        <td data-label="ไซต์งาน">—</td>
        <td data-label="รูปเช็คอิน"><span class="att-thumb-empty" style="background:var(--gray-200);color:var(--text-3)">—</span></td>
        <td data-label="รูปเช็คเอาท์"><span class="att-thumb-empty" style="background:var(--gray-200);color:var(--text-3)">—</span></td>
      </tr>`;
    }).join("");

    const cards = list.map(item => {
      const record = item.rec;
      const staff = record
        ? DATA.staff.find(s => String(s.empId) === String(record.empId))
        : item.staff;
      const person = record || staff;
      return `<article class="attendance-card card">
        <div class="attendance-card-head">
          <span class="badge ${record ? "b-green" : "b-gray"}">${record ? "เช็คอินแล้ว" : "ยังไม่เช็คอิน"}</span>
          <b>${record ? U.fmtDate(record.date) + " · " + U.esc(record.timeIn || "—") + " น." : "—"}</b>
        </div>
        <div class="attendance-card-person">
          ${U.avatar(person.empId, "avatar-sm")}
          <div class="min-w-0">
            <b>${U.esc(record ? nameOf(record) : staff.name)}</b>
            <div class="small muted">รหัส ${U.esc(String(person.empId))}${staff && staff.position ? " · " + U.esc(staff.position) : ""}</div>
          </div>
        </div>
        <div class="attendance-card-detail">
          <span class="small muted">ไซต์งาน</span>
          <span>${record ? U.esc(record.location) : "—"}</span>
        </div>
        <div class="attendance-card-detail">
          <span class="small muted">รูปเช็คอิน</span>
          ${record && record.photo
            ? `<img class="att-thumb" src="${record.photo}" data-big="${record.rid}" data-photo-kind="checkin" alt="รูปเช็คอิน">`
            : `<span class="small muted">—</span>`}
        </div>
        <div class="attendance-card-detail">
          <span class="small muted">เช็คเอาท์</span>
          ${record && record.timeOut
            ? `<span class="attendance-checkout-info"><span class="badge b-red">${U.fmtDate(record.dateOut || record.date)} ${U.esc(record.timeOut)} น.</span>${record.photoOut ? `<img class="att-thumb" src="${record.photoOut}" data-big="${record.rid}" data-photo-kind="checkout" alt="รูปเช็คเอาท์">` : ""}</span>`
            : `<span class="badge b-gray">ยังไม่เช็คเอาท์</span>`}
        </div>
      </article>`;
    }).join("") || `<div class="card card-pad center-empty">ไม่มีข้อมูล</div>`;

    U.$("#page-root").innerHTML = `
    <div class="page-head">
      <div>
        <h1>รายงานการเข้างาน</h1>
        <p class="sub">วันที่ ${U.fmtDate(fDate)} · เช็คอิน 1 ครั้ง = 1 ไซต์ (ถ่ายเซลฟี่)</p>
      </div>
      <div class="head-actions">
        <button class="btn btn-outline" id="att-export">${Icons.get("download", 16)} Export Excel</button>
      </div>
    </div>

    <div class="dash-grid">
      ${stat("check-circle", "green", checked.length,     "เช็คอินแล้ว")}
      ${stat("alert",        "red",   notChecked.length,  "ยังไม่เช็คอิน")}
      ${stat("target",       "amber", dayRecs.length,     "รายการเข้า/ออกในวันที่เลือก")}
      ${stat("user",         "gray",  activeStaff.length, "พนักงานทั้งหมด")}
    </div>

    <div class="card mt-4">
      <div class="filter-bar" style="padding:16px 16px 0;flex-wrap:wrap">
        <input class="input" type="date" id="f-date" value="${fDate}">
        <select class="select" id="f-staff">
          <option value="all">พนักงานทุกคน</option>
          ${activeStaff.map(s => `<option value="${s.empId}" ${fStaff === s.empId ? "selected" : ""}>${U.esc(s.name)}</option>`).join("")}
        </select>
        <div class="chips" style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="chip ${fView === "all" ? "active" : ""}" data-view="all">รายการเข้า/ออก (${dayRecs.length})</button>
          <button class="chip ${fView === "out" ? "active" : ""}" data-view="out">ยังไม่เช็คอิน (${notChecked.length})</button>
        </div>
        <button class="btn btn-soft" id="f-today" style="margin-left:auto">${Icons.get("calendar", 15)} วันนี้</button>
        <div class="view-toggle" role="group" aria-label="รูปแบบการแสดงผล">
          <button data-layout="table" class="${view === "table" ? "active" : ""}" aria-pressed="${view === "table"}">${Icons.get("layers", 14)} ตาราง</button>
          <button data-layout="cards" class="${view === "cards" ? "active" : ""}" aria-pressed="${view === "cards"}">${Icons.get("grid", 14)} การ์ด</button>
        </div>
      </div>
      <div id="att-list">${view === "cards" ? `<div class="attendance-card-list">${cards}</div>` : `
        <div class="table-wrap tbl-responsive">
          <table class="tbl">
            <thead><tr>
              <th>สถานะ</th><th>พนักงาน</th><th>วันที่เข้า</th><th>เวลาเข้า</th><th>วันที่ออก</th><th>เวลาออก</th><th>ไซต์งาน</th><th>รูปเช็คอิน</th><th>รูปเช็คเอาท์</th>
            </tr></thead>
            <tbody>${rows || `<tr><td colspan="9"><div class="center-empty">ไม่มีข้อมูล</div></td></tr>`}</tbody>
          </table>
        </div>`}</div>
    </div>`;

    U.$("#f-date").onchange  = e => { fDate = e.target.value; render(); };
    U.$("#f-staff").onchange = e => { fStaff = e.target.value; render(); };
    U.$$("[data-view]").forEach(b => b.onclick = () => { fView = b.dataset.view; render(); });
    U.$$ ("[data-layout]").forEach(b => b.onclick = () => {
      view = b.dataset.layout;
      viewSelected = true;
      render();
    });
    U.$("#f-today").onclick  = () => { fDate = U.todayISO(); fView = "all"; fStaff = "all"; render(); };
    U.$("#att-export").onclick = () => WorkbookExport.open("attendance");

    U.$$("[data-big]").forEach(img => img.onclick = () => {
      const r = records.find(x => x.rid === Number(img.dataset.big));
      const checkout = img.dataset.photoKind === "checkout";
      const photo = checkout ? r?.photoOut : r?.photo;
      const eventTime = checkout ? r?.timeOut : r?.timeIn;
      const eventDate = checkout ? r?.dateOut || r?.date : r?.date;
      if (r && photo) Modal.open({
        title: `${checkout ? "เช็คเอาท์" : "เช็คอิน"} · ${nameOf(r)} · ${U.esc(r.location)}`,
        body: `<img class="big-photo" src="${photo}">
               <p class="small muted" style="text-align:center;margin-top:10px">
                 ${U.fmtDate(eventDate)} · ${checkout ? "เช็คเอาท์" : "เช็คอิน"} ${eventTime || "—"} น.</p>`,
        foot: '<button class="btn btn-outline" data-close>ปิด</button>'
      });
    });
  }

  function exportCSV() {
    const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["วันที่เข้า", "เวลาเข้า", "วันที่ออก", "เวลาออก", "รหัส", "ชื่อ", "ไซต์งาน"]];
    records.filter(r => r.date === fDate || r.dateOut === fDate)
      .sort((a, b) => (a.timeIn || "").localeCompare(b.timeIn || ""))
      .forEach(r => rows.push([r.date, r.timeIn, r.dateOut || "", r.timeOut || "", r.empId, nameOf(r), r.location]));

    const csv = "\uFEFF" + rows.map(r => r.map(q).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "tlh_attendance_" + fDate + ".csv";
    a.click();
    Toast.show("ส่งออก CSV แล้ว", "success");
  }

  render();
  API.onCloud(() => { records = employeeRecords(); render(); });
  window.addEventListener("resize", U.debounce(() => {
    if (viewSelected) return;
    const nextView = window.innerWidth <= 768 ? "cards" : "table";
    if (nextView !== view) { view = nextView; render(); }
  }, 150));
})();