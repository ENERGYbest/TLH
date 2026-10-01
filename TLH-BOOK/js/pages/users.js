/* ═══ จัดการ User — User / หัวหน้างาน / Admin ═══ */
(async function () {
  if (document.body.dataset.page !== "users")
    throw new Error("[TLH] users.js ถูกโหลดผิดหน้า");

  if (!Auth.require(["admin", "tlh"])) return;
  API.boot();
  Sidebar.render(); Topbar.render(); Toast.init(); Modal.init();

  const root = U.$("#page-root");
  let query = "";
  let view = window.innerWidth <= 768 ? "cards" : "table";
  let viewSelected = false;
  const saveStaff = () => U.store("tlh_staff", DATA.staff);

  const roleBadge = s =>
    s.role === "admin"      ? `<span class="badge b-red">Admin</span>` :
    s.role === "tlh" ? `<span class="badge b-amber">หัวหน้างาน</span>` :
                              `<span class="badge b-blue">User</span>`;

  function render() {
    const q = query.toLowerCase();
    const list = DATA.staff.filter(s =>
      (s.empId + " " + s.name + " " + s.position).toLowerCase().includes(q));

    root.innerHTML = `
    <div class="page-head">
      <div>
        <h1>จัดการ User</h1>
        <p class="sub">${DATA.staff.length} บัญชี · Admin ${DATA.staff.filter(s => s.role === "admin").length} ·
          หัวหน้างาน ${DATA.staff.filter(s => s.role === "tlh").length} ·
          ปิดใช้งาน ${DATA.staff.filter(s => s.active === false).length}</p>
      </div>
      <div class="head-actions">
        <button class="btn btn-outline" id="u-export">${Icons.get("download", 16)} Export Excel</button>
        <button class="btn btn-primary" id="u-add">${Icons.get("plus", 16)} เพิ่มพนักงาน</button>
      </div>
    </div>

    <div class="user-toolbar">
      <div class="search-wrap" style="max-width:340px">
        ${Icons.get("search", 15)}
        <input class="input" id="u-search" placeholder="ค้นหารหัส / ชื่อ / ตำแหน่ง…" value="${U.esc(query)}">
      </div>
      <div class="view-toggle" role="group" aria-label="รูปแบบการแสดงผล">
        <button data-layout="table" class="${view === "table" ? "active" : ""}" aria-pressed="${view === "table"}">${Icons.get("layers", 14)} ตาราง</button>
        <button data-layout="cards" class="${view === "cards" ? "active" : ""}" aria-pressed="${view === "cards"}">${Icons.get("grid", 14)} การ์ด</button>
      </div>
    </div>

    <div id="u-list">${listHTML(list)}</div>`;

    U.$("#u-add").onclick = () => openForm(null);
    U.$("#u-export").onclick = () => WorkbookExport.open("users");
    U.$("#u-search").addEventListener("input", U.debounce(e => {
      query = e.target.value;
      U.$("#u-list").innerHTML = listHTML(filteredStaff());
      bindRows();
    }, 200));
    U.$$ ("[data-layout]").forEach(b => b.onclick = () => {
      view = b.dataset.layout;
      viewSelected = true;
      render();
    });
    bindRows();
  }

  function filteredStaff() {
    const q = query.toLowerCase();
    return DATA.staff.filter(s =>
      (s.empId + " " + s.name + " " + s.position).toLowerCase().includes(q));
  }

  function listHTML(list) {
    if (view === "cards") return `<div class="user-card-list">
      ${list.map(s => `
        <article class="user-card card">
          <div class="user-card-head">
            <span class="flex items-center gap-2">${U.avatar(s.empId, "avatar-sm")}<b>${U.esc(s.name)}</b></span>
            ${roleBadge(s)}
          </div>
          <div class="user-card-meta"><span class="small muted">รหัส</span><b>${U.esc(String(s.empId))}</b></div>
          <div class="user-card-meta"><span class="small muted">ตำแหน่ง</span><span>${U.esc(s.position || "—")}</span></div>
          <div class="user-card-meta"><span class="small muted">สถานะ</span><span class="badge ${s.active === false ? "b-gray" : "b-green"}">${s.active === false ? "ปิดใช้งาน" : "ใช้งาน"}</span></div>
          <div class="row-actions">
            <button class="btn btn-outline btn-sm" data-edit="${U.esc(String(s.empId))}">แก้ไข</button>
            <button class="btn btn-soft btn-sm" data-pin="${U.esc(String(s.empId))}">รีเซ็ต PIN</button>
            <button class="btn btn-outline btn-sm" data-toggle="${U.esc(String(s.empId))}">${s.active === false ? "เปิดใช้งาน" : "ปิดใช้งาน"}</button>
          </div>
        </article>`).join("") || `<div class="card card-pad center-empty">ไม่พบผู้ใช้</div>`}
    </div>`;
    return `<div class="card"><div class="table-wrap tbl-responsive">
      <table class="tbl">
        <thead><tr><th>รหัส</th><th>ชื่อ</th><th>ตำแหน่ง</th><th>สิทธิ์</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
        <tbody>${list.map(rowOf).join("") || `<tr><td colspan="6"><div class="center-empty">ไม่พบผู้ใช้</div></td></tr>`}</tbody>
      </table>
    </div></div>`;
  }

  const rowOf = s => `
  <tr>
    <td data-label="รหัส"><b>${s.empId}</b></td>
    <td data-label="ชื่อ"><span class="flex items-center gap-2">${U.avatar(s.empId, "avatar-sm")} ${U.esc(s.name)}</span></td>
    <td data-label="ตำแหน่ง" style="white-space:normal">${U.esc(s.position)}</td>
    <td data-label="สิทธิ์">${roleBadge(s)}</td>
    <td data-label="สถานะ"><span class="badge ${s.active === false ? "b-gray" : "b-green"}">${s.active === false ? "ปิดใช้งาน" : "ใช้งาน"}</span></td>
    <td data-label="จัดการ"><div class="row-actions">
      <button class="btn btn-outline btn-sm" data-edit="${s.empId}">แก้ไข</button>
      <button class="btn btn-soft btn-sm" data-pin="${s.empId}">รีเซ็ต PIN</button>
      <button class="btn btn-outline btn-sm" data-toggle="${s.empId}">${s.active === false ? "เปิดใช้งาน" : "ปิดใช้งาน"}</button>
    </div></td>
  </tr>`;

  function bindRows() {
    U.$$("[data-edit]").forEach(b => b.onclick = () =>
      openForm(DATA.staff.find(s => s.empId === b.dataset.edit)));
    U.$$("[data-pin]").forEach(b => b.onclick = () => {
      const s = DATA.staff.find(x => x.empId === b.dataset.pin);
      s.pin = "1234"; saveStaff();
      Toast.show(`รีเซ็ต PIN ของ ${s.name} เป็น 1234 แล้ว`, "success");
    });
    U.$$("[data-toggle]").forEach(b => b.onclick = () => {
      const s = DATA.staff.find(x => x.empId === b.dataset.toggle);
      s.active = s.active === false;
      saveStaff(); render();
      Toast.show(`${s.name}: ${s.active ? "เปิดใช้งาน" : "ปิดใช้งาน"} แล้ว`, "success");
    });
  }

  function openForm(s) {
    const isNew = !s;
    Modal.open({
      title: isNew ? "เพิ่มพนักงาน" : "แก้ไข: " + U.esc(s.name),
      body: `
        <div class="form-2col">
          <div class="field"><label>รหัสพนักงาน *</label>
            <input class="input" id="uf-id" value="${s ? U.esc(String(s.empId)) : ""}"
                   placeholder="เช่น 1039"></div>
          <div class="field"><label>PIN *</label>
            <input class="input" id="uf-pin" inputmode="numeric" maxlength="6"
                   value="${s ? s.pin : "1234"}"></div>
        </div>
        <div class="field"><label>ชื่อ-นามสกุล *</label>
          <input class="input" id="uf-name" value="${s ? U.esc(s.name) : ""}" placeholder="นาย ชื่อ นามสกุล"></div>
        <div class="field"><label>ตำแหน่ง</label>
          <input class="input" id="uf-pos" value="${s ? U.esc(s.position) : ""}" placeholder="เช่น โฟร์แมนโยธา"></div>
        <div class="field"><label>สิทธิ์การใช้งาน</label>
          <select class="select" id="uf-role">
            <option value="user" ${s && s.role === "user" ? "selected" : ""}>User — เช็คอินเข้างาน</option>
            <option value="tlh" ${s && s.role === "tlh" ? "selected" : ""}>หัวหน้างาน (TLH) — เหมือน Admin เมนูย่อ</option>
            <option value="admin" ${s && s.role === "admin" ? "selected" : ""}>Admin — ดูแลระบบทั้งหมด</option>
          </select></div>`,
      foot: `
        ${!isNew ? `<button class="btn btn-danger" id="uf-del" style="margin-right:auto">${Icons.get("trash", 15)} ลบบัญชี</button>` : ""}
        <button class="btn btn-outline" data-close>ยกเลิก</button>
        <button class="btn btn-primary" id="uf-save">บันทึก</button>`
    });

    U.$("#uf-save").onclick = async e => {
      const id = U.$("#uf-id").value.trim(), name = U.$("#uf-name").value.trim(),
            pin = U.$("#uf-pin").value.trim();
      if (!id || !name || !pin) { Toast.show("กรอกรหัส / ชื่อ / PIN ให้ครบ", "error"); return; }
      if (DATA.staff.some(x => x !== s && String(x.empId) === id)) {
        Toast.show("รหัสนี้ซ้ำ", "error"); return;
      }

      const saveButton = e.currentTarget;
      saveButton.disabled = true;
      const previous = s && {
        empId: s.empId, name: s.name, position: s.position, pin: s.pin, role: s.role
      };
      const oldEmpId = s ? String(s.empId) : null;
      const idChanged = !!s && oldEmpId !== id;
      const oldAttendance = idChanged ? (U.store("tlh_attendance") || []) : null;

      if (isNew) {
        DATA.staff.push({ empId: id, name, position: U.$("#uf-pos").value.trim() || "พนักงาน",
          pin, role: U.$("#uf-role").value, active: true });
      } else {
        Object.assign(s, { empId: id, name, position: U.$("#uf-pos").value.trim() || s.position,
          pin, role: U.$("#uf-role").value });
      }

      if (idChanged) {
        U.store("tlh_attendance", oldAttendance.map(record =>
          String(record.empId) === oldEmpId ? { ...record, empId: id } : record));
      }
      saveStaff();

      if (API.enabled() && !await API.flush()) {
        if (isNew) DATA.staff = DATA.staff.filter(staff => staff.empId !== id);
        else Object.assign(s, previous);
        if (idChanged) U.store("tlh_attendance", oldAttendance);
        saveStaff();
        await API.flush();
        saveButton.disabled = false;
        Toast.show("บันทึกไม่สำเร็จ ข้อมูลเดิมยังอยู่", "error");
        return;
      }

      if (idChanged) {
        const session = Auth.user();
        if (session && String(session.empId) === oldEmpId) {
          session.empId = id;
          localStorage.setItem("tlh_session", JSON.stringify(session));
        }
      }
      Modal.close(); render();
      Toast.show(isNew ? "เพิ่มพนักงานแล้ว" : "บันทึกแล้ว", "success");
    };

    const del = U.$("#uf-del");
    if (del) del.onclick = () => {
      DATA.staff = DATA.staff.filter(x => x.empId !== s.empId);
      saveStaff(); Modal.close(); render();
      Toast.show("ลบบัญชีแล้ว", "success");
    };
  }

  render();
  API.onCloud(render);
  window.addEventListener("resize", U.debounce(() => {
    if (viewSelected) return;
    const nextView = window.innerWidth <= 768 ? "cards" : "table";
    if (nextView !== view) { view = nextView; render(); }
  }, 150));
})();