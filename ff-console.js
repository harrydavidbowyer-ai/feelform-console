// SIMPLE LOG
function FFLog(msg){ console.log("[FeelForm]", msg); }

// STATE
var FFState = {
  chamber: "baseline"
};

// SOUND STUB
var FFSound = {
  on: false,
  toggle: function(){
    this.on = !this.on;
    var btn = document.getElementById("ff-sound-toggle");
    if(btn) btn.textContent = this.on ? "ON" : "OFF";
  },
  playEvent: function(name){
    if(!this.on) return;
    // hook real audio here if desired
    FFLog("Sound event: " + name);
  }
};

// MEMORY ENGINE
var FFMemory = {
  localKey: "ff-memory-local",
  cloud: {
    owner: "harrydavidbowyer-ai",
    repo: "feelform-console",
    branch: "main",
    token: "YOUR_GITHUB_PAT_HERE" // do not commit real token
  },
  currentSession: {},

  loadLocal: function(){
    try { return JSON.parse(localStorage.getItem(this.localKey)); }
    catch(e){ return null; }
  },

  saveLocal: function(snapshot){
    try { localStorage.setItem(this.localKey, JSON.stringify(snapshot)); }
    catch(e){}
  },

  captureFromDOM: function(){
    var pulse = document.getElementById("ff-pulse-input")?.value || "";
    var somLoc = document.getElementById("ff-somatic-location")?.value || "";
    var somInt = parseInt(document.getElementById("ff-somatic-intensity")?.value || "0",10);
    var reflection = document.getElementById("ff-reflect-input")?.value || "";
    var identity = document.getElementById("ff-identity-input")?.value || "";

    var decA = document.getElementById("ff-decision-a")?.value || "";
    var decB = document.getElementById("ff-decision-b")?.value || "";
    var decision = (decA || decB) ? (decA + " / " + decB) : "";

    var amplitude = Math.max(0, Math.min(100, somInt || 0));

    this.currentSession = {
      index: Date.now(),
      timestamp: new Date().toISOString(),
      pulse: pulse,
      somatic: { location: somLoc, intensity: somInt },
      reflection: reflection,
      decision: decision,
      identity: identity,
      amplitude: amplitude
    };

    return this.currentSession;
  },

  _githubUrlFor: function(path){
    return "https://api.github.com/repos/" +
      this.cloud.owner + "/" +
      this.cloud.repo + "/contents/" + path;
  },

  _githubHeaders: function(){
    return {
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer " + this.cloud.token
    };
  },

  _fetchFile: async function(path){
    var res = await fetch(this._githubUrlFor(path), {
      method: "GET",
      headers: this._githubHeaders()
    });
    if(res.status === 404) return { exists:false, sha:null, json:null };
    var data = await res.json();
    var content = atob(data.content || "");
    var json = null;
    try { json = JSON.parse(content); } catch(e){}
    return { exists:true, sha:data.sha, json:json };
  },

  _putFile: async function(path, json, sha){
    var body = {
      message: "Update " + path + " via FeelForm Memory Engine",
      content: btoa(JSON.stringify(json, null, 2)),
      branch: this.cloud.branch
    };
    if(sha) body.sha = sha;

    return fetch(this._githubUrlFor(path), {
      method: "PUT",
      headers: Object.assign({}, this._githubHeaders(), {
        "Content-Type": "application/json"
      }),
      body: JSON.stringify(body)
    });
  },

  writeSessionFile: async function(session){
    var date = session.timestamp.slice(0,10);
    var path = "memory/sessions/session-" + date + ".json";
    return this._putFile(path, { session: session }, null);
  },

  updateIdentity: async function(session){
    var res = await this._fetchFile("memory/identity.json");
    var base = res.json || {};
    if(!base.harry) base.harry = [];
    if(session.identity && session.identity.trim().length){
      base.harry.push({ at: session.timestamp, statement: session.identity.trim() });
    }
    return this._putFile("memory/identity.json", base, res.sha);
  },

  updateTrajectory: async function(session){
    var res = await this._fetchFile("memory/trajectory.json");
    var base = res.json || {};
    if(!base.practitioner)
      base.practitioner = { somatic_curve: [], amplitude_curve: [], pulse_themes: [] };

    base.practitioner.somatic_curve.push({
      at: session.timestamp,
      location: session.somatic.location,
      intensity: session.somatic.intensity
    });

    base.practitioner.amplitude_curve.push({
      at: session.timestamp,
      amplitude: session.amplitude
    });

    if(session.pulse && session.pulse.trim().length){
      base.practitioner.pulse_themes.push({
        at: session.timestamp,
        text: session.pulse.trim()
      });
    }

    return this._putFile("memory/trajectory.json", base, res.sha);
  },

  updateMeta: async function(session){
    var res = await this._fetchFile("memory/meta.json");
    var base = res.json || {};
    if(!base.user) base.user = {};
    var u = base.user;

    u.cycles_completed = (u.cycles_completed || 0) + 1;
    u.last_cycle = session.timestamp;
    u.last_amplitude = session.amplitude;

    return this._putFile("memory/meta.json", base, res.sha);
  },

  persistCycle: async function(){
    var snapshot = this.captureFromDOM();
    this.saveLocal(snapshot);

    try{
      await this.writeSessionFile(snapshot);
      await this.updateIdentity(snapshot);
      await this.updateTrajectory(snapshot);
      await this.updateMeta(snapshot);
      FFLog("Memory: cloud sync complete.");
    }catch(e){
      FFLog("Memory: cloud sync failed.");
    }
  }
};

