import {aaa, db} from "../lib/firebase-firestore.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
$(function () {
    // Toggle chips & days
    $(".chip").on("click", function () {
        const active = $(this).attr("data-active") === "true";
        $(this).attr("data-active", !active);
    });

    $(".day").on("click", function () {
        const active = $(this).attr("data-active") === "true";
        $(this).attr("data-active", !active);
    });

    // Tabs
    const panes = {
        players: $("#pane-players"),
        matches: $("#pane-matches"),
        schedule: $("#pane-schedule")
    };
    $(".tab").on("click", function () {
        $(".tab").attr("aria-selected", "false");
        $(this).attr("aria-selected", "true");
        const key = $(this).data("tab");
        $.each(panes, function (k, v) { v.prop("hidden", k !== key); });
    });

    // Storage
    const STORAGE_KEY = "artale-boss-players";
    const loadPlayers = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const savePlayers = (list) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

    // Render players
    function renderPlayers() {
        const $tbody = $("#playerRows");
        const list = loadPlayers();
        $tbody.empty();

        if (list.length === 0) {
            $tbody.append(`<tr class="empty"><td colspan="6" class="empty">目前沒有玩家，請從左側新增</td></tr>`);
            return;
        }

        const keyword = $("#search").val().trim().toLowerCase();
        $.each(list, function (idx, p) {
            if (!keyword || (`${p.name} ${p.job}`).toLowerCase().includes(keyword)) {
                const days = (p.days || []).map(d => ["日", "一", "二", "三", "四", "五", "六"][d]).join("、") || "-";
                const prefs = (p.prefs || []).join("、") || "-";
                $tbody.append(`
                        <tr>
                        <td>${p.name}</td>
                        <td><span class="badge">${p.job || "-"}</span></td>
                        <td>${p.rounds || "-"}</td>
                        <td>${days}</td>
                        <td>${prefs}</td>
                        <td>
                            <button data-act="edit" data-idx="${idx}">編輯</button>
                            <button data-act="del" data-idx="${idx}">刪除</button>
                        </td>
                        </tr>
                    `);
            }
        });
    }
    renderPlayers();

    // Add player
    $("#btnAdd").on("click", async function (e) {
        e.preventDefault();
        const name = $("#playerName").val().trim();
        const job = $("#job").val();
        const rounds = $("#rounds").val();
        if (!name) { alert("請輸入玩家名稱"); return; }

        const days = $(".day[data-active='true']").map(function () { return +$(this).data("day"); }).get();
        const prefs = $(".chip[data-active='true']").map(function () { return $(this).text().trim(); }).get();

        const list = loadPlayers();
        list.push({ id: crypto.randomUUID(), name, job, rounds, days, prefs, createdAt: Date.now() });
        savePlayers(list);

        // reset form
        $("#playerName").val("");
        $("#job").val("");
        $("#rounds").val("14");
        $(".day, .chip").removeAttr("data-active");

        renderPlayers();
    });

    $("#btnReset").on("click", function () {
        $("#playerName").val("");
        $("#job").val("");
        $("#rounds").val("14");
        $(".day, .chip").removeAttr("data-active");
    });

    // Delete / Edit
    $("#playerRows").on("click", "button", function () {
        const idx = +$(this).data("idx");
        const act = $(this).data("act");
        const list = loadPlayers();

        if (act === "del") {
            if (confirm("確定刪除這位玩家？")) {
                list.splice(idx, 1);
                savePlayers(list);
                renderPlayers();
            }
        }
        if (act === "edit") {
            const p = list[idx];
            $("#playerName").val(p.name);
            $("#job").val(p.job);
            $("#rounds").val(p.rounds);

            $(".day").each(function () {
                $(this).attr("data-active", p.days.includes(+$(this).data("day")));
            });
            $(".chip").each(function () {
                $(this).attr("data-active", p.prefs.includes($(this).text().trim()));
            });

            list.splice(idx, 1);
            savePlayers(list);
            renderPlayers();
        }
    });

    // Search
    $("#search").on("input", renderPlayers);

    // Export
    $("#btnExport").on("click", function () {
        const blob = new Blob([localStorage.getItem(STORAGE_KEY) || "[]"], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "artale-players.json";
        a.click();
        URL.revokeObjectURL(a.href);
    });

    // Import
    $("#btnImport").on("click", function () { $("#importFile").click(); });
    $("#importFile").on("change", function (e) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function () {
            try {
                const data = JSON.parse(reader.result || "[]");
                if (!Array.isArray(data)) throw new Error("格式錯誤");
                savePlayers(data); renderPlayers();
            } catch (err) { alert("匯入失敗：" + err.message); }
        };
        reader.readAsText(file, "utf-8");
        e.target.value = "";
    });
    //日期全選
    $("#allDay").on("click", function () {
        $(".day").each(function () {
            if ($(this).attr("data-active") != "true") {
                $(this).click();
            }

        });
        $(this).removeAttr("data-active");
    });

    // Auto match (stub)
    $("#btnAuto").on("click", function () {
        const list = loadPlayers();
        const result = mockMatch(list);
        $("#pane-matches").html(result.html || "<div class='empty'>沒有可配對的資料</div>");

        // 切到配對頁
        $(".tab").attr("aria-selected", function () { return String($(this).data("tab") === "matches"); });
        $.each(panes, function (k, v) { v.prop("hidden", k !== "matches"); });
    });

    function mockMatch(players) {
        if (players.length < 6) {
            return { html: "<div class='empty'>玩家不足，至少需要 6 人以上</div>" };
        }
        const byDay = new Map();
        players.forEach(p => {
            (p.days?.length ? p.days : [-1]).forEach(d => {
                if (!byDay.has(d)) byDay.set(d, []);
                byDay.get(d).push(p);
            });
        });
        let html = "";
        for (const [day, list] of byDay) {
            const title = day === -1 ? "未填可出席" : `星期${["日", "一", "二", "三", "四", "五", "六"][day]}`;
            html += `<div style="margin:10px 0; padding:12px; border:1px solid var(--stroke); border-radius:12px; background:var(--card)">`;
            html += `<div style="margin-bottom:8px"><strong>${title}</strong> · 候選 ${list.length} 人</div>`;
            const chunks = list.reduce((arr, p, i) => {
                if (i % 6 === 0) arr.push([]);
                arr[arr.length - 1].push(p);
                return arr;
            }, []);
            chunks.forEach((team, idx) => {
                html += `<div style="margin:8px 0; padding:8px; border:1px dashed var(--stroke); border-radius:10px">`;
                html += `<div style="margin-bottom:6px">隊伍 ${idx + 1} · <span class="badge ${team.length === 6 ? 'ok' : 'warn'}">${team.length}/6</span></div>`;
                html += `<div>${team.map(p => `${p.name} <span class='badge'>${p.job || ''}</span>`).join("、 ") || "—"}</div>`;
                html += `</div>`;
            });
            html += `</div>`;
        }
        return { html };
    }
});
