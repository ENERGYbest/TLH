/* ═══ data.js — role: admin(ผู้จัดการโครงการ)/tlh(หัวหน้า—ตั้งที่หน้าจัดการUser)/user ═══ */
const DATA = {

  company: {
    name:    "ที.แอล.เอช. เอ็นจิเนียริ่ง",
    nameEn:  "T.L.H. Engineering Co.,Ltd.",
    sub:     "Project Management",
    address: "",
    tel:     "",
    fax:     "",
    updated: "",
    logo:    "https://www.tlh.co.th/assets/images/logo-tlh-122x121.jpg"
  },

  members: [],

  stageMap: {
    "active": { label: "งาน Active",         cls: "b-red"   },
    "defect": { label: "เก็บ 1 Year Defect", cls: "b-amber" },
    "closed": { label: "ปิด Job",            cls: "b-gray"  },
    "cancel": { label: "ยกเลิก",             cls: "b-gray"  }
  },
  healthMap: {
    "on-track": { label: "ปกติ",   cls: "b-green" },
    "delayed":  { label: "ล่าช้า", cls: "b-amber" }
  },

  projects: [],
  staff: [],
  clients: [],

  settings: {
    workStart: "",
    workEnd:   "",
    theme:     "red",
    locations: []
  }
};

const THEMES = {
  red:   { 400:"#EE5F66", 500:"#E5262D", 600:"#D01B22", 700:"#A8141A" },
  navy:  { 400:"#3D5A98", 500:"#2E4A80", 600:"#1F3A6E", 700:"#16294F" },
  green: { 400:"#2BAF8E", 500:"#1FA97C", 600:"#178A66", 700:"#0F5C44" },
  violet:{ 400:"#9267D8", 500:"#7C4DD8", 600:"#683BC4", 700:"#4E2A94" }
};

/* โหลด cache ล่าสุดจากเครื่องก่อน sync กับ cloud */
(function () {
  try {
    const st = JSON.parse(localStorage.getItem("tlh_staff"));
    if (Array.isArray(st) && st.length) DATA.staff = st;
  } catch (_) {}
  try {
    const m = JSON.parse(localStorage.getItem("tlh_members"));
    if (Array.isArray(m) && m.length) DATA.members = m;
  } catch (_) {}
  try {
    const pr = JSON.parse(localStorage.getItem("tlh_projects"));
    if (Array.isArray(pr) && pr.length) DATA.projects = pr;
  } catch (_) {}
  try {
    const c = JSON.parse(localStorage.getItem("tlh_clients"));
    if (Array.isArray(c)) DATA.clients = c;
  } catch (_) {}
  DATA.projects.forEach(p => { if (!p.health) p.health = "on-track"; });
  try {
    const se = JSON.parse(localStorage.getItem("tlh_settings"));
    if (se) Object.assign(DATA.settings, se);
  } catch (_) {}
  try {
    const co = JSON.parse(localStorage.getItem("tlh_company"));
    if (co && co.name) Object.assign(DATA.company, co);
  } catch (_) {}
  const th = THEMES[DATA.settings.theme] || THEMES.red;
  Object.entries(th).forEach(([k, v]) =>
    document.documentElement.style.setProperty("--red-" + k, v));
})();