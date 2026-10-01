/* ═══ utils — บันทึก = ซิงก์ Supabase อัตโนมัติ + error banner ═══ */
const U = {
  $:  (sel, ctx = document) => ctx.querySelector(sel),
  $$: (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel)),
  clamp: (v, a, b) => Math.min(b, Math.max(a, v)),

  esc(s) {
    return String(s).replace(/[&<>"']/g, m =>
      ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m]));
  },

  baht(n, short = false) {
    if (short && Math.abs(n) >= 1e6) return "฿" + (n / 1e6).toFixed(1) + "M";
    return "฿" + Number(n).toLocaleString("en-US");
  },

  pct: (part, total) => (total ? (part / total * 100) : 0),

  initials(name = "?") {
    return String(name).trim().replace(/^(นาย|นาง|น\.ส\.|ด\.ญ\.)\s*/,"")
      .split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  },

  todayISO: () => new Date().toLocaleDateString("sv-SE"),
  nowHM:    () => new Date().toTimeString().slice(0, 5),

  fmtDate(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("th-TH",
      { day: "numeric", month: "short", year: "numeric" });
  },
  async watermarkPhoto(dataUrl, { event, date, time, location }) {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("เตรียมรูปสำหรับบันทึกไม่สำเร็จ"));
      image.src = dataUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("เตรียมรูปสำหรับบันทึกไม่สำเร็จ");
    context.drawImage(image, 0, 0);

    const width = canvas.width;
    const height = canvas.height;
    const padding = Math.max(10, Math.round(width * 0.035));
    const fontSize = Math.max(12, Math.round(width * 0.04));
    const maxTextWidth = width - padding * 2;
    const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("th-TH", {
      day: "numeric", month: "short", year: "numeric"
    });
    const eventLabel = `${event} · ${dateLabel} ${time} น.`;
    const locationLabel = `สถานที่: ${location}`;
    const wrapText = text => {
      const words = String(text).split(/\s+/);
      const lines = [];
      let line = "";
      words.forEach(word => {
        const candidate = line ? `${line} ${word}` : word;
        if (line && context.measureText(candidate).width > maxTextWidth) {
          lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      });
      if (line) lines.push(line);
      return lines;
    };

    context.font = `600 ${fontSize}px Kanit, sans-serif`;
    const locationLines = wrapText(locationLabel);
    const lineHeight = Math.ceil(fontSize * 1.35);
    const bandHeight = padding * 2 + lineHeight * (locationLines.length + 1);
    const bandTop = Math.max(0, height - bandHeight);
    context.fillStyle = "rgba(0, 0, 0, 0.68)";
    context.fillRect(0, bandTop, width, height - bandTop);
    context.fillStyle = "#fff";
    context.textBaseline = "top";
    context.font = `700 ${fontSize}px Kanit, sans-serif`;
    context.fillText(eventLabel, padding, bandTop + padding, maxTextWidth);
    context.font = `500 ${fontSize}px Kanit, sans-serif`;
    locationLines.forEach((line, index) =>
      context.fillText(line, padding, bandTop + padding + lineHeight * (index + 1), maxTextWidth));

    return canvas.toDataURL("image/jpeg", 0.72);
  },
  fmtDateFull() {
    return new Date().toLocaleDateString("th-TH",
      { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  },

  dayDiff(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); },
  addDays(iso, n) {
    const d = new Date(iso);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  },

  hoursBetween(t1, t2) {
    if (!t1 || !t2) return null;
    const [h1, m1] = t1.split(":").map(Number), [h2, m2] = t2.split(":").map(Number);
    return Math.max(0, (h2 * 60 + m2 - h1 * 60 - m1) / 60);
  },

  debounce(fn, ms = 250) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  },

  store(key, val) {
    if (val === undefined) {
      try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    }
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
    if (typeof API !== "undefined" && API.enabled()) API.save(key, val);
  },

  avatar(id, size = "") {
    const PAL = ["#D01B22","#2E6FD8","#1FA97C","#E89B18","#7C4DD8","#0FA3B1","#C2410C","#4E5563"];
    let name = "??", color = "#9AA1B0";
    const m = (DATA.members || []).find(u => u.id === id);
    if (m) { name = m.name; color = m.color; }
    else {
      const s = (DATA.staff || []).find(x => String(x.empId) === String(id));
      if (s) {
        name = s.name;
        color = PAL[Number(s.empId) % PAL.length];
        if (s.photo)
          return `<img class="avatar ${size}" src="${U.esc(s.photo)}" alt="${U.esc(name)}" title="${U.esc(name)}" style="background:${color};object-fit:cover" loading="lazy">`;
      }
    }
    return `<span class="avatar ${size}" style="background:${color}" title="${U.esc(name)}">${U.esc(U.initials(name))}</span>`;
  },
  avatars(ids, max = 3) {
    const list = (ids || []).slice(0, max).map(id => U.avatar(id)).join("");
    const rest = (ids || []).length - max;
    return `<span class="avatar-group">${list}${rest > 0 ? `<span class="avatar avatar-more">+${rest}</span>` : ""}</span>`;
  }
};

/* Error banner — จับทั้ง sync และ async */
function tlhBanner(msg) {
  if (!document.body) return;
  let box = document.getElementById("tlh-err");
  if (!box) {
    box = document.createElement("div");
    box.id = "tlh-err";
    box.style.cssText =
      "position:fixed;left:12px;bottom:12px;z-index:99999;max-width:92vw;" +
      "background:#7E0F14;color:#fff;padding:12px 16px;border-radius:10px;" +
      "font-size:12.5px;line-height:1.55;box-shadow:0 8px 24px rgba(0,0,0,.35);" +
      "cursor:pointer;font-family:Kanit,sans-serif";
    box.title = "คลิกเพื่อปิด";
    box.onclick = () => box.remove();
    document.body.appendChild(box);
  }
  box.innerHTML = "<b>⚠️ พบข้อผิดพลาด:</b><br>" + U.esc(msg) +
    "<br><small style='opacity:.75'>รายละเอียด: F12 → Console · คลิกที่นี่เพื่อปิด</small>";
}
window.addEventListener("error", e => tlhBanner(e.message || String(e)));
window.addEventListener("unhandledrejection", e => {
  const r = e.reason;
  tlhBanner((r && r.message) ? r.message : String(r || "Unknown async error"));
});