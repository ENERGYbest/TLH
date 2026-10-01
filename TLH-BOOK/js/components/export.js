/* Shared Excel export dialog and workbook builder. */
const WorkbookExport = (() => {
  let xlsxPromise = null;

  const presets = {
    dashboard: {
      title: "ส่งออก Dashboard",
      file: "tlh_dashboard.xlsx",
      checked: ["attendance", "employeeSummary", "siteSummary", "sites", "employees", "projects", "accounts"]
    },
    projects: {
      title: "ส่งออก Projects",
      file: "tlh_projects.xlsx",
      checked: ["sites", "attendance"]
    },
    attendance: {
      title: "ส่งออกรายงานการเข้างาน",
      file: "tlh_attendance.xlsx",
      checked: ["attendance", "employeeSummary", "siteSummary"]
    },
    users: {
      title: "ส่งออกจัดการ User",
      file: "tlh_users.xlsx",
      checked: ["accounts"]
    }
  };

  function loadXlsx() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (xlsxPromise) return xlsxPromise;
    xlsxPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
      script.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error("โหลดตัวสร้าง Excel ไม่สำเร็จ"));
      script.onerror = () => reject(new Error("เชื่อมต่อระบบส่งออก Excel ไม่สำเร็จ"));
      document.head.appendChild(script);
    });
    return xlsxPromise;
  }

  function toThaiDate(isoDate) {
    const [year, month, day] = isoDate.split("-").map(Number);
    return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year + 543}`;
  }

  function fromThaiDate(value) {
    const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(String(value || "").trim());
    if (!match) return null;
    const day = Number(match[1]), month = Number(match[2]);
    let year = Number(match[3]);
    if (year >= 2400) year -= 543;
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day)
      return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const regularStaff = () => (DATA.staff || []).filter(s => s.role !== "admin" && s.role !== "tlh");
  const attendanceRecords = () => (U.store("tlh_attendance") || [])
    .filter(r => regularStaff().some(s => String(s.empId) === String(r.empId)));
  const memberName = id => (DATA.members || []).find(m => String(m.id) === String(id))?.name || "—";

  function scopedRecords(range) {
    return attendanceRecords().filter(r => range.all ||
      [r.date, r.dateOut].some(date => String(date || "") >= range.from && String(date || "") <= range.to));
  }

  function makeSheets(range) {
    const staff = regularStaff();
    const projects = DATA.projects || [];
    const records = scopedRecords(range);
    const staffById = new Map(staff.map(s => [String(s.empId), s]));

    const checkins = records.map(r => {
      const employee = staffById.get(String(r.empId));
      const project = projects.find(p => String(r.location || "").includes(String(p.id)) ||
        String(r.location || "").includes(String(p.name)));
      return {
        "วันที่": r.date || "",
        "เวลาเช็คอิน": r.timeIn || "",
        "วันที่เช็คเอาท์": r.dateOut || (r.timeOut ? r.date : "—"),
        "เวลาเช็คเอาท์": r.timeOut || "—",
        "สถานะเช็คเอาท์": r.timeOut ? "เช็คเอาท์แล้ว" : "ยังไม่เช็คเอาท์",
        "รหัสพนักงาน": String(r.empId),
        "พนักงาน": r.name || employee?.name || "—",
        "ตำแหน่ง": employee?.position || "—",
        "ไซต์งาน": r.location || "—",
        "รูปเช็คอิน": r.photo || "",
        "รูปเช็คเอาท์": r.photoOut || "",
        "เลขที่ JOB": project?.id || "—",
        "ชื่องาน": project?.name || "—",
        "ลูกค้า": project?.client || "—"
      };
    });

    const employeeGroups = new Map();
    records.forEach(r => {
      const id = String(r.empId);
      if (!employeeGroups.has(id)) employeeGroups.set(id, []);
      employeeGroups.get(id).push(r);
    });
    const employeeSummary = staff.map(s => {
      const items = employeeGroups.get(String(s.empId)) || [];
      return {
        "รหัสพนักงาน": String(s.empId),
        "พนักงาน": s.name,
        "ตำแหน่ง": s.position || "—",
        "จำนวนครั้ง": items.length,
        "จำนวนครั้งเช็คเอาท์": items.filter(r => r.timeOut).length,
        "จำนวนไซต์": new Set(items.map(r => r.location)).size,
        "ไซต์ที่ไป": [...new Set(items.map(r => r.location).filter(Boolean))].join(" / ") || "—"
      };
    });

    const siteGroups = new Map();
    records.forEach(r => {
      const location = r.location || "ไม่ระบุไซต์";
      if (!siteGroups.has(location)) siteGroups.set(location, []);
      siteGroups.get(location).push(r);
    });
    const siteSummary = [...siteGroups.entries()].map(([location, items]) => ({
      "ไซต์งาน": location,
      "จำนวนครั้งเช็คอิน": items.length,
      "จำนวนครั้งเช็คเอาท์": items.filter(r => r.timeOut).length,
      "จำนวนพนักงาน": new Set(items.map(r => String(r.empId))).size,
      "พนักงาน": [...new Set(items.map(r => r.name || staffById.get(String(r.empId))?.name || String(r.empId)))].join(" / ")
    }));

    const siteMap = new Map();
    const addSite = (location, project) => {
      const key = String(location || "").trim();
      if (!key || siteMap.has(key)) return;
      siteMap.set(key, {
        "ไซต์งาน": key,
        "เลขที่ JOB": project?.id || "—",
        "ชื่องาน": project?.name || "—",
        "ลูกค้า": project?.client || "—"
      });
    };
    projects.forEach(p => addSite(`${p.id} · ${p.name}`, p));
    (DATA.settings.locations || []).forEach(location => {
      const project = projects.find(p => String(location).includes(String(p.id)) ||
        String(location).includes(String(p.name)));
      addSite(location, project);
    });
    attendanceRecords().forEach(r => {
      const project = projects.find(p => String(r.location || "").includes(String(p.id)) ||
        String(r.location || "").includes(String(p.name)));
      addSite(r.location, project);
    });

    return [
      { key: "attendance", name: "การเช็คอิน", description: "รายการเช็คอินตามช่วงวันที่", rows: checkins },
      { key: "employeeSummary", name: "สรุปตามพนักงาน", description: "จำนวนเช็คอินและไซต์ที่พนักงานไป", rows: employeeSummary },
      { key: "siteSummary", name: "สรุปตามไซต์", description: "ไซต์ที่มีใครไปบ้าง", rows: siteSummary },
      { key: "sites", name: "รายชื่อไซต์งาน", description: "ไซต์และงานที่ตั้งค่าไว้", rows: [...siteMap.values()] },
      { key: "employees", name: "รายชื่อพนักงาน", description: "พนักงานที่ไม่ใช่ Admin/TLH", rows: staff.map(s => ({
        "รหัสพนักงาน": String(s.empId), "ชื่อ": s.name, "ตำแหน่ง": s.position || "—", "สถานะ": s.active === false ? "ปิดใช้งาน" : "ใช้งาน"
      })) },
      { key: "projects", name: "Projects", description: "รายละเอียดโปรเจกต์และผู้รับผิดชอบ", rows: projects.map(p => ({
        "เลขที่ JOB": p.id, "ชื่องาน": p.name, "ลูกค้า": p.client || "—",
        "สถานะ": DATA.stageMap[p.stage]?.label || p.stage || "—",
        "สถานะงาน": DATA.healthMap[p.health]?.label || p.health || "—",
        "เจ้าของงาน": memberName(p.owner), "ประสานงาน": memberName(p.coordinator)
      })) },
      { key: "accounts", name: "บัญชีผู้ใช้", description: "บัญชีและสิทธิ์ โดยไม่รวม PIN/รูป", rows: (DATA.staff || []).map(s => ({
        "รหัส": String(s.empId), "ชื่อ": s.name, "ตำแหน่ง": s.position || "—",
        "สิทธิ์": s.role || "user", "สถานะ": s.active === false ? "ปิดใช้งาน" : "ใช้งาน"
      })) }
    ];
  }

  function open(presetName) {
    const preset = presets[presetName] || presets.dashboard;
    const sheets = makeSheets({ all: true, from: "", to: "" });
    const firstDay = toThaiDate(U.todayISO().slice(0, 8) + "01");
    const today = toThaiDate(U.todayISO());
    Modal.open({
      title: preset.title,
      body: `
        <div class="export-options">
          <fieldset class="export-period">
            <legend>ช่วงวันที่</legend>
            <label><input type="radio" name="export-period" value="all" checked> ทั้งหมด</label>
            <label><input type="radio" name="export-period" value="range"> เลือกช่วงวันที่</label>
          </fieldset>
          <div class="export-range hidden" id="export-range">
            <div class="field"><label for="export-from">ตั้งแต่วันที่ (วัน/เดือน/ปี พ.ศ.)</label><input class="input" type="text" id="export-from" inputmode="numeric" maxlength="10" placeholder="01/09/2569" value="${firstDay}"></div>
            <div class="field"><label for="export-to">ถึงวันที่ (วัน/เดือน/ปี พ.ศ.)</label><input class="input" type="text" id="export-to" inputmode="numeric" maxlength="10" placeholder="30/09/2569" value="${today}"></div>
          </div>
          <fieldset class="export-sheet-options">
            <legend>ชีตที่จะส่งออก</legend>
            ${sheets.map(sheet => `
              <label class="export-sheet-option">
                <input type="checkbox" data-export-sheet="${sheet.key}" ${preset.checked.includes(sheet.key) ? "checked" : ""}>
                <span><b>${sheet.name}</b><small>${sheet.description}</small></span>
              </label>`).join("")}
          </fieldset>
        </div>`,
      foot: `
        <button class="btn btn-outline" data-close>ยกเลิก</button>
        <button class="btn btn-primary" id="export-confirm">ส่งออก Excel</button>`
    });

    U.$$("input[name='export-period']").forEach(input => input.onchange = () => {
      U.$("#export-range").classList.toggle("hidden", input.value !== "range" || !input.checked);
    });
    U.$("#export-confirm").onclick = () => download(preset, sheets);
  }

  async function download(preset, sheets) {
    const button = U.$("#export-confirm");
    const checked = new Set(U.$$("[data-export-sheet]:checked").map(input => input.dataset.exportSheet));
    if (!checked.size) { Toast.show("เลือกอย่างน้อยหนึ่งชีตก่อนส่งออก", "error"); return; }

    const period = U.$("input[name='export-period']:checked")?.value || "all";
    const fromInput = U.$("#export-from").value;
    const toInput = U.$("#export-to").value;
    const from = period === "range" ? fromThaiDate(fromInput) : "";
    const to = period === "range" ? fromThaiDate(toInput) : "";
    if (period === "range" && (!from || !to || from > to)) {
      Toast.show("กรอกวันที่เป็น วัน/เดือน/ปี พ.ศ. เช่น 01/09/2569 และตรวจสอบช่วงวันที่", "error"); return;
    }

    button.disabled = true;
    button.textContent = "กำลังสร้างไฟล์…";
    try {
      const XLSX = await loadXlsx();
      const workbook = XLSX.utils.book_new();
      const selected = sheets.filter(sheet => checked.has(sheet.key));
      const range = { all: period === "all", from, to };
      const usedNames = new Set();
      selected.forEach(sheet => {
        let name = sheet.name.replace(/[\\/?*\[\]:]/g, " ").slice(0, 31) || "Sheet";
        let uniqueName = name, suffix = 2;
        while (usedNames.has(uniqueName)) {
          const ending = ` ${suffix++}`;
          uniqueName = name.slice(0, 31 - ending.length) + ending;
        }
        usedNames.add(uniqueName);
        let rows = sheet.rows;
        if (sheet.key === "attendance")
          rows = sheet.rows.filter(row => range.all ||
            (String(row["วันที่"] || "") >= from && String(row["วันที่"] || "") <= to));
        if (sheet.key === "employeeSummary" || sheet.key === "siteSummary")
          rows = buildSummaryRows(sheet.key, range);
        rows = (rows || []).filter(Boolean);
        const worksheet = rows.length ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([["ไม่มีข้อมูลในช่วงที่เลือก"]]);
        if (rows.length) {
          const headers = Object.keys(rows[0]);
          worksheet["!cols"] = headers.map(header => ({
            wch: Math.min(48, Math.max(12, header.length + 2, ...rows.slice(0, 80).map(row => String(row[header] ?? "").length + 2)))
          }));
        }
        XLSX.utils.book_append_sheet(workbook, worksheet, uniqueName);
      });
      const content = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([content], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = preset.file;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      Modal.close();
      Toast.show("ส่งออกไฟล์ Excel แล้ว", "success");
    } catch (error) {
      console.error("[TLH Export]", error);
      button.disabled = false;
      button.textContent = "ส่งออก Excel";
      Toast.show(error.message || "สร้างไฟล์ไม่สำเร็จ", "error");
    }
  }

  function buildSummaryRows(key, range) {
    const records = scopedRecords(range);
    const staff = regularStaff();
    if (key === "employeeSummary") return staff.map(person => {
      const rows = records.filter(r => String(r.empId) === String(person.empId));
      return {
        "รหัสพนักงาน": String(person.empId), "พนักงาน": person.name,
        "ตำแหน่ง": person.position || "—", "จำนวนครั้ง": rows.length,
        "จำนวนไซต์": new Set(rows.map(r => r.location)).size,
        "ไซต์ที่ไป": [...new Set(rows.map(r => r.location).filter(Boolean))].join(" / ") || "—"
      };
    });
    const sites = new Map();
    records.forEach(r => {
      const location = r.location || "ไม่ระบุไซต์";
      if (!sites.has(location)) sites.set(location, []);
      sites.get(location).push(r);
    });
    return [...sites].map(([location, rows]) => ({
      "ไซต์งาน": location,
      "จำนวนครั้งเช็คอิน": rows.length,
      "จำนวนพนักงาน": new Set(rows.map(r => String(r.empId))).size,
      "พนักงาน": [...new Set(rows.map(r => r.name || String(r.empId)))].join(" / ")
    }));
  }

  return { open };
})();
window.WorkbookExport = WorkbookExport;