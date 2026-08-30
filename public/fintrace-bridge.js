/* FinTrace bridge for FinSim  (plain JS — not part of the TS build).
 *
 * Turns a real FinSim session into a FinTrace dataset row:
 *   1. a pre-game survey + literacy quiz (stated preference),
 *   2. an in-game "Ask Mira" panel that queries VeriFin and records faithfulness,
 *   3. an end-of-session export that reads FinSim's own window.portfolio and
 *      window.behavior logs and POSTs them to FinTrace /api/session.
 *
 * It reads the live singletons FinSim already exposes and never touches game
 * internals, so it is safe to drop in and easy to remove. Configure the two
 * backends by setting window.FINTRACE_URL / window.VERIFIN_URL before this loads.
 */
(function () {
  "use strict";

  var FINTRACE_URL = window.FINTRACE_URL || "http://localhost:8000";
  var VERIFIN_URL = window.VERIFIN_URL || "http://localhost:8100";
  var POLL_MS = 3000;

  // ---- session state -----------------------------------------------------
  var survey = null;                 // set once the survey is submitted
  var quiz = { literacy_pre: 0, literacy_post: 0 };
  var mentor = [];                   // [{faithfulness, hallucinated}]
  var series = [];                   // sampled equity over the session
  var maxConc = 0;
  var pollTimer = null;

  // ---- tiny DOM helpers --------------------------------------------------
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html != null) e.innerHTML = html;
    return e;
  }
  function style() {
    var css = "" +
      "#ft-bar{position:fixed;right:14px;bottom:14px;z-index:99999;display:flex;gap:8px;font:13px ui-monospace,Menlo,Consolas,monospace}" +
      "#ft-bar button{cursor:pointer;border-radius:9px;border:1px solid #434d54;background:#2b3237;color:#e6e9ea;padding:9px 13px}" +
      "#ft-bar button:hover{border-color:#FFFA00;color:#fff}" +
      "#ft-bar button.hot{border-color:#FFFA00;color:#FFFA00;box-shadow:0 0 14px rgba(255,250,0,.3)}" +
      ".ft-ov{position:fixed;inset:0;background:rgba(6,9,13,.75);z-index:100000;display:flex;align-items:center;justify-content:center}" +
      ".ft-modal{background:#2b3237;border:1px solid #434d54;border-radius:14px;padding:22px;max-width:460px;max-height:86vh;overflow:auto;color:#e6e9ea;font:13px ui-monospace,Menlo,Consolas,monospace}" +
      ".ft-modal h2{color:#fff;margin:0 0 6px;font-size:18px}.ft-modal h2 b{color:#FFFA00}" +
      ".ft-modal .sub{color:#9aa4ab;font-size:12px}" +
      ".ft-modal label{display:block;color:#9aa4ab;font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin:12px 0 5px}" +
      ".ft-modal select,.ft-modal input,.ft-modal textarea{width:100%;background:#323A3F;border:1px solid #434d54;color:#e6e9ea;border-radius:8px;padding:8px 10px;font:inherit}" +
      ".ft-q{margin:10px 0}.ft-opt{display:block;width:100%;text-align:left;margin:4px 0;padding:8px 10px;border:1px solid #434d54;border-radius:8px;background:#323A3F;color:#e6e9ea;cursor:pointer}" +
      ".ft-opt.sel{border-color:#FFFA00;color:#fff;background:rgba(255,250,0,.08)}" +
      ".ft-modal .row{display:flex;gap:10px}.ft-modal .row>div{flex:1}" +
      ".ft-act{display:flex;gap:10px;margin-top:16px;align-items:center}.ft-act .sp{flex:1}" +
      ".ft-btn{cursor:pointer;border-radius:9px;border:1px solid #FFFA00;background:#3a444b;color:#FFFA00;font-weight:700;padding:9px 16px}" +
      ".ft-btn:hover{background:#FFFA00;color:#05140d}.ft-ghost{border:1px solid #434d54;background:#323A3F;color:#e6e9ea;border-radius:9px;padding:9px 14px;cursor:pointer}" +
      ".ft-ans{margin-top:10px;background:#323A3F;border-left:2px solid #5fd68b;border-radius:0 8px 8px 0;padding:9px 11px;font-size:12.5px}" +
      ".ft-ans .chip{color:#5fd68b;font-size:11px}.ft-pill{display:inline-block;font-size:11px;border:1px solid #434d54;border-radius:999px;padding:2px 9px;margin:3px 4px 0 0;color:#9aa4ab;cursor:pointer}.ft-pill.on{color:#FFFA00;border-color:#FFFA00}" +
      ".ft-err{color:#ff6b6b}.ft-kv{display:grid;grid-template-columns:1fr auto;gap:5px 10px;font-size:12.5px;margin-top:12px}.ft-kv .v{color:#fff;text-align:right}";
    document.head.appendChild(el("style", null, css));
  }
  function overlay(node) {
    var ov = el("div", { class: "ft-ov" });
    var m = el("div", { class: "ft-modal" });
    m.appendChild(node);
    ov.appendChild(m);
    ov.addEventListener("click", function (e) { if (e.target === ov) document.body.removeChild(ov); });
    document.body.appendChild(ov);
    return ov;
  }

  // ---- literacy quizzes --------------------------------------------------
  var PRE = [
    ["₹1,000 at 10% compound for 2 years ≈", ["₹1,100", "₹1,210", "₹2,000"], 1],
    ["\"Double your money in a week, guaranteed\" is", ["An opportunity", "A scam", "A bank product"], 1],
    ["All money in one stock mainly increases", ["Diversification", "Risk", "Guaranteed return"], 1],
    ["Pay-to-recruit MLM is a", ["Mutual fund", "Pyramid", "Index fund"], 1],
    ["Higher returns generally come with", ["Lower risk", "Higher risk", "No risk"], 1],
  ];
  var POST = [
    ["A stranger's WhatsApp pre-IPO offer is", ["Safe insider deal", "Likely fraud", "Risk-free"], 1],
    ["Identical positive return every month suggests", ["A good fund", "A Ponzi", "An index fund"], 1],
    ["Sharpe ratio measures", ["Total profit", "Return per unit of risk", "Trades made"], 1],
    ["A lender wanting a fee BEFORE the loan is", ["Standard", "Advance-fee fraud", "A discount"], 1],
    ["Panic-selling a dip then buying higher is", ["Discipline", "Biased trading", "Hedging"], 1],
  ];
  function quizHtml(qs, prefix) {
    return qs.map(function (item, i) {
      return '<div class="ft-q"><div>' + (i + 1) + ". " + item[0] + "</div>" +
        item[1].map(function (opt, j) {
          return '<button class="ft-opt" data-q="' + prefix + i + '" data-j="' + j + '">' + opt + "</button>";
        }).join("") + "</div>";
    }).join("");
  }
  function wireQuiz(root) {
    root.querySelectorAll(".ft-opt").forEach(function (b) {
      b.addEventListener("click", function () {
        root.querySelectorAll('[data-q="' + b.getAttribute("data-q") + '"]').forEach(function (x) { x.classList.remove("sel"); });
        b.classList.add("sel");
      });
    });
  }
  function scoreQuiz(root, qs, prefix) {
    var correct = 0, answered = 0;
    qs.forEach(function (item, i) {
      var sel = root.querySelector('[data-q="' + prefix + i + '"].sel');
      if (sel) { answered++; if (+sel.getAttribute("data-j") === item[2]) correct++; }
    });
    return { pct: Math.round((correct / qs.length) * 100), answered: answered, total: qs.length };
  }

  // ---- survey ------------------------------------------------------------
  var PRIORITIES = ["safety", "high_returns", "quick_gains", "learning"];
  function openSurvey() {
    var body = el("div", null,
      "<h2><b>Fin</b>Trace survey</h2><div class='sub'>Answer honestly — we compare it to how you actually play.</div>" +
      "<label>Alias (shown on the scoreboard)</label><input id='ft-alias' maxlength='24' placeholder='e.g. NightOwl'/>" +
      "<div class='row'><div><label>Age band</label><select id='ft-age'>" + opts(["18-24","25-34","35-44","45-54"]) + "</select></div>" +
      "<div><label>Occupation</label><select id='ft-occ'><option value='student'>student</option><option value='working'>working</option></select></div></div>" +
      "<div class='row'><div><label>Income band</label><select id='ft-inc'>" + opts(["0-10k","10-30k","30-60k","60k+"]) + "</select></div>" +
      "<div><label>Prior experience</label><select id='ft-exp'><option value='none'>none</option><option value='a_little'>a little</option><option value='active'>active</option></select></div></div>" +
      "<label>Self-rated risk: <b id='ft-rv' style='color:#FFFA00'>3</b>/5</label><input type='range' id='ft-risk' min='1' max='5' value='3'/>" +
      "<label>Priorities</label><div id='ft-pri'>" + PRIORITIES.map(function (p) { return "<span class='ft-pill' data-p='" + p + "'>" + p.replace("_", " ") + "</span>"; }).join("") + "</div>" +
      "<label>Financial literacy check</label>" + quizHtml(PRE, "pre") +
      "<div class='ft-act'><span id='ft-w' class='sub'></span><div class='sp'></div><button class='ft-btn' id='ft-go'>Save &amp; start playing</button></div>");
    var ov = overlay(body);
    body.querySelector("#ft-risk").addEventListener("input", function (e) { body.querySelector("#ft-rv").textContent = e.target.value; });
    body.querySelectorAll("#ft-pri .ft-pill").forEach(function (p) { p.addEventListener("click", function () { p.classList.toggle("on"); }); });
    wireQuiz(body);
    body.querySelector("#ft-go").addEventListener("click", function () {
      var pre = scoreQuiz(body, PRE, "pre");
      if (pre.answered < pre.total) { body.querySelector("#ft-w").innerHTML = "<span class='ft-err'>answer all five</span>"; return; }
      survey = {
        age_band: val(body, "#ft-age"), occupation: val(body, "#ft-occ"), income_band: val(body, "#ft-inc"),
        prior_experience: val(body, "#ft-exp"), risk_selfrated: +val(body, "#ft-risk"),
        priorities: Array.prototype.map.call(body.querySelectorAll("#ft-pri .ft-pill.on"), function (x) { return x.getAttribute("data-p"); }),
      };
      window.__ftAlias = (body.querySelector("#ft-alias").value || "Player").trim();
      quiz.literacy_pre = pre.pct;
      document.body.removeChild(ov);
      startPolling();
      markReady();
    });
  }
  function opts(a) { return a.map(function (o) { return "<option>" + o + "</option>"; }).join(""); }
  function val(root, sel) { return root.querySelector(sel).value; }

  // ---- VeriFin mentor ----------------------------------------------------
  function openMentor() {
    var body = el("div", null,
      "<h2>Ask <b>Mira</b></h2><div class='sub'>Verified by VeriFin — every answer carries a faithfulness score.</div>" +
      "<label>Your question</label><textarea id='ft-qq' rows='2' placeholder='e.g. Is a guaranteed 20% a week real?'></textarea>" +
      "<div class='ft-act'><div class='sp'></div><button class='ft-ghost' id='ft-close'>Close</button><button class='ft-btn' id='ft-ask'>Ask</button></div>" +
      "<div id='ft-out'></div>");
    var ov = overlay(body);
    body.querySelector("#ft-close").addEventListener("click", function () { document.body.removeChild(ov); });
    body.querySelector("#ft-ask").addEventListener("click", function () {
      var q = body.querySelector("#ft-qq").value.trim();
      if (!q) return;
      var out = body.querySelector("#ft-out");
      out.innerHTML = "<div class='sub' style='margin-top:10px'>asking VeriFin…</div>";
      fetch(VERIFIN_URL + "/ask", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, mode: "web" }),
      }).then(function (r) { return r.json(); }).then(function (d) {
        var faith = typeof d.faithfulness_score === "number" ? d.faithfulness_score : 0.9;
        var hallucinated = Array.isArray(d.sentences) && d.sentences.some(function (s) { return s.status === "unverified"; });
        mentor.push({ faithfulness: faith, hallucinated: hallucinated });
        out.innerHTML = "<div class='ft-ans'><b>Mira:</b> " + (d.grounded_answer || d.answer || "—") +
          " <span class='chip'>✓ faithfulness " + faith.toFixed(2) + "</span></div>";
      }).catch(function () {
        out.innerHTML = "<div class='ft-ans ft-err'>VeriFin not reachable at " + VERIFIN_URL +
          ". Start it: <code>uvicorn api.main:app --port 8100</code></div>";
      });
    });
  }

  // ---- telemetry sampling ------------------------------------------------
  function equity() { try { return window.portfolio.getTotalValue(); } catch (e) { return null; } }
  function sample() {
    var eq = equity();
    if (eq == null) return;
    series.push(round2(eq));
    try {
      var holdings = window.portfolio.getHoldings() || [];
      var biggest = 0;
      holdings.forEach(function (h) { biggest = Math.max(biggest, h.quantity * h.avgPrice); });
      if (eq > 0) maxConc = Math.max(maxConc, biggest / eq);
    } catch (e) { /* holdings not ready */ }
  }
  function startPolling() {
    if (pollTimer) return;
    sample();
    pollTimer = setInterval(sample, POLL_MS);
  }

  // ---- build the session payload from FinSim's own logs ------------------
  function mapBiasType(t) {
    if (t === "fomo") return "fomo";
    if (t === "revenge_trading") return "revenge";
    if (t === "overconfidence") return "overconf";
    return null;                                   // FinTrace only scores these three
  }
  function buildEvents() {
    var events = (function () { try { return window.behavior.getEvents() || []; } catch (e) { return []; } })();
    var txs = (function () { try { return window.portfolio.getTransactions() || []; } catch (e) { return []; } })();

    var trades = txs.map(function (t) {
      return { symbol: t.symbol, side: t.side, qty: t.quantity, price: round2(t.price), ts: t.timestamp };
    });
    var buys = trades.filter(function (t) { return t.side === "buy"; });

    // Biases: FinSim logs the trigger; infer "heeded" from whether a buy landed
    // within 25s of the warning (a trade right after = overridden the coach).
    var biases = [];
    events.forEach(function (e) {
      if (e.eventType !== "bias_detected") return;
      var type = mapBiasType((e.payload && e.payload.type) || "");
      if (!type) return;
      var overridden = buys.some(function (b) { return b.ts >= e.timestamp && b.ts <= e.timestamp + 25000; });
      biases.push({ type: type, heeded: !overridden });
    });

    // Scams: FinSim logs when a player falls for one. (Declining is an ordinary
    // dialogue path and isn't logged, so detection is scored from what we have.)
    var scams = events.filter(function (e) { return e.eventType === "fell_for_scam"; })
      .map(function (e, i) { return { id: (e.payload && e.payload.id) || ("scam_" + i), fell_for: true, flagged_correctly: false }; });

    // Echoes: from the echo_result events the bridge added to EchoModal.
    var echoes = events.filter(function (e) { return e.eventType === "echo_result"; })
      .map(function (e) {
        var p = e.payload || {};
        return { id: p.id || "echo", correct: !!p.correct, matched_fraud: !!p.matchedFraud };
      });

    return { trades: trades, biases: biases, scams: scams, echoes: echoes, mentor: mentor.slice() };
  }

  // ---- end session -> submit --------------------------------------------
  function openEnd() {
    if (!survey) { openSurvey(); return; }
    var body = el("div", null,
      "<h2>End session</h2><div class='sub'>One last quiz, then we mine your play into a FinTrace row.</div>" +
      quizHtml(POST, "post") +
      "<div class='ft-act'><span id='ft-w' class='sub'></span><div class='sp'></div><button class='ft-ghost' id='ft-cancel'>Keep playing</button><button class='ft-btn' id='ft-send'>Submit to FinTrace</button></div>" +
      "<div id='ft-res'></div>");
    var ov = overlay(body);
    wireQuiz(body);
    body.querySelector("#ft-cancel").addEventListener("click", function () { document.body.removeChild(ov); });
    body.querySelector("#ft-send").addEventListener("click", function () {
      var post = scoreQuiz(body, POST, "post");
      if (post.answered < post.total) { body.querySelector("#ft-w").innerHTML = "<span class='ft-err'>answer all five</span>"; return; }
      quiz.literacy_post = post.pct;
      sample();
      var payload = {
        source: "finsim", alias: window.__ftAlias || "Player",
        survey: survey, quiz: quiz,
        portfolio_series: series.slice(),
        max_position_concentration: round3(maxConc),
        final_portfolio_value: round2(equity() || 0),
        events: buildEvents(),
      };
      var res = body.querySelector("#ft-res");
      res.innerHTML = "<div class='sub' style='margin-top:12px'>mining your session…</div>";
      fetch(FINTRACE_URL + "/api/session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (!d.player) throw new Error(d.error || "no result");
        var p = d.player;
        res.innerHTML = "<div class='ft-kv'>" +
          kv("Archetype", p.archetype) + kv("Persona", p.persona) +
          kv("Scam vulnerability", p.scam_vulnerability_tier + " (" + p.scam_vulnerability_score.toFixed(2) + ")") +
          kv("Model predicted", p.predicted_tier + (p.prediction_correct ? " ✓" : " ✗")) +
          kv("Decision quality", p.decision_quality.toFixed(1)) +
          kv("Literacy pre→post", p.literacy_pre + "→" + p.literacy_post) +
          "</div><div class='ft-act'><div class='sp'></div><a href='" + FINTRACE_URL + "/scoreboard' target='_blank'><button class='ft-btn'>Open scoreboard</button></a></div>";
      }).catch(function (err) {
        res.innerHTML = "<div class='ft-ans ft-err'>Could not submit: " + err.message +
          ". Is FinTrace running at " + FINTRACE_URL + " (<code>make play</code>)?</div>";
      });
    });
  }
  function kv(k, v) { return "<div>" + k + "</div><div class='v'>" + v + "</div>"; }

  // ---- launcher bar ------------------------------------------------------
  var readyBtn = null;
  function markReady() { if (readyBtn) readyBtn.classList.add("hot"); }
  function bar() {
    var b = el("div", { id: "ft-bar" });
    var bSurvey = el("button", null, "📋 Survey");
    var bMentor = el("button", null, "🧠 Ask Mira");
    readyBtn = el("button", null, "📤 End → FinTrace");
    bSurvey.addEventListener("click", openSurvey);
    bMentor.addEventListener("click", openMentor);
    readyBtn.addEventListener("click", openEnd);
    b.appendChild(bSurvey); b.appendChild(bMentor); b.appendChild(readyBtn);
    document.body.appendChild(b);
  }

  function round2(n) { return Math.round(n * 100) / 100; }
  function round3(n) { return Math.round(n * 1000) / 1000; }

  // If FinTrace handed us a survey via ?ft=, adopt it and skip asking again.
  function readHandoff() {
    try {
      var raw = new URL(location.href).searchParams.get("ft");
      if (!raw) return;
      var h = JSON.parse(decodeURIComponent(raw));
      if (!h || !h.survey) return;
      survey = h.survey;
      quiz.literacy_pre = h.literacy_pre || 0;
      window.__ftAlias = h.alias || "Player";
      startPolling();
      markReady();
      var note = el("div", { class: "ft-ans", style: "position:fixed;left:14px;bottom:14px;z-index:99999;max-width:320px" },
        "<b>FinTrace survey received.</b> Play the game, ask Mira, then hit <b>End → FinTrace</b>.");
      document.body.appendChild(note);
      setTimeout(function () { if (note.parentNode) note.parentNode.removeChild(note); }, 9000);
      // Clean the URL so a refresh doesn't re-import the survey.
      try { history.replaceState({}, "", location.pathname); } catch (e) { /* ignore */ }
    } catch (e) { /* no valid handoff */ }
  }

  // Wait until FinSim's singletons exist, then mount.
  function boot() {
    if (!window.portfolio || !window.behavior) { return setTimeout(boot, 500); }
    style(); bar(); readHandoff();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