// MEMORY TAB RENDERING

function FFMemory_renderSessions(local, el){
  if(!el) return;
  el.innerHTML = "";
  if(!local){
    el.textContent = "No local session snapshot yet.";
    return;
  }

  el.innerHTML = `
    <div class="ff-memory-meta-row">
      <span>Last session</span>
      <span>${local.timestamp}</span>
    </div>

    <div class="ff-memory-bar-row">
      <div class="ff-memory-bar-label">Amplitude</div>
      <div class="ff-memory-bar">
        <div class="ff-memory-bar-fill" style="width:${local.amplitude}%"></div>
      </div>
    </div>

    <div><span class="ff-memory-pill">Pulse</span> ${local.pulse || "—"}</div>
    <div><span class="ff-memory-pill">Somatic</span> ${local.somatic.location || "—"} · ${local.somatic.intensity || 0}</div>
    <div><span class="ff-memory-pill">Reflection</span> ${local.reflection || "—"}</div>
    <div><span class="ff-memory-pill">Decision</span> ${local.decision || "—"}</div>
    <div><span class="ff-memory-pill">Identity</span> ${local.identity || "—"}</div>
  `;
}

function FFMemory_renderIdentity(json, el){
  if(!el) return;
  el.innerHTML = "";
  if(!json || !json.harry || !json.harry.length){
    el.textContent = "No identity drift yet.";
    return;
  }
  json.harry.slice(-5).forEach(entry=>{
    el.innerHTML += `
      <div class="ff-memory-meta-row">
        <span>${entry.at}</span>
        <span>${entry.statement}</span>
      </div>
    `;
  });
}

function FFMemory_renderTrajectory(json, el){
  if(!el) return;
  el.innerHTML = "";
  if(!json || !json.practitioner){
    el.textContent = "No trajectory yet.";
    return;
  }

  var p = json.practitioner;
  var lastAmp = p.amplitude_curve?.slice(-1)[0]?.amplitude || 0;
  var lastSom = p.somatic_curve?.slice(-1)[0] || {};
  var lastPulse = p.pulse_themes?.slice(-1)[0] || {};

  el.innerHTML = `
    <div class="ff-memory-bar-row">
      <div class="ff-memory-bar-label">Amplitude now</div>
      <div class="ff-memory-bar">
        <div class="ff-memory-bar-fill" style="width:${lastAmp}%"></div>
      </div>
    </div>

    <div class="ff-memory-meta-row">
      <span>Somatic now</span>
      <span>${lastSom.location || "—"} · ${lastSom.intensity || 0}</span>
    </div>

    <div class="ff-memory-meta-row">
      <span>Pulse theme</span>
      <span>${lastPulse.text || "—"}</span>
    </div>
  `;
}

