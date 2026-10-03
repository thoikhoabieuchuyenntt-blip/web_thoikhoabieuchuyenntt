/* Vẽ bảng thời khóa biểu (máy tính) và danh sách theo ngày (điện thoại). */
(function (root) {
  "use strict";
  var DAY_NAMES = { 2: "Thứ 2", 3: "Thứ 3", 4: "Thứ 4", 5: "Thứ 5", 6: "Thứ 6", 7: "Thứ 7", 8: "Chủ nhật" };
  var SES_NAMES = { S: "Sáng", C: "Chiều" };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function kind(subject) {
    var n = subject.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (/chao co|^shl|sinh hoat/.test(n)) return "event";
    if (/chuyen/.test(n)) return "major";
    return "";
  }

  // Khung tiết dùng chung cho cả phiên bản: số tiết sáng/chiều, có Chủ nhật không
  function frame(allSlots) {
    var f = { S: 0, C: 0, days: [2, 3, 4, 5, 6] };
    allSlots.forEach(function (s) {
      if (s[3] > f[s[2]]) f[s[2]] = s[3];
      if (f.days.indexOf(s[1]) < 0) f.days.push(s[1]);
    });
    f.days.sort(function (a, b) { return a - b; });
    return f;
  }

  function subjectName(x) {
    var map = (root.TKB_CONFIG && root.TKB_CONFIG.subjectNames) || {};
    return map[x] || x;
  }
  // Gộp các mục trong cùng 1 ô: cùng môn -> gộp giáo viên (theo lớp) hoặc gộp lớp (theo giáo viên)
  function cellHTML(list, mode) {
    var groups = [], by = {};
    list.forEach(function (s) {
      var k = s[4] + "|" + s[6] + "|" + s[7];
      if (!by[k]) { by[k] = { s: s, who: [] }; groups.push(by[k]); }
      var w = mode === "teacher" ? s[0] : s[5];
      if (w && by[k].who.indexOf(w) < 0) by[k].who.push(w);
    });
    var multi = mode !== "teacher" && groups.length > 1;
    return groups.map(function (g) {
      var s = g.s, k = kind(s[4]) || (multi ? "group" : "normal");
      var main = mode === "teacher" ? g.who.join(", ") : subjectName(s[4]);
      var sub = mode === "teacher" ? subjectName(s[4]) : g.who.join(", ");
      var extra = [s[6], s[7] ? "Nhóm " + s[7].replace(/^nh[oó]m\s*/i, "") : ""].filter(Boolean).join(", ");
      return '<div class="entry entry--' + k + '">' +
        '<span class="entry__main">' + esc(main) + "</span>" +
        (sub ? '<span class="entry__sub">' + esc(sub) + "</span>" : "") +
        (extra ? '<span class="entry__room">' + esc(extra) + "</span>" : "") + "</div>";
    }).join("");
  }

  function index(slots) {
    var map = {};
    slots.forEach(function (s) {
      var k = s[1] + s[2] + s[3];
      (map[k] = map[k] || []).push(s);
    });
    return map;
  }

  function render(allSlots, slots, mode, today) {
    var f = frame(allSlots), map = index(slots);
    var used = {}; slots.forEach(function (s) { used[s[2]] = 1; });
    var sessions = ["S", "C"].filter(function (x) { return f[x] > 0 && (used[x] || !slots.length); });

    // Bảng cho màn hình rộng
    var h = '<div class="grid-wrap"><table class="grid"><thead><tr><th class="grid__corner" scope="col"><span class="sr">Buổi, tiết</span></th>';
    f.days.forEach(function (d) {
      h += '<th scope="col"' + (d === today ? ' class="is-today"' : "") + ">" + DAY_NAMES[d] +
        (d === today ? '<small>Hôm nay</small>' : "") + "</th>";
    });
    h += "</tr></thead>";
    sessions.forEach(function (ses) {
      h += '<tbody class="ses ses--' + ses + '">';
      for (var p = 1; p <= f[ses]; p++) {
        h += "<tr>" + '<th scope="row" class="grid__period">' +
          (p === 1 ? '<span class="grid__ses">' + SES_NAMES[ses] + "</span>" : "") +
          '<span class="grid__num">Tiết ' + p + "</span></th>";
        f.days.forEach(function (d) {
          var list = map[d + ses + p] || [];
          h += '<td class="' + (d === today ? "is-today " : "") + (list.length ? "" : "is-empty") + '">' +
            cellHTML(list, mode) + "</td>";
        });
        h += "</tr>";
      }
      h += "</tbody>";
    });
    h += "</table></div>";

    // Danh sách theo ngày cho điện thoại
    h += '<div class="days">';
    f.days.forEach(function (d) {
      var body = "";
      sessions.forEach(function (ses) {
        var last = 0;
        for (var p = 1; p <= f[ses]; p++) if (map[d + ses + p]) last = p;
        if (!last) return;
        body += '<h4 class="day__ses">' + SES_NAMES[ses] + "</h4><ol class=\"day__list\">";
        for (p = 1; p <= last; p++) {
          var list = map[d + ses + p];
          body += '<li><span class="day__num">' + p + "</span>" +
            (list ? '<div class="day__cell">' + cellHTML(list, mode) + "</div>" :
              '<span class="day__free">Không có tiết</span>') + "</li>";
        }
        body += "</ol>";
      });
      if (!body) body = '<p class="day__off">Không có tiết học</p>';
      h += '<section class="day' + (d === today ? " is-today" : "") + '"><h3 class="day__name">' +
        DAY_NAMES[d] + (d === today ? " <small>Hôm nay</small>" : "") + "</h3>" + body + "</section>";
    });
    h += "</div>";
    return h;
  }

  // TKB chung: hàng = Thứ/Tiết, cột = lớp (giống file Excel của người xếp TKB)
  function renderAll(allSlots, classes, ses, dayFilter, today, homeroom) {
    var f = frame(allSlots), maxP = f[ses], map = {}, dayHas = {}, inSel = {};
    classes.forEach(function (c) { inSel[c] = 1; });
    allSlots.forEach(function (s) {
      if (s[2] !== ses || !inSel[s[0]]) return;
      var k = s[0] + "|" + s[1] + "|" + s[3];
      (map[k] = map[k] || []).push(s);
      dayHas[s[1]] = 1;
    });
    var days = f.days.filter(function (d) { return dayHas[d] && (!dayFilter || d === dayFilter); });
    if (!maxP || !days.length || !classes.length) return "";
    homeroom = homeroom || {};
    var h = '<div class="grid-wrap grid-wrap--all"><table class="grid grid--all"><thead><tr>' +
      '<th class="c-day" scope="col">Thứ</th><th class="c-per" scope="col">Tiết</th>';
    classes.forEach(function (c) {
      var hr = homeroom[c];
      h += '<th scope="col">' + esc(c) + (hr ? '<small class="hr">' + esc((hr[0] ? hr[0] + " " : "") + hr[1]) + "</small>" : "") + "</th>";
    });
    h += "</tr></thead><tbody>";
    days.forEach(function (d) {
      for (var p = 1; p <= maxP; p++) {
        h += '<tr class="' + (p === 1 ? "day-start" : "") + (d === today ? " is-today" : "") + '">';
        if (p === 1) h += '<th class="c-day" scope="rowgroup" rowspan="' + maxP + '">' + DAY_NAMES[d] +
          (d === today ? "<small>Hôm nay</small>" : "") + "</th>";
        h += '<th class="c-per" scope="row">' + p + "</th>";
        classes.forEach(function (c) {
          var list = map[c + "|" + d + "|" + p];
          h += "<td" + (list ? "" : ' class="is-empty"') + ">" + (list ? cellHTML(list, "class") : "") + "</td>";
        });
        h += "</tr>";
      }
    });
    return h + "</tbody></table></div>";
  }

  root.TKBGrid = { render: render, renderAll: renderAll, esc: esc, DAY_NAMES: DAY_NAMES };
})(window);
