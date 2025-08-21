import { addMemberInfo, getMemberInfo, deleteMemberInfo } from "../lib/firebase-firestore.js";

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
    const loadPlayers = async () => await getMemberInfo();


    // Render players
    async function renderPlayers() {
        const $tbody = $("#playerRows");
        const list = await getMemberInfo();
        $tbody.empty();

        if (list.length === 0) {
            $tbody.append(`<tr class="empty"><td colspan="6" class="empty">目前沒有玩家，請從左側新增</td></tr>`);
            return;
        }

        const keyword = $("#search").val().trim().toLowerCase();
        $.each(list, function (idx, p) {

            if (!keyword || (`${p.name} ${p.job}`).toLowerCase().includes(keyword)) {
                const days = p.days.length == 7 ? "每日" : (p.days || []).map(d => ["日", "一", "二", "三", "四", "五", "六"][d]).join("、") || "-";
                const prefs = (p.prefs || []).join("、") || "-";
                let badgeJob = "";
                switch (p.job) {
                    case "劍士":
                        badgeJob = "badge-warrior"
                        break;
                    case "法師":
                        badgeJob = "badge-magician"
                        break;
                    case "弓手":
                        badgeJob = "badge-bowman"
                        break;
                    case "盜賊":
                        badgeJob = "badge-thief"
                        break;
                    case "槍手":
                        badgeJob = "badge-pirate"
                        break;
                    case "補師":
                        badgeJob = "badge-Priest"
                        break;
                    default:
                        break;
                }
                $tbody.append(`
                        <tr>
                        <td>${p.name}</td>
                        <td><span class="badge ${badgeJob}">${p.job || "-"}</span></td>
                        <td>${p.rounds || "-"}</td>
                        <td>${days}</td>
                        <!--<td>${prefs}</td>-->
                        <td>
                            <!--<button data-act="edit" data-idx="${idx}">編輯</button>-->
                            <button data-act="del" data-idx="${p.id}">刪除</button>
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
        const days = $(".day[data-active='true']").map(function () { return +$(this).data("day"); }).get();
        const prefs = $(".chip[data-active='true']").map(function () { return $(this).text().trim(); }).get();

        if (!name) { alert("請輸入玩家名稱"); return; }
        if (!job) { alert("請選擇職業"); return; }
        if (days.length == 0) { alert("請選擇可出席日"); return; }
        //if (prefs.length==0) { alert("請選擇時段"); return; }

        const list = await getMemberInfo();
        const membetInfo = {
            name,
            job,
            rounds,
            days,
            prefs
        };
        addMemberInfo(membetInfo); //寫入一份到後端
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
    $("#playerRows").on("click", "button", async function () {
        const idx = $(this).data("idx");
        const act = $(this).data("act");
        const list = await getMemberInfo();

        if (act === "del") {
            if (confirm("確定刪除這位玩家？")) {
                deleteMemberInfo(idx);
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
                renderPlayers();
            } catch (err) { alert("匯入失敗：" + err.message); }
        };
        reader.readAsText(file, "utf-8");
        e.target.value = "";
    });
    //日期全選
    $("#allDay").on("click", function () {
        $(".day").attr("data-active", true);
        $(this).removeAttr("data-active");
    });

    // Auto match (stub)
    $("#btnAuto").on("click", async function () {
        const list = await getMemberInfo();
        const result = mockMatch(list);
        $("#pane-matches").html(result.html || "<div class='empty'>沒有可配對的資料</div>");

        // 切到配對頁
        $(".tab").attr("aria-selected", function () { return String($(this).data("tab") === "matches"); });
        $.each(panes, function (k, v) { v.prop("hidden", k !== "matches"); });
        //badge顏色
        $(".badge").each(function () {
            let badgeJob = "";
            switch ($(this).text()) {
                case "劍士":
                    badgeJob = "badge-warrior"
                    break;
                case "法師":
                    badgeJob = "badge-magician"
                    break;
                case "弓手":
                    badgeJob = "badge-bowman"
                    break;
                case "盜賊":
                    badgeJob = "badge-thief"
                    break;
                case "槍手":
                    badgeJob = "badge-pirate"
                    break;
                case "補師":
                    badgeJob = "badge-Priest"
                    break;
                default:
                    break;
            }
            $(this).addClass(badgeJob);
        });

        //加入排程
        $(".addscheBtn").on("click", function(){
            let str = `星期${["日", "一", "二", "三", "四", "五", "六"][$(this).attr("data-day")]},還沒做完 0..0`
            alert(str);
        });

    });

    function mockMatch(players) {
        if (players.length < 6) {
            return { html: "<div class='empty'>玩家不足，至少需要 6 人</div>" };
        }

        const JOB_WARRIOR = "劍士";
        const JOB_MAGE = "法師";
        const TEAM_SIZE = 6;
        const RULE_MAX_ONE_WARRIOR = false; // 想限制每隊最多 1 劍士改成 true

        // === 依照出席日分組 ===
        const byDay = new Map();
        players.forEach(p => {
            (p.days?.length ? p.days : [-1]).forEach(d => {
                if (!byDay.has(d)) byDay.set(d, []);
                byDay.get(d).push(p);
            });
        });

        // === 分組函式（依照職業規則） ===
        function makeTeams(list) {
            const warriors = list.filter(p => p.job === "劍士");
            const mages = list.filter(p => p.job === "法師");
            const others = list.filter(p => p.job !== "劍士" && p.job !== "法師");

            const teams = [];

            while (list.length > 0) {
                const team = [];

                // 先放 1 個法師（若有）
                if (mages.length > 0) {
                    team.push(mages.shift());
                }

                // 再放第 2 個法師（最多 2 個）
                if (mages.length > 0 && team.length < 2) {
                    team.push(mages.shift());
                }

                // 放 1 個劍士（最多 1 個）
                if (warriors.length > 0) {
                    team.push(warriors.shift());
                }

                // 補滿其餘位置，優先放其他職業
                while (team.length < 6 && others.length > 0) {
                    team.push(others.shift());
                }

                // 如果還沒滿，再放剩下的法師/劍士
                while (team.length < 6 && (mages.length > 0 || warriors.length > 0)) {
                    if (mages.length > 0 && team.filter(p => p.job === "法師").length < 2) {
                        team.push(mages.shift());
                    } else if (warriors.length > 0 && !team.some(p => p.job === "劍士")) {
                        team.push(warriors.shift());
                    } else {
                        break;
                    }
                }

                // 如果還沒滿，就硬塞剩下的玩家（避免被丟掉）
                while (team.length < 6 && (mages.length > 0 || warriors.length > 0 || others.length > 0)) {
                    if (mages.length > 0) team.push(mages.shift());
                    else if (warriors.length > 0) team.push(warriors.shift());
                    else if (others.length > 0) team.push(others.shift());
                }

                teams.push(team);

                // 從 list 移除已經分配的人
                list = list.filter(p => !team.includes(p));
            }

            return teams;
        }

        // === 輸出 HTML ===
        let html = "";
        for (const [day, list] of byDay) {
            const title = day === -1 ? "未填可出席" : `星期${["日", "一", "二", "三", "四", "五", "六"][day]}`;
            let addscheBtn = `<button class="badge ok addscheBtn" data-day="${day}">加入排程</button>`;
            html += `<div style="margin:10px 0; padding:12px; border:1px solid var(--stroke); border-radius:12px; background:var(--card)">`;
            html += `<div style="margin-bottom:8px"><strong>${title}</strong> · 候選 ${list.length} 人</div>`;

            const teams = makeTeams(list);

            teams.forEach((team, idx) => {
                const hasMage = team.some(p => p.job === JOB_MAGE);
                const warriorCount = team.filter(p => p.job === JOB_WARRIOR).length;

                let status = `${team.length}/${TEAM_SIZE}`;
                if (!hasMage) status += " · 缺少法師";
                if (RULE_MAX_ONE_WARRIOR && warriorCount > 1) status += " · 劍士超過";

                const ok = team.length === TEAM_SIZE && hasMage && (!RULE_MAX_ONE_WARRIOR || warriorCount <= 1);

                html += `<div style="margin:8px 0; padding:8px; border:1px dashed var(--stroke); border-radius:10px" class="${ok?'okParty':''}" >`;
                html += `<div style="margin-bottom:6px">隊伍 ${idx + 1} · <span class="badge ${ok ? 'ok' : 'warn'}" ${ok?'style="display:none;"':''}>${status}</span>${ok?addscheBtn:''}</div>`;
                html += `<div>${team.map(p => `${p.name} <span class='badge ${p.job}'>${p.job || ''}</span>`).join("、 ") || "—"}</div>`;
                html += `</div>`;
            });

            html += `</div>`;
        }
        return { html };
    }
});
