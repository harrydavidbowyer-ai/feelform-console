// ---------------------------------------------------------
// FEELFORM OS v4.1 — Console + Chambers + Memory + Synth Audio
// ---------------------------------------------------------

function FFLog(msg){ console.log("[FeelForm]", msg); }

// ---------------------------------------------------------
// STATE
// ---------------------------------------------------------

var FFState = {
  chamber: "baseline"
};

// ---------------------------------------------------------
// CINEMATIC SYNTH SOUND ENGINE
// ---------------------------------------------------------

var FFSound = {
  on: false,
  ctx: null,

  init: function(){
    if(!this.ctx){
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  toggle: function(){
    this.on = !this.on;
    var btn = document.getElementById("ff-sound-toggle");
    if(btn) btn.textContent = this.on ? "ON" : "OFF";
    if(this.on) this.init();
  },

  playEvent: function(name){
    if(!this.on) return;
    if(!this.ctx) this.init();

    switch(name){
      case "step": this.click(); break;
      case "pulse": this.ping(); break;
      case "somatic": this.lowTone(); break;
      case "identity": this.shimmer(); break;
      case "chamber-shift": this.whoosh(); break;
      case "ritual-complete": this.swell(); break;
    }
  },

  click: function(){
    let o = this.ctx.createOscillator();
    let g = this.ctx.createGain();
    o.type = "square";
    o.frequency.value = 240;
    g.gain.setValueAtTime(0.25, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    o.connect(g).connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + 0.06);
  },

  ping: function(){
    let o = this.ctx.createOscillator();
    let g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(660, this.ctx.currentTime);
    g.gain.setValueAtTime(0.3, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    o.connect(g).connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + 0.5);
  },

  lowTone: function(){
    let o = this.ctx.createOscillator();
    let g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(140, this.ctx.currentTime);
    g.gain.setValueAtTime(0.35, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    o.connect(g).connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + 0.35);
  },

  shimmer: function(){
    let o = this.ctx.createOscillator();
    let g = this.ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(880, this.ctx.currentTime);
    g.gain.setValueAtTime(0.25, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
    o.connect(g).connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + 0.7);
  },

  whoosh: function(){
    let bufferSize = 2 * this.ctx.sampleRate;
    let noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    let output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.3;
    }

    let noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    let g = this.ctx.createGain();
    g.gain.setValueAtTime(0.25, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    noise.connect(g).connect(this.ctx.destination);
    noise.start();
    noise.stop(this.ctx.currentTime + 0.3);
  },

  swell: function(){
    let o = this.ctx.createOscillator();
    let g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(440, this.ctx.currentTime);
    g.gain.setValueAtTime(0.001, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.35, this.ctx.currentTime + 0.4);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
    o.connect(g).connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + 1.3);
  }
};

// ---------------------------------------------------------
// FORCE AUDIO RESUME BUTTON
// ---------------------------------------------------------

function FF_checkAudioState(){
  if(FFSound.ctx && FFSound.ctx.state === "suspended"){
    let btn = document.getElementById("ff-force-audio");
    if(btn) btn.style.display = "inline-block";
  }
}

function FF_forceResumeAudio(){
  if(FFSound.ctx){
    FFSound.ctx.resume().then(()=>{
      let btn = document.getElementById("ff-force-audio");
      if(btn) btn.style.display = "none";
      console.log("Audio resumed manually.");
    });
  }
}

// ---------------------------------------------------------
// MEMORY ENGINE
// ---------------------------------------------------------

var FFMemory = {
  localKey: "ff-memory-local",

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

  persistCycle: async function(){
    var snapshot = this.captureFromDOM();
    this.saveLocal(snapshot);
    FFLog("Memory: local snapshot saved.");
  }
};

// ---------------------------------------------------------
// MEMORY TAB RENDERING
// ---------------------------------------------------------

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

function FFMemory_load(){
  var local = FFMemory.loadLocal();
  FFMemory_renderSessions(local, document.getElementById("ff-memory-sessions"));
}

// ---------------------------------------------------------
// CHAMBER SWITCHING
// ---------------------------------------------------------

function switchChamber(id){
  FFState.chamber = id;
  document.querySelectorAll(".ff-chamber").forEach(c=>{
    c.classList.remove("ff-active");
  });
  var target = document.getElementById("ff-chamber-" + id);
  if(target) target.classList.add("ff-active");
}

// ---------------------------------------------------------
// INIT
// ---------------------------------------------------------

window.onload = function(){

  var soundBtn = document.getElementById("ff-sound-toggle");
  if(soundBtn){
    soundBtn.onclick = function(){
      FFSound.toggle();
    };
  }

  var forceBtn = document.getElementById("ff-force-audio");
  if(forceBtn){
    forceBtn.onclick = FF_forceResumeAudio;
  }

  document.addEventListener("click", FF_checkAudioState);

  document.querySelectorAll(".ff-console-tab").forEach(tab=>{
    tab.onclick = function(){
      var name = this.dataset.tab;

      document.querySelectorAll(".ff-console-panel").forEach(p=>p.classList.remove("ff-active"));
      document.querySelectorAll(".ff-console-tab").forEach(t=>t.classList.remove("ff-active"));

      this.classList.add("ff-active");
      var panel = document.getElementById("ff-panel-" + name);
      if(panel) panel.classList.add("ff-active");

      if(name === "memory"){
        FFMemory_load();
      }
    };
  });

  document.querySelectorAll(".ff-next").forEach(btn=>{
    btn.onclick = function(){
      var next = this.dataset.next;
      if(next){
        switchChamber(next);
        FFSound.playEvent("chamber-shift");
      }
    };
  });

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

  switchChamber("baseline");

  var last = FFMemory.loadLocal();
  if(last){
    FFLog("Memory: local snapshot from " + last.timestamp);
  }
};
