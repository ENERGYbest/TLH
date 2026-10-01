/* ═══ charts — SVG donut + grouped bars ═══ */
const Charts = (() => {

  function donut({ pct = 0, color = "var(--red-600)", track = "var(--red-100)",
                   size = 116, stroke = 10, centerTop = "", centerSub = "" } = {}) {
    const sw = +(stroke / size * 42).toFixed(2);
    const v = U.clamp(pct, 0, 100);
    return `
    <div class="donut-wrap" style="width:${size}px;height:${size}px">
      <svg viewBox="0 0 42 42" width="${size}" height="${size}">
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke-width="${sw}" style="stroke:${track}"/>
        <circle class="donut-value" cx="21" cy="21" r="15.9155" fill="none" stroke-width="${sw}"
          stroke-linecap="round" stroke-dasharray="${v} ${100 - v}" stroke-dashoffset="25"
          transform="rotate(-90 21 21)" style="stroke:${color}"/>
      </svg>
      <div class="donut-center">
        <span class="v">${centerTop}</span>
        ${centerSub ? `<span class="l">${centerSub}</span>` : ""}
      </div>
    </div>`;
  }

  function groupedBars(data, { max = 100, w = 430, h = 168 } = {}) {
    const padL = 30, padT = 8, padB = 22;
    const iw = w - padL - 8, ih = h - padT - padB;
    const slot = iw / data.length;
    const bw = Math.min(16, slot / 3.2);

    let grid = "", bars = "", labels = "";
    for (let i = 0; i <= 4; i++) {
      const y = padT + ih - ih * i / 4;
      grid += `<line x1="${padL}" y1="${y}" x2="${w - 6}" y2="${y}"
                 stroke-dasharray="${i ? "3 4" : "0"}" style="stroke:var(--border)"/>
               <text x="${padL - 6}" y="${y + 3}" text-anchor="end" font-size="9"
                 style="fill:var(--text-3)">${Math.round(max * i / 4)}</text>`;
    }
    data.forEach((d, i) => {
      const cx = padL + slot * i + slot / 2;
      const ha = U.clamp(d.a / max, 0, 1) * ih;
      const hb = U.clamp(d.b / max, 0, 1) * ih;
      bars += `<rect x="${(cx - bw - 2).toFixed(1)}" y="${(padT + ih - ha).toFixed(1)}"
                 width="${bw.toFixed(1)}" height="${ha.toFixed(1)}" rx="3" style="fill:var(--red-600)"/>
               <rect x="${(cx + 2).toFixed(1)}" y="${(padT + ih - hb).toFixed(1)}"
                 width="${bw.toFixed(1)}" height="${hb.toFixed(1)}" rx="3" style="fill:var(--red-200)"/>`;
      labels += `<text x="${cx.toFixed(1)}" y="${h - 7}" text-anchor="middle" font-size="10"
                 style="fill:var(--text-2)">${d.m}</text>`;
    });
    return `<svg class="bars-svg" viewBox="0 0 ${w} ${h}">${grid}${bars}${labels}</svg>`;
  }

  return { donut, groupedBars };
})();
window.Charts = Charts;