/* ═══ Dashboard — จบครบในหน้าเดียว (ทุกอย่างเป็น popup)
   ▸ กดไซต์ → popup คนที่ไป · กดคน → popup ไซต์ที่ไป · กดรูป → popup รูป
   ▸ ใน popup กดสลับกันได้เรื่อย ๆ มีปุ่ม "ย้อนกลับ"
   ▸ Admin และ tlh (หัวหน้างาน) เห็นเหมือนกันทั้งหน้า ═══ */
(async function () {
  if (document.body.dataset.page !== "dashboard")
    throw new Error("[TLH] dashboard.js ถูกโหลดผิดหน้า — ตรวจ <script> ท้าย index.html");

  if (!Auth.require(["admin", "tlh"])) return;
  API.boot();
  Sidebar.render(); Topbar.render(); Toast.init(); Modal.init();

  const me = Auth.user();
  const isAdmin = (me.role === "admin" || me.role === "tlh");
  const root = U.$("#page-root");
  const KEY = "tlh_attendance";
  let fDate = U.todayISO();
  let searchQuery = "";
  let dataView = window.innerWidth <= 768 ? "cards" : "table";
  let dataViewSelected = false;

  const recs = () => U.store(KEY) || [];
  const employeeStaff = () => DATA.staff.filter(s => s.role !== "admin" && s.role !== "tlh");
  const employeeIds = () => new Set(employeeStaff().map(s => String(s.empId)));
  const dayRecs = () => recs().filter(r => r.date === fDate)
    .filter(r => employeeIds().has(String(r.empId)))
    .sort((a, b) => (a.timeIn || "").localeCompare(b.timeIn || ""));
  const staffOf = id => DATA.staff.find(s => String(s.empId) === String(id));
  const nameOf = r => r.name || (staffOf(r.empId) || {}).name || "—";
  const activeStaff = () => employeeStaff().filter(s => s.active !== false);
  const matchesQuery = (...values) => {
    const q = searchQuery.trim().toLocaleLowerCase();
    return !q || values.some(value => String(value ?? "").toLocaleLowerCase().includes(q));
  };
  const matchesStaff = s => matchesQuery(s.empId, s.name, s.position);
  const matchesRecord = r => {
    const location = String(r.location || "").toLocaleLowerCase();
    const related = DATA.projects.filter(p =>
      location.includes(String(p.id || "").toLocaleLowerCase()) ||
      location.includes(String(p.name || "").toLocaleLowerCase()))
      .flatMap(p => [p.id, p.name]);
    const s = staffOf(r.empId);
    return matchesQuery(r.empId, r.name, s && s.name, s && s.position, r.location, ...related);
  };

  const PAL = ["#D01B22","#2E6FD8","#1FA97C","#E89B18","#7C4DD8","#0FA3B1","#C2410C","#4E5563"];
  function av(empId, n = 44) {
    const s = staffOf(empId);
    if (s && s.photo)
      return `<img class="avatar" style="width:${n}px;height:${n}px;object-fit:cover" src="${s.photo}" alt="">`;
    const color = s ? PAL[Number(s.empId) % PAL.length] : "#9AA1B0";
    return `<span class="avatar" style="width:${n}px;height:${n}px;background:${color};font-size:${Math.round(n * 0.38)}px">${U.esc(U.initials(s ? s.name : "??"))}</span>`;
  }
  const thumb = r => {
    const photos = [
      r.photo && `<button class="dx-photo-link" data-photo="${r.rid}" data-photo-kind="checkin" title="ดูรูปเช็คอิน"><span>เข้า</span><img class="dx-thumb" src="${r.photo}" alt="รูปเช็คอิน"></button>`,
      r.photoOut && `<button class="dx-photo-link is-checkout" data-photo="${r.rid}" data-photo-kind="checkout" title="ดูรูปเช็คเอาท์"><span>ออก</span><img class="dx-thumb" src="${r.photoOut}" alt="รูปเช็คเอาท์"></button>`
    ].filter(Boolean);
    return photos.length
      ? `<span class="dx-photo-pair">${photos.join("")}</span>`
      : `<span class="dx-thumb dx-thumb-empty">${Icons.get("image", 18)}</span>`;
  };

  /* ═══ Popup explorer + ปุ่มย้อนกลับ ═══ */
  let hist = [];
  Modal.setOnClose(() => { hist = []; });

  const modalFoot = () => `
    ${hist.length > 1
      ? `<button class="btn btn-outline" data-mback style="margin-right:auto">${Icons.get("chev-left", 14)} ย้อนกลับ</button>`
      : ""}
    <button class="btn btn-primary" data-close>ปิด</button>`;

  function openSite(loc, noPush) {
    if (!noPush) hist.push("site:" + loc);
    const rs = dayRecs().filter(r => r.location === loc);
    Modal.open({
      title: `<span class="dx-pop-title">${Icons.get("target", 16)}<span class="truncate">${U.esc(loc)}</span></span>`,
      body: `
        <div class="dx-pop-sub">${rs.length} คนเช็คอินที่ไซต์นี้ · ${U.fmtDate(fDate)}</div>
        ${rs.map(r => {
          const s = staffOf(r.empId);
          return `
          <div class="dx-row" data-person="${r.empId}">
            ${av(r.empId, 44)}
            <div class="dx-row-main">
              <div class="dx-row-name">${U.esc(nameOf(r))}${s ? `<span class="small muted">· ${U.esc(s.position)}</span>` : ""}</div>
              <div class="dx-row-sub">เช็คอิน ${r.timeIn} น. · ${r.timeOut ? `เช็คเอาท์ ${U.fmtDate(r.dateOut || r.date)} ${r.timeOut} น.` : "ยังไม่เช็คเอาท์"} — กดดูไซต์ทั้งหมดของคนนี้ →</div>
            </div>
            ${thumb(r)}
          </div>`;
        }).join("") || `<div class="center-empty">ไม่มีคนเช็คอินไซต์นี้</div>`}`,
      foot: modalFoot()
    });
  }

  function openPerson(empId, noPush) {
    if (!noPush) hist.push("person:" + empId);
    const rs = dayRecs().filter(r => String(r.empId) === String(empId));
    const s = staffOf(empId);
    Modal.open({
      title: `<span class="dx-pop-title"><span class="truncate">${U.esc(rs.length ? nameOf(rs[0]) : (s ? s.name : "—"))}</span></span>`,
      body: `
        <div class="dx-pop-sub">${s ? U.esc(s.position) + " · " : ""}รหัส ${empId} · ${U.fmtDate(fDate)}</div>
        <div class="dx-mini dx-mini-modal">
          <div class="card"><div class="v">${new Set(rs.map(r => r.location)).size}</div><div class="l">ไซต์</div></div>
          <div class="card"><div class="v">${rs.length}</div><div class="l">ครั้งเช็คอิน</div></div>
          <div class="card"><div class="v">${rs.length ? rs[0].timeIn : "—"}</div><div class="l">เช็คแรก</div></div>
        </div>
        ${rs.map(r => `
          <div class="dx-row" data-site="${U.esc(r.location)}">
            <span class="dx-loc-ic">${Icons.get("target", 20)}</span>
            <div class="dx-row-main">
              <div class="dx-row-name">${U.esc(r.location)}</div>
              <div class="dx-row-sub">เช็คอิน ${r.timeIn} น. · ${r.timeOut ? `เช็คเอาท์ ${U.fmtDate(r.dateOut || r.date)} ${r.timeOut} น.` : "ยังไม่เช็คเอาท์"} — กดดูคนที่ไซต์นี้ →</div>
            </div>
            ${thumb(r)}
          </div>`).join("") || `<div class="center-empty">ยังไม่ได้เช็คอินวันที่ ${U.fmtDate(fDate)}</div>`}`,
      foot: modalFoot()
    });
  }

  function openPhoto(rid, noPush, kind = "checkin") {
    const r = recs().find(x => Number(x.rid) === Number(rid));
    const photo = kind === "checkout" ? r?.photoOut : r?.photo;
    const eventDate = kind === "checkout" ? r?.dateOut || r?.date : r?.date;
    const eventTime = kind === "checkout" ? r?.timeOut : r?.timeIn;
    if (!r || !photo) return;
    if (!noPush) hist.push(`photo:${kind}:${rid}`);
    Modal.open({
      title: `<span class="dx-pop-title"><span class="truncate">${kind === "checkout" ? "เช็คเอาท์" : "เช็คอิน"} · ${U.esc(nameOf(r))}</span></span>`,
      body: `<img src="${photo}" style="width:100%;border-radius:12px">
             <p class="small muted" style="text-align:center;margin-top:8px">
               ${U.esc(r.location)} · ${U.fmtDate(eventDate)} · ${eventTime || "—"} น.</p>`,
      foot: modalFoot()
    });
  }

  function modalBack() {
    hist.pop();
    const prev = hist.pop();
    if (!prev) { Modal.close(); return; }
    const i = prev.indexOf(":");
    const t = prev.slice(0, i), arg = prev.slice(i + 1);
    if (t === "site") openSite(arg, true);
    else if (t === "person") openPerson(arg, true);
    else if (t === "photo") {
      const [kind, rid] = arg.split(":");
      openPhoto(Number(rid === undefined ? kind : rid), true, rid === undefined ? "checkin" : kind);
    }
    else Modal.close();
  }

  document.addEventListener("click", e => {
    if (e.target.closest("[data-mback]")) { modalBack(); return; }
    const photo = e.target.closest("[data-photo]");
    if (photo) { openPhoto(photo.dataset.photo, false, photo.dataset.photoKind); return; }
    const person = e.target.closest("[data-person]");
    if (person) { openPerson(person.dataset.person); return; }
    const site = e.target.closest("[data-site]");
    if (site) { openSite(site.dataset.site); return; }
  });

  /* ═══ หน้าหลัก ═══ */
  function homeHTML() {
    const day = dayRecs().filter(matchesRecord);
    const siteMap = new Map();
    day.forEach(r => {
      if (!siteMap.has(r.location)) siteMap.set(r.location, []);
      siteMap.get(r.location).push(r);
    });
    const personMap = new Map();
    day.forEach(r => {
      const k = String(r.empId);
      if (!personMap.has(k)) personMap.set(k, []);
      personMap.get(k).push(r);
    });
    const sites = [...siteMap.entries()].sort((a, b) => b[1].length - a[1].length);
    const people = [...personMap.values()].sort((a, b) => b.length - a.length);
    const unchecked = activeStaff().filter(matchesStaff)
      .filter(s => !personMap.has(String(s.empId)));
    const overnightCheckouts = recs()
      .filter(r => r.dateOut === fDate && r.date !== fDate && employeeIds().has(String(r.empId)))
      .filter(matchesRecord)
      .sort((a, b) => (a.timeOut || "").localeCompare(b.timeOut || ""));

    return `
    <div class="dx-explorer mt-4">
    <div class="card">
      <div class="section-title" style="padding:16px 16px 0">
        <h2>${Icons.get("target", 17)} ไซต์งาน — กดดูคนที่ไป (${sites.length})</h2>
      </div>
      <div class="dx-sites" style="padding:0 16px 16px">
        ${sites.map(([loc, rs]) => `
          <div class="dx-site" data-site="${U.esc(loc)}" title="${U.esc(loc)}">
            <div class="dx-site-top">
              <span class="dx-site-name">${U.esc(loc)}</span>
              <span class="badge b-red dx-site-badge">${rs.length} คน</span>
            </div>
            <div class="dx-site-foot">
              <span class="avatar-group">${rs.slice(0, 5).map(r => av(r.empId, 26)).join("")}</span>
              <span class="small muted">ล่าสุด ${rs[rs.length - 1].timeIn} น.</span>
            </div>
          </div>`).join("")
        || `<div class="center-empty" style="grid-column:1/-1">${searchQuery ? "ไม่พบไซต์ที่ตรงกับคำค้นหา" : `ไม่มีการเช็คอินวันที่ ${U.fmtDate(fDate)}`}</div>`}
      </div>
    </div>

    <div class="card">
      <div class="section-title" style="padding:16px 16px 0">
        <h2>${Icons.get("user", 17)} พนักงานที่เช็คอิน — กดดูไซต์ที่ไป (${people.length})</h2>
      </div>
      <div style="padding:0 16px 16px">
        ${people.map(rs => {
          const s = staffOf(rs[0].empId);
          return `
          <div class="dx-row" data-person="${rs[0].empId}">
            ${av(rs[0].empId, 44)}
            <div class="dx-row-main">
              <div class="dx-row-name">${U.esc(nameOf(rs[0]))}
                ${s ? `<span class="small muted">· ${U.esc(s.position)}</span>` : ""}</div>
              <div class="dx-row-sub">ไป ${rs.length} ไซต์ · ${rs.map(r => U.esc(r.location)).join(" · ")}</div>
            </div>
            <span class="badge b-green">${Icons.get("check-circle", 13)}</span>
          </div>`;
        }).join("") || `<div class="center-empty">${searchQuery ? "ไม่พบพนักงานที่ตรงกับคำค้นหา" : `ยังไม่มีใครเช็คอินวันที่ ${U.fmtDate(fDate)}`}</div>`}
      </div>
    </div>
    </div>

    ${overnightCheckouts.length ? `
    <div class="card mt-4">
      <div class="section-title" style="padding:16px 16px 0">
        <h2>${Icons.get("camera", 17)} เช็คเอาท์จากกะก่อน (${overnightCheckouts.length})</h2>
      </div>
      <div style="padding:0 16px 8px">
        ${overnightCheckouts.map(r => `
          <div class="dx-row" data-person="${r.empId}">
            ${av(r.empId, 38)}
            <div class="dx-row-main">
              <div class="dx-row-name">${U.esc(nameOf(r))}</div>
              <div class="dx-row-sub">${U.esc(r.location)} · เช็คอิน ${U.fmtDate(r.date)} ${r.timeIn} น.</div>
              <div class="dx-row-sub" style="color:var(--red-600)">เช็คเอาท์ ${U.fmtDate(r.dateOut)} ${r.timeOut} น.</div>
            </div>
            ${r.photoOut ? `<img class="dx-thumb" src="${r.photoOut}" data-photo="${r.rid}" data-photo-kind="checkout" alt="รูปเช็คเอาท์">` : `<span class="badge b-red">ออกแล้ว</span>`}
          </div>`).join("")}
      </div>
    </div>` : ""}

    <div class="card mt-4">
      <div class="section-title" style="padding:16px 16px 0">
        <h2>${Icons.get("alert", 17)} ยังไม่เช็คอิน (${unchecked.length})</h2>
      </div>
      <div class="dx-un" style="padding:0 16px 16px">
        ${unchecked.map(s => `<span class="dx-un-chip">${av(s.empId, 24)} ${U.esc(s.name)}</span>`).join("")
        || `<p class="small muted">ทุกคนเช็คอินครบแล้ว ✓</p>`}
      </div>
    </div>`;
  }

  /* ═══ ส่วนข้อมูลโปรเจกต์ (Admin + tlh) ═══ */
  function adminHTML() {
    const P = DATA.projects;
    const C = DATA.company;
    const total = P.length;
    const nameOfM = id => (DATA.members.find(m => m.id === id) || {}).name || "—";
    const filteredProjects = P.filter(p => matchesQuery(
      p.id, p.name, p.client, nameOfM(p.owner), nameOfM(p.coordinator)));
    const filteredStaff = employeeStaff().filter(matchesStaff);
    const w = window.innerWidth;
    const DS = w < 420 ? 76 : w < 640 ? 88 : 104;

    const ownerDonuts = DATA.members.filter(m => String(m.role).includes("PM")).map(m => {
      const n = filteredProjects.filter(p => p.owner === m.id).length;
      return `
      <div class="goal-item">
        ${Charts.donut({ pct: U.pct(n, filteredProjects.length), color: m.color, size: DS, stroke: 9,
                         centerTop: String(n), centerSub: "งาน" })}
        <div><div class="name">${m.name}</div>
          <div class="amount">${U.pct(n, filteredProjects.length).toFixed(1)}%</div></div>
      </div>`;
    }).join("");

    const cMap = {};
    filteredProjects.forEach(p => cMap[p.client] = (cMap[p.client] || 0) + 1);
    const cList = Object.entries(cMap).sort((a, b) => b[1] - a[1]);
    const cMax = cList.length ? cList[0][1] : 1;
    const clientBars = cList.map(([name, n]) => `
      <div class="cost-row">
        <div class="lbls"><span class="small muted">${U.esc(name)}</span><b>${n} งาน</b></div>
        <div class="cost-bar"><div class="fill actual" style="width:${U.pct(n, cMax)}%"></div></div>
      </div>`).join("");

    const jobRows = filteredProjects.map(p => {
      const st = DATA.stageMap[p.stage];
      return `<tr>
        <td data-label="เลขที่ JOB"><b>${U.esc(p.id)}</b></td>
        <td data-label="ชื่องาน" style="white-space:normal;min-width:260px">${U.esc(p.name)}</td>
        <td data-label="สถานะ"><span class="badge ${st.cls}">${st.label}</span></td>
        <td data-label="เจ้าของงาน"><span class="flex items-center gap-2">${U.avatar(p.owner, "avatar-sm")}
          <span class="small">${nameOfM(p.owner)}</span></span></td>
        <td data-label="ประสานงาน" class="small muted">${p.coordinator ? nameOfM(p.coordinator) : "—"}</td>
        <td data-label="ลูกค้า" class="small muted">${U.esc(p.client)}</td>
      </tr>`;
    }).join("");
    const jobCards = filteredProjects.map(p => {
      const st = DATA.stageMap[p.stage];
      const health = DATA.healthMap[p.health] || DATA.healthMap["on-track"];
      return `<article class="dash-data-card card">
        <div class="dash-data-card-head">
          <b>${U.esc(p.id)}</b>
          <span class="badge ${st.cls}">${st.label}</span>
        </div>
        <h3>${U.esc(p.name)}</h3>
        <div class="dash-data-meta"><span class="small muted">ลูกค้า</span><span>${U.esc(p.client)}</span></div>
        <div class="dash-data-meta"><span class="small muted">สถานะงาน</span><span class="badge ${health.cls}">${health.label}</span></div>
        <div class="dash-data-meta"><span class="small muted">เจ้าของงาน</span><span>${U.esc(nameOfM(p.owner))}</span></div>
        <div class="dash-data-meta"><span class="small muted">ประสานงาน</span><span>${p.coordinator ? U.esc(nameOfM(p.coordinator)) : "—"}</span></div>
      </article>`;
    }).join("") || `<div class="card card-pad center-empty">ไม่พบงานที่ตรงกับคำค้นหา</div>`;

    const staffRows = filteredStaff.map(s => `
      <tr>
        <td data-label="ลำดับ" class="small muted" style="width:64px">${s.no}</td>
        <td data-label="รหัสพนักงาน"><b>${U.esc(s.empId)}</b></td>
        <td data-label="ชื่อพนักงาน">${U.esc(s.name)}</td>
        <td data-label="ตำแหน่ง" class="small muted">${U.esc(s.position)}</td>
      </tr>`).join("");
    const staffCards = filteredStaff.map(s => `
      <article class="dash-data-card card">
        <div class="dash-data-card-head">
          <span class="flex items-center gap-2">${U.avatar(s.empId, "avatar-sm")}<b>${U.esc(s.name)}</b></span>
          <span class="small muted">${U.esc(String(s.empId))}</span>
        </div>
        <div class="dash-data-meta"><span class="small muted">ลำดับ</span><span>${U.esc(String(s.no || "—"))}</span></div>
        <div class="dash-data-meta"><span class="small muted">ตำแหน่ง</span><span>${U.esc(s.position || "—")}</span></div>
      </article>`).join("") || `<div class="card card-pad center-empty">ไม่พบพนักงานที่ตรงกับคำค้นหา</div>`;

    return `
    <div class="section-title mt-4">
      <h2>${Icons.get("briefcase", 17)} ข้อมูลโปรเจกต์ (${total})</h2>
      <div class="view-toggle" id="dashboard-view-toggle" role="group" aria-label="รูปแบบข้อมูลโปรเจกต์">
        <button data-dash-view="table" class="${dataView === "table" ? "active" : ""}" aria-pressed="${dataView === "table"}">${Icons.get("layers", 14)} ตาราง</button>
        <button data-dash-view="cards" class="${dataView === "cards" ? "active" : ""}" aria-pressed="${dataView === "cards"}">${Icons.get("grid", 14)} การ์ด</button>
      </div>
    </div>
    <div class="dash-two">
      <div class="card">
        <div class="section-title" style="padding:18px 20px 0">
          <h2>${Icons.get("folder", 17)} รายการงาน (${filteredProjects.length}${searchQuery ? ` / ${total}` : ""})</h2>
          <a class="btn btn-soft btn-sm" href="projects.html">ดูทั้งหมด ${Icons.get("arrow-right", 14)}</a>
        </div>
        ${dataView === "cards" ? `<div class="dash-data-list">${jobCards}</div>` : `<div class="table-wrap tbl-responsive">
          <table class="tbl">
            <thead><tr><th>เลขที่ JOB</th><th>ชื่องาน</th><th>สถานะ</th>
              <th>เจ้าของงาน (PM)</th><th>ประสานงาน</th><th>ลูกค้า</th></tr></thead>
            <tbody>${jobRows || `<tr><td colspan="6"><div class="center-empty">ไม่พบงานที่ตรงกับคำค้นหา</div></td></tr>`}</tbody>
          </table>
        </div>`}
      </div>
      <div class="dash-right">
        <div class="card card-pad">
          <div class="section-title"><h2>${Icons.get("user", 17)} งานตามเจ้าของงาน</h2></div>
          <div class="owner-grid">${ownerDonuts}</div>
        </div>
        <div class="card card-pad">
          <div class="section-title"><h2>${Icons.get("briefcase", 17)} งานตามลูกค้า</h2>
            <span class="small muted">${cList.length} ลูกค้า</span></div>
          ${clientBars}
        </div>
        <div class="card card-pad">
          <div class="section-title"><h2>${Icons.get("target", 17)} ข้อมูลบริษัท</h2></div>
          <p class="small muted" style="line-height:1.9">
            <b style="color:var(--text)">บริษัท ${C.name} จำกัด</b><br>
            ${C.nameEn}<br>${C.address}<br>Tel. ${C.tel} · Fax. ${C.fax}
          </p>
        </div>
      </div>
    </div>
    <div class="card mt-4">
      <div class="section-title" style="padding:18px 20px 0">
        <h2>${Icons.get("user", 17)} รายชื่อพนักงาน/ช่าง (${filteredStaff.length}${searchQuery ? ` / ${employeeStaff().length}` : ""} อัตรา)</h2>
      </div>
      ${dataView === "cards" ? `<div class="dash-data-list">${staffCards}</div>` : `<div class="table-wrap tbl-responsive">
        <table class="tbl">
          <thead><tr><th>ลำดับ</th><th>รหัสพนักงาน</th><th>ชื่อพนักงาน</th><th>ตำแหน่ง</th></tr></thead>
          <tbody>${staffRows || `<tr><td colspan="4"><div class="center-empty">ไม่พบพนักงานที่ตรงกับคำค้นหา</div></td></tr>`}</tbody>
        </table>
      </div>`}
    </div>`;
  }

  function render() {
    const day = dayRecs();
    const checkedIds = new Set(day.map(r => String(r.empId)));
    const uncheckedN = activeStaff().filter(s => !checkedIds.has(String(s.empId))).length;

    const stat = (icon, cls, num, label) => `
      <div class="card card-hover stat-card">
        <div class="stat-ico ${cls}">${Icons.get(icon, 24)}</div>
        <div class="min-w-0"><div class="stat-num">${num}</div><div class="stat-label">${label}</div></div>
      </div>`;

    root.innerHTML = `
    <div class="page-head">
      <div>
        <h1>Dashboard</h1>
        <p class="sub">บริษัท ${DATA.company.name} จำกัด · ${DATA.company.nameEn} · อัปเดต ${DATA.company.updated}</p>
      </div>
      <div class="head-actions">
        <button class="btn btn-outline" id="btn-export">${Icons.get("download", 16)} Export</button>
        <button class="btn btn-primary" id="btn-new">${Icons.get("plus", 16)} เพิ่มงานใหม่</button>
      </div>
    </div>

    <div class="dx-datebar card card-pad">
      <input class="input" type="date" id="dx-date" value="${fDate}">
      <button class="btn btn-soft btn-sm" id="dx-today">${Icons.get("calendar", 14)} วันนี้</button>
      <div class="search-wrap dx-dashboard-search">
        ${Icons.get("search", 15)}
        <input class="input" id="dx-search" value="${U.esc(searchQuery)}"
               placeholder="ค้นหาชื่อ/รหัสคน หรือรหัสงาน/ชื่องาน">
      </div>
      <span class="small muted dx-datebar-info">ข้อมูลวันที่ ${U.fmtDate(fDate)}</span>
    </div>

    <div class="dash-grid mt-3">
      ${stat("check-circle", "green", checkedIds.size,     "คนเช็คอินแล้ว")}
      ${stat("alert",        "red",   uncheckedN,          "ยังไม่เช็คอิน")}
      ${stat("target",       "amber", day.length,          "รายการเช็คอิน")}
      ${stat("user",         "gray",  activeStaff().length, "พนักงานทั้งหมด")}
    </div>

    ${homeHTML()}
    ${adminHTML()}`;

    U.$("#dx-date").onchange = e => { fDate = e.target.value || U.todayISO(); render(); };
    U.$("#dx-today").onclick = () => { fDate = U.todayISO(); render(); };
    U.$$ ("[data-dash-view]").forEach(button => button.onclick = () => {
      dataView = button.dataset.dashView;
      dataViewSelected = true;
      render();
    });
    U.$("#dx-search").oninput = e => {
      searchQuery = e.target.value;
      const globalSearch = U.$("#global-search");
      if (globalSearch) globalSearch.value = searchQuery;
      const cursor = searchQuery.length;
      render();
      const nextSearch = U.$("#dx-search");
      nextSearch.focus();
      nextSearch.setSelectionRange(cursor, cursor);
    };
    U.$("#btn-export").onclick = () => WorkbookExport.open("dashboard");
    U.$("#btn-new").onclick = () => ProjectForm.open(() => {
      render();
      Toast.show("เพิ่มงานใหม่เรียบร้อย", "success");
    });
  }

  document.addEventListener("app:search", e => {
    searchQuery = String(e.detail || "");
    const localSearch = U.$("#dx-search");
    if (localSearch) localSearch.value = searchQuery;
    render();
  });

  try { render(); } catch (err) {
    console.error(err);
    root.innerHTML = `
      <div class="card card-pad center-empty" style="border:1.5px solid var(--red-200)">
        <div style="font-size:40px">⚠️</div>
        <h2 style="color:var(--red-600);margin-top:8px">หน้า Dashboard โหลดไม่สำเร็จ</h2>
        <p class="small muted mt-2">${U.esc(err.message)}</p>
      </div>`;
  }

  API.onCloud(render);
  window.addEventListener("resize", U.debounce(() => {
    if (dataViewSelected) return;
    const nextView = window.innerWidth <= 768 ? "cards" : "table";
    if (nextView !== dataView) { dataView = nextView; render(); }
  }, 150));

  let lastW = window.innerWidth;
  window.addEventListener("resize", U.debounce(() => {
    if (Math.abs(window.innerWidth - lastW) < 60) return;
    lastW = window.innerWidth;
    try { render(); } catch {}
  }, 400));
})();