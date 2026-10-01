/* ═══ All Projects — แก้ไข/ลบ ได้ทุกอย่าง ═══ */
(async function () {
  if (document.body.dataset.page !== "projects")
    throw new Error("[TLH] projects.js ถูกโหลดผิดหน้า");

  if (!Auth.require(["admin", "tlh"])) return;
  API.boot();
  Sidebar.render(); Topbar.render(); Toast.init(); Modal.init();

  let filter = "all", view = window.innerWidth <= 768 ? "cards" : "table", query = "";
  let viewSelected = false;
  const root = U.$("#page-root");
  const nameOf = id => { const m = DATA.members.find(x => x.id === id); return m ? m.name : "—"; };
  const healthOf = p => DATA.healthMap[p.health] || DATA.healthMap["on-track"];

  const FILTERS = [
    { key: "all",     label: "ทั้งหมด" },
    { key: "active",  label: "งาน Active" },
    { key: "defect",  label: "เก็บ 1 Year Defect" },
    { key: "closed",  label: "ปิด Job" },
    { key: "cancel",  label: "ยกเลิก" },
    { key: "delayed", label: "งานล่าช้า" },
    ...DATA.members.filter(m => String(m.role).includes("PM"))
        .map(m => ({ key: m.id, label: m.name }))
  ];

  const visible = () => DATA.projects.filter(p => {
    const okF = filter === "all" || p.stage === filter || p.owner === filter ||
                (filter === "delayed" && p.health === "delayed");
    const q = query.toLowerCase();
    return okF && (!q || (p.id + " " + p.name + " " + p.client).toLowerCase().includes(q));
  });

  const clientList = () =>
    `<datalist id="client-list">${DATA.clients.map(c => `<option value="${U.esc(c)}">`).join("")}</datalist>`;

  function rowHTML(p) {
    const st = DATA.stageMap[p.stage], h = healthOf(p);
    return `<tr data-id="${p.id}" style="cursor:pointer">
      <td data-label="เลขที่ JOB"><b>${U.esc(p.id)}</b></td>
      <td data-label="ชื่องาน" style="white-space:normal;min-width:240px">${U.esc(p.name)}</td>
      <td data-label="สถานะ"><span class="badge ${st.cls}">${st.label}</span></td>
      <td data-label="สถานะงาน"><span class="badge ${h.cls}">${h.label}</span></td>
      <td data-label="เจ้าของงาน">${p.owner
        ? `<span class="flex items-center gap-2">${U.avatar(p.owner, "avatar-sm")}<span class="small">${nameOf(p.owner)}</span></span>`
        : "—"}</td>
      <td data-label="ประสานงาน" class="small muted">${p.coordinator ? nameOf(p.coordinator) : "—"}</td>
      <td data-label="ลูกค้า" class="small muted">${U.esc(p.client)}</td>
      <td data-label="จัดการ"><div class="row-actions">
        <button class="btn btn-soft btn-sm" data-edit="${p.id}">แก้ไข</button>
        <button class="btn-icon" data-del="${p.id}" title="ลบ">${Icons.get("trash", 15)}</button>
      </div></td>
    </tr>`;
  }

  function cardsView(list) {
    return `<div class="pj-card-list">${list.map(p => {
      const st = DATA.stageMap[p.stage], h = healthOf(p);
      return `
      <article class="pj-card card card-hover card-pad" data-id="${p.id}" style="cursor:pointer">
        <div class="flex justify-between items-center">
          <span class="badge ${st.cls}">${st.label}</span>
          <span class="small muted">${p.id}</span>
        </div>
        <h3 class="mt-2" style="font-size:14px">${U.esc(p.name)}</h3>
        <div class="mt-2"><span class="badge ${h.cls}">${h.label}</span>
          <span class="small muted">· ${U.esc(p.client)}</span></div>
        <div class="flex items-center gap-2 mt-3">
          ${p.owner ? U.avatar(p.owner, "avatar-sm") : ""}
          <span class="small muted">${p.owner ? nameOf(p.owner) : "ไม่มี PM"}</span>
        </div>
      </article>`;
    }).join("")}</div>`;
  }

  function tableView(list) {
    if (!list.length) return `<div class="card card-pad center-empty">ไม่พบงานที่ตรงกับเงื่อนไข</div>`;
    return `
    <div class="card">
      <div class="table-wrap tbl-responsive">
        <table class="tbl">
          <thead><tr>
            <th>เลขที่ JOB</th><th>ชื่องาน</th><th>สถานะ</th><th>สถานะงาน</th>
            <th>เจ้าของงาน</th><th>ประสานงาน</th><th>ลูกค้า</th><th></th>
          </tr></thead>
          <tbody>${list.map(rowHTML).join("")}</tbody>
        </table>
      </div>
    </div>`;
  }

  function render() {
    root.innerHTML = `
    <div class="page-head">
      <div>
        <h1>All Projects</h1>
        <p class="sub">${visible().length} จาก ${DATA.projects.length} งาน · คลิกแถว/การ์ด เพื่อแก้ไข</p>
      </div>
      <div class="head-actions">
        <button class="btn btn-outline" id="pj-export">${Icons.get("download", 16)} Export</button>
        <button class="btn btn-primary" id="pj-new">${Icons.get("plus", 16)} เพิ่มงานใหม่</button>
      </div>
    </div>

    <div class="pj-toolbar">
      <div class="pj-toolbar-controls">
        <div class="search-wrap">
          ${Icons.get("search", 15)}
          <input class="input" id="pj-search" placeholder="ค้นหาเลขที่ JOB / ชื่องาน / ลูกค้า…" value="${U.esc(query)}">
        </div>
        <div class="view-toggle" role="group" aria-label="รูปแบบการแสดงผล">
          <button data-v="table" class="${view === "table" ? "active" : ""}" aria-pressed="${view === "table"}">${Icons.get("layers", 14)} ตาราง</button>
          <button data-v="cards" class="${view === "cards" ? "active" : ""}" aria-pressed="${view === "cards"}">${Icons.get("grid", 14)} การ์ด</button>
        </div>
      </div>
      <div class="chips">
        ${FILTERS.map(f => `<button class="chip ${filter === f.key ? "active" : ""}" data-f="${f.key}">${f.label}</button>`).join("")}
      </div>
    </div>

    <div id="pj-list">${view === "table" ? tableView(visible()) : cardsView(visible())}</div>`;

    bind();
  }

  function bind() {
    U.$$(".chip").forEach(c => c.onclick = () => { filter = c.dataset.f; render(); });
    U.$$(".view-toggle button").forEach(b => b.onclick = () => {
      view = b.dataset.v;
      viewSelected = true;
      render();
    });

    U.$("#pj-search").addEventListener("input", U.debounce(e => {
      query = e.target.value;
      U.$("#pj-list").innerHTML = view === "table" ? tableView(visible()) : cardsView(visible());
    }, 200));

    U.$("#pj-list").addEventListener("click", e => {
      const del = e.target.closest("[data-del]");
      if (del) { deleteProject(DATA.projects.find(p => p.id === del.dataset.del)); return; }
      const btn = e.target.closest("[data-edit]") || e.target.closest("[data-id]");
      if (!btn) return;
      openEditor(DATA.projects.find(p => p.id === (btn.dataset.edit || btn.dataset.id)));
    });

    U.$("#pj-export").onclick = () => WorkbookExport.open("projects");
    U.$("#pj-new").onclick = () => ProjectForm.open(() => {
      render(); Toast.show("เพิ่มงานใหม่เรียบร้อย", "success");
    });
  }

  function openEditor(p) {
    if (!p) return;
    const pmOpts = sel => DATA.members.filter(m => String(m.role).includes("PM"))
      .map(m => `<option value="${m.id}" ${sel === m.id ? "selected" : ""}>${U.esc(m.name)}</option>`).join("");
    const coOpts = sel => DATA.members.filter(m => !String(m.role).includes("PM"))
      .map(m => `<option value="${m.id}" ${sel === m.id ? "selected" : ""}>${U.esc(m.name)}</option>`).join("");

    Modal.open({
      title: "แก้ไขงาน · " + U.esc(p.id),
      body: `
        ${clientList()}
        <div class="form-2col">
          <div class="field"><label>เลขที่ JOB *</label>
            <input class="input" id="pe-id" value="${U.esc(p.id)}"></div>
          <div class="field"><label>ลูกค้า</label>
            <input class="input" id="pe-client" list="client-list" value="${U.esc(p.client)}"></div>
        </div>
        <div class="field"><label>ชื่องาน *</label>
          <input class="input" id="pe-name" value="${U.esc(p.name)}"></div>
        <div class="form-2col">
          <div class="field"><label>สถานะ</label>
            <select class="select" id="pe-stage">${Object.entries(DATA.stageMap).map(([k, v]) =>
              `<option value="${k}" ${p.stage === k ? "selected" : ""}>${v.label}</option>`).join("")}</select></div>
          <div class="field"><label>สถานะงาน</label>
            <select class="select" id="pe-health">${Object.entries(DATA.healthMap).map(([k, v]) =>
              `<option value="${k}" ${p.health === k ? "selected" : ""}>${v.label}</option>`).join("")}</select></div>
        </div>
        <div class="form-2col">
          <div class="field"><label>เจ้าของงาน (PM)</label>
            <select class="select" id="pe-owner"><option value="">— ไม่มี —</option>${pmOpts(p.owner)}</select></div>
          <div class="field"><label>ประสานงาน</label>
            <select class="select" id="pe-coord"><option value="">— ไม่มี —</option>${coOpts(p.coordinator)}</select></div>
        </div>`,
      foot: `
        <button class="btn btn-danger" id="pe-del" style="margin-right:auto">${Icons.get("trash", 15)} ลบงาน</button>
        <button class="btn btn-outline" data-close>ยกเลิก</button>
        <button class="btn btn-primary" id="pe-save">บันทึก</button>`
    });

    U.$("#pe-save").onclick = () => {
      const id = U.$("#pe-id").value.trim(), name = U.$("#pe-name").value.trim();
      if (!id || !name) { Toast.show("กรอกเลขที่ JOB และชื่องานให้ครบ", "error"); return; }
      if (DATA.projects.some(x => x.id === id && x !== p)) {
        Toast.show("เลขที่ JOB นี้ซ้ำกับงานอื่น", "error"); return;
      }
      Object.assign(p, {
        id, name,
        client: U.$("#pe-client").value.trim() || "ไม่ระบุ",
        stage: U.$("#pe-stage").value,
        health: U.$("#pe-health").value,
        owner: U.$("#pe-owner").value || null,
        coordinator: U.$("#pe-coord").value || null
      });
      U.store("tlh_projects", DATA.projects);
      Modal.close(); render();
      Toast.show("บันทึกงาน " + id + " แล้ว", "success");
    };

    U.$("#pe-del").onclick = () => deleteProject(p);
  }

  function deleteProject(p) {
    if (!p) return;
    Modal.open({
      title: "ลบงาน " + U.esc(p.id),
      body: `<p>ยืนยันการลบ <b>${U.esc(p.name)}</b> (${p.id})?</p>
             <p class="small muted mt-2">ลบแล้วไม่สามารถย้อนกลับได้</p>`,
      foot: `<button class="btn btn-outline" data-close>ยกเลิก</button>
             <button class="btn btn-danger" id="pd-yes">${Icons.get("trash", 15)} ลบ</button>`
    });
    U.$("#pd-yes").onclick = () => {
      DATA.projects = DATA.projects.filter(x => x.id !== p.id);
      U.store("tlh_projects", DATA.projects);
      Modal.close(); render();
      Toast.show("ลบงานแล้ว", "success");
    };
  }

  document.addEventListener("app:search", e => {
    query = e.detail;
    const s = U.$("#pj-search"); if (s) s.value = query;
    const el = U.$("#pj-list");
    if (el) el.innerHTML = view === "table" ? tableView(visible()) : cardsView(visible());
  });

  window.addEventListener("resize", U.debounce(() => {
    if (viewSelected) return;
    const nextView = window.innerWidth <= 768 ? "cards" : "table";
    if (nextView !== view) { view = nextView; render(); }
  }, 150));

  render();
  API.onCloud(render);
})();