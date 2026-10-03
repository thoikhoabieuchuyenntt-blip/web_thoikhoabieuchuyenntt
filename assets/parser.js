/* Bộ đọc file TKB Excel -> dữ liệu JSON cho web tra cứu.
 * Dùng được trên trình duyệt (window.TKBParser) và Node (module.exports).
 * Hỗ trợ 2 dạng sheet TKB:
 *   - Dạng NGANG: cột Thứ | (Buổi) | Tiết | <tên lớp 1> | <tên lớp 2> ...
 *     ô = "Môn - Giáo viên", có thể thêm [Phòng] và {Nhóm}; nhiều mục trong 1 ô cách nhau bằng ";"
 *   - Dạng DỌC: cột Lớp | Thứ | Buổi | Tiết | Môn | Giáo viên | Phòng | Nhóm
 * Sheet học sinh (tùy chọn): Mã HS | Họ tên | Lớp | Nhóm
 * Sheet giáo viên (tùy chọn): Họ tên | Tổ
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.TKBParser = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function norm(s) {
    return String(s == null ? "" : s)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/Đ/g, "D")
      .toLowerCase().replace(/\s+/g, " ").trim();
  }
  function clean(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }

  var DAY_WORDS = { hai: 2, ba: 3, tu: 4, nam: 5, sau: 6, bay: 7 };
  function parseDay(v) {
    var n = norm(v);
    if (!n) return null;
    if (/(^|\b)(cn|chu nhat)\b/.test(n)) return 8;
    var m = n.match(/([2-7])/);
    if (m) return +m[1];
    var w = n.replace(/^thu\s*/, "").trim();
    return DAY_WORDS[w] || null;
  }
  function parseSession(v) {
    var n = norm(v);
    if (!n) return null;
    if (n.indexOf("chieu") >= 0 || n === "c") return "C";
    if (n.indexOf("sang") >= 0 || n === "s") return "S";
    return null;
  }
  function parsePeriod(v) {
    var m = norm(v).match(/\d+/);
    return m ? +m[0] : null;
  }

  function cleanTeacher(t) { return clean(t).replace(/\.\s+/g, ".").replace(/^[-–]+|[-–]+$/g, "").trim(); }
  function cleanSubject(t) { return clean(t).replace(/^[-–]+|[-–]+$/g, "").trim(); }
  var NOT_SPLIT = { hn: 1, an: 1, cd: 1, nc: 1 };

  // Một dòng trong ô: "Toán - N.Ngọc", "Lý-CNTT-KTPL - Nhung - Đạt - Cine", "Sử - Lan - Linh",
  // "Sinh - CNCN - Cúc - Thủy". Có thể kèm [Phòng] và {Nhóm}.
  function parseLine(text) {
    var t = String(text), room = "", group = "";
    t = t.replace(/\[([^\]]*)\]/, function (_, r) { room = clean(r); return " "; });
    t = t.replace(/\{([^}]*)\}/, function (_, g) { group = clean(g); return " "; });
    var tok = clean(t).split(/\s+[-–—]\s*|\s*[-–—]\s+/).map(clean).filter(function (x) { return x && !/^[-–—]+$/.test(x); });
    if (!tok.length) return [];
    if (tok.length === 1) {
      var m = tok[0].match(/^([^\s.]{1,12})\.\s+(.+)$/);   // lỗi gõ "TA. D.T.H.Yến"
      tok = m ? [m[1], m[2]] : tok;
    }
    var mk = function (sub, tea) { return { subject: cleanSubject(sub), teacher: tea ? cleanTeacher(tea) : "", room: room, group: group }; };
    if (tok.length <= 2) return [mk(tok[0], tok[1])];
    var subj = tok[0], teachers = tok.slice(1);
    var parts = subj.split("-").map(clean).filter(Boolean);
    var splittable = parts.length > 1 && parts.every(function (x) { return !NOT_SPLIT[norm(x)] && !/^\d+$/.test(x); });
    if (splittable && parts.length === teachers.length)
      return parts.map(function (p, i) { return mk(p, teachers[i]); });
    if (parts.length === 1 && tok.length % 2 === 0) {           // "Sinh - CNCN - Cúc - Thủy"
      var h = tok.length / 2;
      return tok.slice(0, h).map(function (p, i) { return mk(p, tok[h + i]); });
    }
    return teachers.map(function (x) { return mk(subj, x); });  // "Sử - Lan - Linh": 1 môn, nhiều GV
  }
  function parseCell(text) {
    var out = [];
    String(text).split(/\n+|[;|]/).forEach(function (line) { out = out.concat(parseLine(line)); });
    return out;
  }
  function parseHomeroom(v) {
    var t = clean(v); if (!t) return null;
    var m = t.match(/^(T|C|Thầy|Cô)\s*[-–:.]\s*(.+)$/i);
    if (!m) return ["", cleanTeacher(t)];
    return [/^t/i.test(m[1]) ? "Thầy" : "Cô", cleanTeacher(m[2])];
  }
  function findDate(rows) {
    for (var i = 0; i < Math.min(rows.length, 8); i++)
      for (var j = 0; j < rows[i].length; j++) {
        var m = norm(rows[i][j]).match(/ap dung tu\D*(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
        if (m) return m[3] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[1]).slice(-2);
      }
    return "";
  }

  function findHeader(rows, test) {
    for (var i = 0; i < Math.min(rows.length, 12); i++) {
      var h = rows[i].map(norm);
      if (test(h)) return i;
    }
    return -1;
  }
  function col(h, names) {
    for (var i = 0; i < h.length; i++)
      for (var j = 0; j < names.length; j++) if (h[i] === names[j]) return i;
    for (i = 0; i < h.length; i++)
      for (j = 0; j < names.length; j++) if (h[i] && h[i].indexOf(names[j]) === 0) return i;
    return -1;
  }
  var has = function (h, n) { return col(h, [n]) >= 0; };

  function naturalCompare(a, b) {
    return String(a).localeCompare(String(b), "vi", { numeric: true, sensitivity: "base" });
  }

  function parseWorkbook(wb, XLSX) {
    var slots = [], students = [], teacherGroups = {}, warnings = [], classOrder = [], homeroom = {}, appliedDate = "";
    var seenClass = {};
    function addClass(c) { if (!seenClass[c]) { seenClass[c] = 1; classOrder.push(c); } }

    function pushSlot(cls, day, ses, per, e, where) {
      if (!ses) { if (per > 5) { ses = "C"; per -= 5; } else ses = "S"; }
      else if (ses === "C" && per > 5) per -= 5;
      addClass(cls);
      slots.push([cls, day, ses, per, e.subject, e.teacher, e.room, e.group]);
    }

    wb.SheetNames.forEach(function (name) {
      var ws = wb.Sheets[name];
      var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false, blankrows: false });
      if (!rows.length) return;
      var sheetSes = parseSession(name);
      if (!appliedDate) appliedDate = findDate(rows);

      // Học sinh
      var hi = findHeader(rows, function (h) {
        return (has(h, "ho ten") || has(h, "ho va ten")) && has(h, "lop") && !has(h, "tiet");
      });
      if (hi >= 0) {
        var h = rows[hi].map(norm);
        var cId = col(h, ["ma hs", "ma hoc sinh", "ma"]), cName = col(h, ["ho va ten", "ho ten"]),
            cCls = col(h, ["lop"]), cGrp = col(h, ["nhom"]);
        rows.slice(hi + 1).forEach(function (r, k) {
          var nm = clean(r[cName]), cl = clean(r[cCls]);
          if (!nm || !cl) return;
          var groups = cGrp >= 0 ? String(r[cGrp]).split(/[,;]/).map(clean).filter(Boolean) : [];
          students.push([cId >= 0 ? clean(r[cId]) : "HS" + (students.length + 1), nm, cl, groups]);
        });
        return;
      }
      // Giáo viên (tổ bộ môn)
      var gi = findHeader(rows, function (h) {
        return (has(h, "ho ten") || has(h, "giao vien")) && (has(h, "to") || has(h, "to bo mon")) && !has(h, "tiet");
      });
      if (gi >= 0) {
        var hg = rows[gi].map(norm);
        var cN = col(hg, ["ho va ten", "ho ten", "giao vien"]), cT = col(hg, ["to bo mon", "to"]);
        rows.slice(gi + 1).forEach(function (r) {
          var nm = clean(r[cN]); if (nm) teacherGroups[nm] = clean(r[cT]);
        });
        return;
      }
      // TKB dạng dọc
      var li = findHeader(rows, function (h) {
        return has(h, "lop") && has(h, "thu") && has(h, "tiet") && has(h, "mon");
      });
      if (li >= 0) {
        var hl = rows[li].map(norm);
        var c = {
          lop: col(hl, ["lop"]), thu: col(hl, ["thu"]), buoi: col(hl, ["buoi"]), tiet: col(hl, ["tiet"]),
          mon: col(hl, ["mon hoc", "mon"]), gv: col(hl, ["giao vien", "gv"]), phong: col(hl, ["phong"]), nhom: col(hl, ["nhom"])
        };
        rows.slice(li + 1).forEach(function (r, k) {
          var cls = clean(r[c.lop]), mon = clean(r[c.mon]);
          if (!cls || !mon) return;
          var day = parseDay(r[c.thu]), per = parsePeriod(r[c.tiet]);
          if (!day || !per) { warnings.push("Sheet \"" + name + "\" dòng " + (li + k + 2) + ": không đọc được Thứ/Tiết."); return; }
          pushSlot(cls, day, (c.buoi >= 0 && parseSession(r[c.buoi])) || sheetSes, per, {
            subject: mon, teacher: c.gv >= 0 ? cleanTeacher(r[c.gv]) : "",
            room: c.phong >= 0 ? clean(r[c.phong]) : "", group: c.nhom >= 0 ? clean(r[c.nhom]) : ""
          });
        });
        return;
      }
      // TKB dạng ngang
      var wi = findHeader(rows, function (h) { return has(h, "thu") && has(h, "tiet"); });
      if (wi >= 0) {
        var hw = rows[wi].map(norm), raw = rows[wi].map(clean);
        var cThu = col(hw, ["thu"]), cBuoi = col(hw, ["buoi"]), cTiet = col(hw, ["tiet"]);
        var classCols = [];
        raw.forEach(function (v, i) {
          if (v && i !== cThu && i !== cBuoi && i !== cTiet && hw[i] !== "stt") classCols.push(i);
        });
        classCols.forEach(function (ci) { addClass(raw[ci]); });   // thứ tự cột như trong file
        var lastDay = null, lastSes = null;
        rows.slice(wi + 1).forEach(function (r, k) {
          if (/^chu nhiem|^gvcn/.test(norm(r[cThu])) || /^chu nhiem|^gvcn/.test(norm(r[cTiet]))) {
            classCols.forEach(function (ci) { var h = parseHomeroom(r[ci]); if (h) homeroom[raw[ci]] = h; });
            return;
          }
          var d = parseDay(r[cThu]); if (d) { lastDay = d; if (cBuoi < 0) lastSes = null; }
          var s = cBuoi >= 0 ? parseSession(r[cBuoi]) : null; if (s) lastSes = s;
          var per = parsePeriod(r[cTiet]);
          if (!per) return;
          if (!lastDay) { warnings.push("Sheet \"" + name + "\" dòng " + (wi + k + 2) + ": thiếu Thứ."); return; }
          classCols.forEach(function (ci) {
            var v = r[ci]; if (!clean(v)) return;
            parseCell(v).forEach(function (e) { pushSlot(raw[ci], lastDay, lastSes || sheetSes, per, e); });
          });
        });
        return;
      }
    });

    // Không cảnh báo trùng tiết/trùng tên: giữ đúng theo file của người xếp TKB
    // (môn tự chọn buổi chiều, ghép lớp, giáo viên trùng tên là đặc thù của trường).
    // Học sinh thuộc lớp không có TKB
    var unknown = {};
    students.forEach(function (st) { if (!seenClass[st[2]]) unknown[st[2]] = 1; });
    Object.keys(unknown).forEach(function (c) { warnings.push("Danh sách học sinh có lớp \"" + c + "\" nhưng TKB không có lớp này."); });

    var teachers = {};
    slots.forEach(function (s) { if (s[5]) teachers[s[5]] = teacherGroups[s[5]] || ""; });

    return {
      classes: classOrder.slice(),   // giữ đúng thứ tự cột lớp trong file Excel
      teachers: teachers,
      slots: slots,
      students: students,
      homeroom: homeroom,
      appliedDate: appliedDate,
      warnings: warnings,
      stats: { classes: classOrder.length, homeroom: Object.keys(homeroom).length, teachers: Object.keys(teachers).length, slots: slots.length, students: students.length }
    };
  }

  return { parseWorkbook: parseWorkbook, norm: norm, naturalCompare: naturalCompare };
});