function FFMemory_renderMeta(json, el){
  if(!el) return;
  el.innerHTML = "";
  if(!json || !json.user){
    el.textContent = "No meta yet.";
    return;
  }
  var u = json.user;

  el.innerHTML = `
    <div class="ff-memory-meta-row"><span>Cycles</span><span>${u.cycles_completed || 0}</span></div>
    <div class="ff-memory-meta-row"><span>Last cycle</span><span>${u.last_cycle || "—"}</span></div>
    <div class="ff-memory-meta-row"><span>Last amplitude</span><span>${u.last_amplitude ?? "—"}</span></div>
  `;
}

async function FFMemory_loadCloud(){
  try{
    var identity = await FFMemory._fetchFile("memory/identity.json");
    var trajectory = await FFMemory._fetchFile("memory/trajectory.json");
    var meta = await FFMemory._fetchFile("memory/meta.json");
    var local = FFMemory.loadLocal();

    FFMemory_renderSessions(local, document.getElementById("ff-memory-sessions"));
    FFMemory_renderIdentity(identity.json, document.getElementById("ff-memory-identity"));
    FFMemory_renderTrajectory(trajectory.json, document.getElementById("ff-memory-trajectory"));
    FFMemory_renderMeta(meta.json, document.getElementById("ff-memory-meta"));
  }catch(e){
    FFLog("Memory tab load failed.");
  }
}

// CHAMBER SWITCHING

function switchChamber(id){
  FFState.chamber = id;
  document.querySelectorAll(".ff-chamber").forEach(c=>{
    c.classList.remove("ff-active");
  });
  var target = document.getElementById("ff-chamber-" + id);
  if(target) target.classList.add("ff-active");
}

// INIT

window.onload = function(){
  // sound toggle
  var soundBtn = document.getElementById("ff-sound-toggle");
  if(soundBtn){
    soundBtn.onclick = function(){
      FFSound.toggle();
    };
  }

  // tabs
  document.querySelectorAll(".ff-console-tab").forEach(tab=>{
    tab.onclick = function(){
      var name = this.dataset.tab;

      document.querySelectorAll(".ff-console-panel").forEach(p=>p.classList.remove("ff-active"));
      document.querySelectorAll(".ff-console-tab").forEach(t=>t.classList.remove("ff-active"));

      this.classList.add("ff-active");
      var panel = document.getElementById("ff-panel-" + name);
      if(panel) panel.classList.add("ff-active");

      if(name === "memory"){
        FFMemory_loadCloud();
      }
    };
  });

  // chamber navigation
  document.querySelectorAll(".ff-next").forEach(btn=>{
    btn.onclick = function(){
      var next = this.dataset.next;
      if(next){
        switchChamber(next);
        FFSound.playEvent("step");
      }
    };
  });

  // ritual complete
  var ritualBtn = document.getElementById("ff-ritual-complete");
  var ritualGlow = document.getElementById("ff-ritual-glow");
  if(ritualBtn){
    ritualBtn.onclick = function(){
      var sub = document.getElementById("ff-ritual-sub");
      if(sub){
        sub.textContent = "Cycle captured. Returning to Baseline.";
      }
      if(ritualGlow){
        ritualGlow.classList.add("ff-on");
      }
      FFSound.playEvent("ritual-complete");
      FFLog("Cycle completed. Capturing memory…");

      FFMemory.persistCycle();

      setTimeout(function(){
        if(ritualGlow){
          ritualGlow.classList.remove("ff-on");
        }
        switchChamber("baseline");
      }, 1200);
    };
  }

  // start at baseline
  switchChamber("baseline");

  // log local memory presence
  var last = FFMemory.loadLocal();
  if(last){
    FFLog("Memory: local snapshot from " + last.timestamp);
  }
};
