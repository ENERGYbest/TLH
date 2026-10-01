/* ═══ จัดการ PM / ประสานงาน / ลูกค้า ═══ */
(async function () {
  if (document.body.dataset.page !== "entities")
    throw new Error("[TLH] entities.js ถูกโหลดผิดหน้า");

  if (!Auth.require(["admin", "tlh"])) return;
  API.boot();
  Sidebar.render(); Topbar.render(); Toast.init(); Modal.init();

  const root = U.$("#page-root");
  const saveMembers = () => U.store("tlh_members", DATA.members);
  const saveClients = () => U.store("tlh_clients", DATA.clients);
  let view = window.innerWidth <= 768 ? "cards" : "table";
  let viewSelected = false;

  const isPM = m => String(m.role).includes("PM");
  const memberJobs = id => DATA.projects.filter(p => p.owner === id || p.coordinator === id).length;
  const clientJobs = name => DATA.projects.filter(p => p.client === name).length;

  function render() {
    root.innerHTML = `
    <div class="page-head">
      <div><h1>จัดการ PM และลูกค้า</h1>
        <p class="sub">แก้ไข / เพิ่ม / ลบ ได้ทุกอย่าง — ข้อมูลอัปเดตทุกหน้าและทุกเครื่อง</p></div>
    </div>

    <div class="view-toggle data-view-control" role="group" aria-label="รูปแบบการแสดงผล">
      <button data-layout="table" class="${view === "table" ? "active" : ""}" aria-pressed="${view === "table"}">${Icons.get("layers", 14)} ตาราง</button>
      <button data-layout="cards" class="${view === "cards" ? "active" : ""}" aria-pressed="${view === "cards"}">${Icons.get("grid", 14)} การ์ด</button>
    </div>

    <div class="ent-grid">
      <div class="card">
        <div class="section-title" style="padding:16px 16px 0">
          <h2>${Icons.get("user", 17)} ผู้รับผิดชอบงาน (${DATA.members.length})</h2>
          <button class="btn btn-primary btn-sm" id="m-add">${Icons.get("plus", 14)} เพิ่มคน</button>
        </div>
        ${view === "cards" ? `<div class="entity-card-list">
          ${DATA.members.map(m => `
            <article class="entity-card card">
              <div class="entity-card-head">
                <span class="flex items-center gap-2">${U.avatar(m.id, "avatar-sm")}<b>${U.esc(m.name)}</b></span>
                <span class="badge ${isPM(m) ? "b-red" : "b-blue"}">${isPM(m) ? "PM / เจ้าของงาน" : "ประสานงาน"}</span>
              </div>
              <div class="entity-card-meta"><span class="small muted">งานที่ดูแล</span><b>${memberJobs(m.id)} งาน</b></div>
              <div class="row-actions">
                <button class="btn btn-soft btn-sm" data-medit="${U.esc(m.id)}">แก้ไข</button>
                <button class="btn-icon" data-mdel="${U.esc(m.id)}" title="ลบ">${Icons.get("trash", 15)}</button>
              </div>
            </article>`).join("") || `<div class="center-empty">ยังไม่มีผู้รับผิดชอบงาน</div>`}
        </div>` : `<div class="table-wrap tbl-responsive">
          <table class="tbl">
            <thead><tr><th>ชื่อ</th><th>บทบาท</th><th>งานที่ดูแล</th><th>จัดการ</th></tr></thead>
            <tbody>
            ${DATA.members.map(m => `
              <tr>
                <td data-label="ชื่อ"><span class="flex items-center gap-2">
                  ${U.avatar(m.id, "avatar-sm")} <b>${U.esc(m.name)}</b></span></td>
                <td data-label="บทบาท"><span class="badge ${isPM(m) ? "b-red" : "b-blue"}">
                  ${isPM(m) ? "PM / เจ้าของงาน" : "ประสานงาน"}</span></td>
                <td data-label="งานที่ดูแล">${memberJobs(m.id)} งาน</td>
                <td data-label="จัดการ"><div class="row-actions">
                  <button class="btn btn-soft btn-sm" data-medit="${m.id}">แก้ไข</button>
                  <button class="btn-icon" data-mdel="${m.id}" title="ลบ">${Icons.get("trash", 15)}</button>
                </div></td>
              </tr>`).join("")}
            </tbody>
          </table>
        </div>`}
      </div>

      <div class="card">
        <div class="section-title" style="padding:16px 16px 0">
          <h2>${Icons.get("briefcase", 17)} ลูกค้า (${DATA.clients.length})</h2>
          <button class="btn btn-primary btn-sm" id="c-add">${Icons.get("plus", 14)} เพิ่มลูกค้า</button>
        </div>
        ${view === "cards" ? `<div class="entity-card-list">
          ${DATA.clients.map((c, i) => `
            <article class="entity-card card">
              <div class="entity-card-head"><b>${U.esc(c)}</b><span class="badge b-gray">${clientJobs(c)} งาน</span></div>
              <div class="row-actions">
                <button class="btn btn-soft btn-sm" data-cedit="${i}">แก้ไข</button>
                <button class="btn-icon" data-cdel="${i}" title="ลบ">${Icons.get("trash", 15)}</button>
              </div>
            </article>`).join("") || `<div class="center-empty">ยังไม่มีลูกค้า</div>`}
        </div>` : `<div class="table-wrap tbl-responsive">
          <table class="tbl">
            <thead><tr><th>ชื่อลูกค้า</th><th>งาน</th><th>จัดการ</th></tr></thead>
            <tbody>
            ${DATA.clients.map((c, i) => `
              <tr>
                <td data-label="ชื่อลูกค้า"><b>${U.esc(c)}</b></td>
                <td data-label="งาน">${clientJobs(c)} งาน</td>
                <td data-label="จัดการ"><div class="row-actions">
                  <button class="btn btn-soft btn-sm" data-cedit="${i}">แก้ไข</button>
                  <button class="btn-icon" data-cdel="${i}" title="ลบ">${Icons.get("trash", 15)}</button>
                </div></td>
              </tr>`).join("")}
            </tbody>
          </table>
        </div>`}
      </div>
    </div>`;

    U.$("#m-add").onclick = () => memberForm(null);
    U.$("#c-add").onclick = () => clientForm(null, -1);
    U.$$ ("[data-layout]").forEach(b => b.onclick = () => {
      view = b.dataset.layout;
      viewSelected = true;
      render();
    });
    U.$$("[data-medit]").forEach(b => b.onclick = () =>
      memberForm(DATA.members.find(m => m.id === b.dataset.medit)));
    U.$$("[data-mdel]").forEach(b => b.onclick = () =>
      memberDelete(DATA.members.find(m => m.id === b.dataset.mdel)));
    U.$$("[data-cedit]").forEach(b => b.onclick = () =>
      clientForm(DATA.clients[Number(b.dataset.cedit)], Number(b.dataset.cedit)));
    U.$$("[data-cdel]").forEach(b => b.onclick = () =>
      clientDelete(DATA.clients[Number(b.dataset.cdel)]));
  }

  function memberForm(m) {
    const isNew = !m;
    Modal.open({
      title: isNew ? "เพิ่มผู้รับผิดชอบงาน" : "แก้ไข: " + U.esc(m.name),
      body: `
        <div class="field"><label>ชื่อ *</label>
          <input class="input" id="mf-name" value="${m ? U.esc(m.name) : ""}" placeholder="เช่น พี่แป๊ะ"></div>
        <div class="field"><label>บทบาท</label>
          <select class="select" id="mf-role">
            <option value="PM / เจ้าของงาน" ${m && isPM(m) ? "selected" : ""}>PM / เจ้าของงาน</option>
            <option value="ประสานงาน" ${m && !isPM(m) ? "selected" : ""}>ประสานงาน</option>
          </select></div>
        <div class="field"><label>สีประจำตัว (อวตาร)</label>
          <input type="color" class="color-input" id="mf-color" value="${m ? m.color : "#D01B22"}"></div>
        ${!isNew ? `<p class="small muted">ดูแลอยู่ ${memberJobs(m.id)} งาน — แก้ชื่อแล้วทุกหน้าอัปเดตอัตโนมัติ</p>` : ""}`,
      foot: `<button class="btn btn-outline" data-close>ยกเลิก</button>
             <button class="btn btn-primary" id="mf-save">บันทึก</button>`
    });
    U.$("#mf-save").onclick = () => {
      const name = U.$("#mf-name").value.trim();
      if (!name) { Toast.show("กรุณากรอกชื่อ", "error"); return; }
      if (isNew) {
        DATA.members.push({
          id: "m" + Date.now(), name,
          role: U.$("#mf-role").value, color: U.$("#mf-color").value
        });
      } else {
        Object.assign(m, {
          name, role: U.$("#mf-role").value, color: U.$("#mf-color").value
        });
      }
      saveMembers(); Modal.close(); render();
      Toast.show(isNew ? "เพิ่มแล้ว" : "บันทึกแล้ว", "success");
    };
  }

  function memberDelete(m) {
    if (!m) return;
    const used = DATA.projects.filter(p => p.owner === m.id || p.coordinator === m.id);
    Modal.open({
      title: "ลบ: " + U.esc(m.name),
      body: `<p>ยืนยันการลบ <b>${U.esc(m.name)}</b>?</p>
        ${used.length ? `<p class="small mt-2" style="color:var(--red-600)">
          ⚠️ มี ${used.length} งานผูกกับคนนี้ — งานเหล่านั้นจะถูกตั้งเป็น "ไม่มีผู้รับผิดชอบ"</p>` : ""}`,
      foot: `<button class="btn btn-outline" data-close>ยกเลิก</button>
             <button class="btn btn-danger" id="md-yes">${Icons.get("trash", 15)} ลบ</button>`
    });
    U.$("#md-yes").onclick = () => {
      used.forEach(p => {
        if (p.owner === m.id) p.owner = null;
        if (p.coordinator === m.id) p.coordinator = null;
      });
      DATA.members = DATA.members.filter(x => x.id !== m.id);
      U.store("tlh_projects", DATA.projects);
      saveMembers(); Modal.close(); render();
      Toast.show("ลบแล้ว", "success");
    };
  }

  function clientForm(c, idx) {
    const isNew = idx < 0;
    Modal.open({
      title: isNew ? "เพิ่มลูกค้า" : "แก้ไขลูกค้า: " + U.esc(c),
      body: `
        <div class="field"><label>ชื่อลูกค้า *</label>
          <input class="input" id="cf-name" value="${isNew ? "" : U.esc(c)}" placeholder="เช่น Makro, ปตท."></div>
        ${!isNew ? `<p class="small muted">มี ${clientJobs(c)} งานใช้ลูกค้านี้ — เปลี่ยนชื่อแล้วจะอัปเดตทุกงานอัตโนมัติ</p>` : ""}`,
      foot: `<button class="btn btn-outline" data-close>ยกเลิก</button>
             <button class="btn btn-primary" id="cf-save">บันทึก</button>`
    });
    U.$("#cf-save").onclick = () => {
      const name = U.$("#cf-name").value.trim();
      if (!name) { Toast.show("กรุณากรอกชื่อลูกค้า", "error"); return; }
      if (isNew) {
        if (DATA.clients.includes(name)) { Toast.show("มีลูกค้าชื่อนี้อยู่แล้ว", "error"); return; }
        DATA.clients.push(name);
      } else {
        if (name !== c && DATA.clients.includes(name)) { Toast.show("มีลูกค้าชื่อนี้อยู่แล้ว", "error"); return; }
        DATA.clients[idx] = name;
        DATA.projects.forEach(p => { if (p.client === c) p.client = name; });
        U.store("tlh_projects", DATA.projects);
      }
      saveClients(); Modal.close(); render();
      Toast.show(isNew ? "เพิ่มลูกค้าแล้ว" : "บันทึกแล้ว (อัปเดตทุกงาน)", "success");
    };
  }

  function clientDelete(c) {
    if (c === undefined || c === null) return;
    const used = DATA.projects.filter(p => p.client === c);
    Modal.open({
      title: "ลบลูกค้า: " + U.esc(c),
      body: `<p>ยืนยันการลบ <b>${U.esc(c)}</b>?</p>
        ${used.length ? `<p class="small mt-2" style="color:var(--red-600)">
          ⚠️ มี ${used.length} งานใช้ลูกค้านี้ — งานเหล่านั้นจะถูกตั้งเป็น "ไม่ระบุ"</p>` : ""}`,
      foot: `<button class="btn btn-outline" data-close>ยกเลิก</button>
             <button class="btn btn-danger" id="cd-yes">${Icons.get("trash", 15)} ลบ</button>`
    });
    U.$("#cd-yes").onclick = () => {
      used.forEach(p => { p.client = "ไม่ระบุ"; });
      DATA.clients = DATA.clients.filter(x => x !== c);
      U.store("tlh_projects", DATA.projects);
      saveClients(); Modal.close(); render();
      Toast.show("ลบลูกค้าแล้ว", "success");
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