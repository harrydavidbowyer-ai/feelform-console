window.onload = function(){

  // FEELFORM OS STATE
  var FFState = {
    current: "baseline",
    history: [],
    pipeline: [
      "baseline",
      "threshold",
      "pulse",
      "somatic",
      "reflection",
      "decision",
      "identity",
      "ritual"
    ],
    index: 0
  };

  // CONSOLE LOGGER
  function FFLog(msg){
    var log = document.getElementById("ff-log");
    if(!log) return;
    var entry = document.createElement("div");
    entry.className = "ff-console-log-entry";
    entry.textContent = msg;
    log.prepend(entry);
  }

  // SOUND ENGINE (hybrid: synthetic + sampled)
  var audioCtx = null;
  function ensureAudioCtx(){
    if(!audioCtx){
      try{
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }catch(e){}
    }
  }

  var FFSound = {
    enabled: true,
    setEnabled: function(on){
      this.enabled = !!on;
      try{
        localStorage.setItem("ff-sound-enabled", this.enabled ? "1" : "0");
      }catch(e){}
    },
    loadPreference: function(){
      try{
        var v = localStorage.getItem("ff-sound-enabled");
        if(v === "0") this.enabled = false;
        if(v === "1") this.enabled = true;
      }catch(e){}
    },
    playTone: function(freq, dur){
      if(!this.enabled) return;
      ensureAudioCtx();
      if(!audioCtx) return;
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.12;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      setTimeout(function(){
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
        osc.stop(audioCtx.currentTime + 0.16);
      }, dur || 120);
    },
    playSample: function(id){
      if(!this.enabled) return;
      var el = document.getElementById(id);
      if(!el) return;
      el.currentTime = 0;
      el.volume = 0.35;
      el.play().catch(function(){});
    },
    playEvent: function(name){
      if(!this.enabled) return;
      switch(name){
        case "baseline-arrive":
          this.playTone(180, 140);
          break;
        case "threshold-cross":
          this.playTone(260, 180);
          break;
        case "pulse-type":
          this.playTone(420, 60);
          break;
        case "somatic-move":
          this.playTone(120, 80);
          break;
        case "reflection-distill":
          this.playSample("snd-reflection");
          break;
        case "decision-eval":
          this.playSample("snd-decision");
          break;
        case "identity-affirm":
          this.playSample("snd-identity");
          break;
        case "ritual-complete":
          this.playSample("snd-ritual");
          break;
        case "transition":
          this.playTone(220, 80);
          break;
      }
    }
  };

  FFSound.loadPreference();

  // ENGINES
  var FFEngines = {

    reflection(input){
      input = input || "";
      var insight = "";
      if(input.trim().length > 0){
        insight = "You’re noticing: " + input.trim();
      } else {
        insight = "No reflection entered.";
      }
      FFLog("Reflection Engine processed " + input.length + " chars");
      return insight;
    },

    decision(a, b){
      a = a || "";
      b = b || "";
      var out = "";
      if(a && !b) out = "Path A is clearer.";
      else if(b && !a) out = "Path B is clearer.";
      else if(a && b) out = "Both paths hold weight. Choose the one that feels lighter.";
      else out = "No decision entered.";
      FFLog("Decision Engine evaluated A/B");
      return out;
    },

    identity(input){
      input = input || "";
      var out = "";
      if(input.trim().length > 0){
        out = "You are becoming someone who " + input.trim();
      } else {
        out = "Identity not yet articulated.";
      }
      FFLog("Identity Engine synthesized identity");
      return out;
    },

    ritual(step){
      FFLog("Ritual Engine advanced to step " + step);
      return "Step " + step + " acknowledged.";
    }

  };

  // CONSOLE TOGGLE + SOUND TOGGLE
  var toggle = document.getElementById("ff-console-toggle");
  var panel = document.getElementById("ff-console");
  var soundToggle = document.getElementById("ff-sound-toggle");

  toggle.onclick = function(){
    if(panel.className.indexOf("is-open")>-1){
      panel.className = "ff-console";
    } else {
      panel.className = "ff-console is-open";
    }
  };

  function refreshSoundToggle(){
    if(!soundToggle) return;
    if(FFSound.enabled){
      soundToggle.className = "ff-sound-toggle is-on";
      soundToggle.textContent = "ON";
    }else{
      soundToggle.className = "ff-sound-toggle";
      soundToggle.textContent = "OFF";
    }
  }
  refreshSoundToggle();

  soundToggle.onclick = function(){
    FFSound.setEnabled(!FFSound.enabled);
    refreshSoundToggle();
    FFSound.playEvent("transition");
  };

  // CHAMBERS + NAV
  var chambers = ["baseline","threshold","pulse","somatic","reflection","decision","identity","ritual"];
  var chamberEls = {};
  var navEls = {};

  for(var i=0;i<chambers.length;i++){
    var id = chambers[i];
    chamberEls[id] = document.getElementById("ch-" + id);
    navEls[id] = document.getElementById("nav-" + id);
  }

  // directional map for subtle hybrid transitions
  var transitionMap = {
    baseline: { enter:null,          exit:null },
    threshold:{ enter:"forward",     exit:"backward" },
    pulse:    { enter:"up",          exit:"down" },
    somatic:  { enter:"down",        exit:"up" },
    reflection:{enter:"inward",      exit:"outward" },
    decision: { enter:"outward",     exit:"inward" },
    identity: { enter:"expand",      exit:"contract" },
    ritual:   { enter:"ritual-enter",exit:"ritual-exit" }
  };

  var currentChamber = "baseline";
  var isTransitioning = false;
  var transitionGap = 140; // liminal pause (ms)

  function applyDirectionClass(el, mode, chamberKey){
    var cfg = transitionMap[chamberKey];
    if(!cfg) return;
    var dir = cfg[mode];
    if(!dir) return;

    var base = "ff-chamber";

    if(mode === "enter"){
      if(dir === "forward")        el.className = base + " ff-chamber--enter-forward";
      else if(dir === "backward") el.className = base + " ff-chamber--exit-backward";
      else if(dir === "up")       el.className = base + " ff-chamber--enter-up";
      else if(dir === "down")     el.className = base + " ff-chamber--enter-down";
      else if(dir === "inward")   el.className = base + " ff-chamber--enter-inward";
      else if(dir === "outward")  el.className = base + " ff-chamber--exit-outward";
      else if(dir === "expand")   el.className = base + " ff-chamber--enter-expand";
      else if(dir === "contract") el.className = base + " ff-chamber--exit-contract";
      else if(dir === "ritual-enter") el.className = base + " ff-chamber--ritual-enter";
    } else {
      if(dir === "forward")        el.className = base + " ff-chamber--enter-forward";
      else if(dir === "backward") el.className = base + " ff-chamber--exit-backward";
      else if(dir === "up")       el.className = base + " ff-chamber--exit-up";
      else if(dir === "down")     el.className = base + " ff-chamber--exit-down";
      else if(dir === "inward")   el.className = base + " ff-chamber--enter-inward";
      else if(dir === "outward")  el.className = base + " ff-chamber--exit-outward";
      else if(dir === "expand")   el.className = base + " ff-chamber--enter-expand";
      else if(dir === "contract") el.className = base + " ff-chamber--exit-contract";
      else if(dir === "ritual-exit") el.className = base + " ff-chamber--ritual-exit";
    }
  }

  function switchChamber(target){
    if(isTransitioning || target === currentChamber) return;
    isTransitioning = true;

    var from = currentChamber;
    var to   = target;

    FFLog("Transition: " + from + " → " + to);
    FFSound.playEvent("transition");

    FFState.history.push(from);
    FFState.current = to;
    FFState.index = FFState.pipeline.indexOf(to);

    var fromEl = chamberEls[from];
    var toEl   = chamberEls[to];

    // exit current
    applyDirectionClass(fromEl, "exit", from);
    fromEl.className += " is-active";

    setTimeout(function(){

      // hide old
      fromEl.className = "ff-chamber";

      // prepare incoming
      applyDirectionClass(toEl, "enter", to);

      setTimeout(function(){
        toEl.className += " is-active";
        currentChamber = to;

        // update nav
        for(var j=0;j<chambers.length;j++){
          var cid = chambers[j];
          navEls[cid].className = "ff-nav-glyph";
        }
        navEls[to].className = "ff-nav-glyph is-active";

        FFLog("Pipeline index: " + FFState.index + " / " + (FFState.pipeline.length - 1));

        // ENGINE HOOKS
        if(to === "reflection"){
          var rIn = document.getElementById("ff-reflect-input");
          var rOut = document.getElementById("ff-reflect-output");
          if(rIn && rOut && rIn.value){
            rOut.textContent = FFEngines.reflection(rIn.value);
          }
        }

        if(to === "decision"){
          var aEl = document.getElementById("ff-decision-a");
          var bEl = document.getElementById("ff-decision-b");
          var dOut = document.getElementById("ff-decision-output");
          if(aEl && bEl && dOut && (aEl.value || bEl.value)){
            dOut.textContent = FFEngines.decision(aEl.value, bEl.value);
          }
        }

        if(to === "identity"){
          var iEl = document.getElementById("ff-identity-input");
          var iOut = document.getElementById("ff-identity-output");
          if(iEl && iOut && iEl.value){
            iOut.textContent = FFEngines.identity(iEl.value);
          }
        }

        if(to === "ritual"){
          var step = FFState.index + 1;
          var rSub = document.getElementById("ff-ritual-sub");
          if(rSub){
            rSub.textContent = FFEngines.ritual(step);
          }
        }

        isTransitioning = false;

      }, 10);

    }, transitionGap);
  }

  // nav bindings
  for(var k=0;k<chambers.length;k++){
    (function(ch){
      navEls[ch].onclick = function(){
        switchChamber(ch);
      };
    })(chambers[k]);
  }

  // TIMING DOTS
  var pulseDot = document.getElementById("timing-pulse");
  var driftDot = document.getElementById("timing-drift");
  var pulseOn = false;
  var driftOn = false;

  setInterval(function(){
    pulseOn = !pulseOn;
    driftOn = !driftOn;

    if(pulseDot){
      pulseDot.className = pulseOn ? "ff-console-timing-dot is-on" : "ff-console-timing-dot";
    }
    if(driftDot){
      driftDot.className = driftOn ? "ff-console-timing-dot is-on" : "ff-console-timing-dot";
    }

  },1000);

  // INITIAL STATE
  switchChamber("baseline");

  // CINEMATIC INTERACTIONS

  // Baseline: arrival button
  var baselineBtn = document.getElementById("ff-baseline-arrive");
  if(baselineBtn){
    baselineBtn.onclick = function(){
      FFLog("Arrival acknowledged.");
      FFSound.playEvent("baseline-arrive");
      switchChamber("threshold");
    };
  }

  // Threshold: drag bar
  var thresholdBar = document.getElementById("ff-threshold-bar");
  var thresholdHandle = document.getElementById("ff-threshold-handle");
  var dragging = false;
  var barRect = null;

  function startDrag(e){
    dragging = true;
    barRect = thresholdBar.getBoundingClientRect();
    e.preventDefault();
  }
  function moveDrag(e){
    if(!dragging) return;
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var rel = (clientX - barRect.left) / barRect.width;
    if(rel < 0) rel = 0;
    if(rel > 1) rel = 1;
    thresholdHandle.style.left = (rel * 100) + "%";
    if(rel > 0.96){
      dragging = false;
      thresholdBar.className = "ff-threshold-bar ff-crossed";
      FFLog("Threshold crossed.");
      FFSound.playEvent("threshold-cross");
      setTimeout(function(){
        switchChamber("pulse");
      }, 220);
    }
  }
  function endDrag(){
    dragging = false;
  }

  if(thresholdHandle && thresholdBar){
    thresholdHandle.addEventListener("mousedown", startDrag);
    thresholdHandle.addEventListener("touchstart", startDrag, {passive:false});
    window.addEventListener("mousemove", moveDrag);
    window.addEventListener("touchmove", moveDrag, {passive:false});
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchend", endDrag);
  }

  // Pulse: orb reacts to typing
  var pulseInput = document.getElementById("ff-pulse-input");
  var pulseOrb = document.getElementById("ff-pulse-orb");
  if(pulseInput && pulseOrb){
    pulseInput.addEventListener("input", function(){
      var len = (pulseInput.value || "").length;
      if(len > 0){
        pulseOrb.className = "ff-pulse-orb ff-pulse-strong";
        FFSound.playEvent("pulse-type");
      }else{
        pulseOrb.className = "ff-pulse-orb";
      }
      FFLog("Pulse registered: " + (pulseInput.value || "").slice(0,80));
    });
  }

  // Somatic: slider + body map
  var somLoc = document.getElementById("ff-somatic-location");
  var somInt = document.getElementById("ff-somatic-intensity");
  var somOut = document.getElementById("ff-somatic-output");

  function updateSomatic(){
    if(!somOut) return;
    var loc = somLoc ? somLoc.value : "";
    var val = somInt ? somInt.value : "0";
    if(loc){
      somOut.textContent = "Somatic intensity: " + val + " (" + loc + ")";
    }else{
      somOut.textContent = "Somatic intensity: " + val;
    }
    FFSound.playEvent("somatic-move");
    FFLog("Somatic intensity: " + val + (loc ? " ("+loc+")" : ""));
  }

  if(somLoc) somLoc.addEventListener("change", updateSomatic);
  if(somInt) somInt.addEventListener("input", updateSomatic);

  // Reflection: Distill button
  var refBtn = document.getElementById("ff-reflect-distill");
  if(refBtn){
    refBtn.onclick = function(){
      var rIn = document.getElementById("ff-reflect-input");
      var rOut = document.getElementById("ff-reflect-output");
      if(rIn && rOut){
        rOut.textContent = FFEngines.reflection(rIn.value || "");
        FFSound.playEvent("reflection-distill");
        FFLog("Reflection distilled.");
      }
    };
  }

  // Decision: Evaluate button
  var decBtn = document.getElementById("ff-decision-eval");
  if(decBtn){
    decBtn.onclick = function(){
      var aEl = document.getElementById("ff-decision-a");
      var bEl = document.getElementById("ff-decision-b");
      var dOut = document.getElementById("ff-decision-output");
      if(aEl && bEl && dOut){
        dOut.textContent = FFEngines.decision(aEl.value, bEl.value);
        FFSound.playEvent("decision-eval");
        FFLog("Decision evaluated.");
      }
    };
  }

  // Identity: Affirm button
  var idBtn = document.getElementById("ff-identity-affirm");
  if(idBtn){
    idBtn.onclick = function(){
      var iEl = document.getElementById("ff-identity-input");
      var iOut = document.getElementById("ff-identity-output");
      if(iEl && iOut){
        iOut.textContent = FFEngines.identity(iEl.value || "");
        FFSound.playEvent("identity-affirm");
        FFLog("Identity affirmed.");
      }
    };
  }

  // Ritual: Complete cycle
  var ritualBtn = document.getElementById("ff-ritual-complete");
  var ritualGlow = document.getElementById("ff-ritual-glow");
  if(ritualBtn){
    ritualBtn.onclick = function(){
      var step = FFState.index + 1;
      var rSub = document.getElementById("ff-ritual-sub");
      if(rSub){
        rSub.textContent = FFEngines.ritual(step);
      }
      if(ritualGlow){
        ritualGlow.className = "ff-ritual-glow ff-on";
      }
      FFSound.playEvent("ritual-complete");
      FFLog("Cycle completed. Returning to Baseline.");
      setTimeout(function(){
        if(ritualGlow){
          ritualGlow.className = "ff-ritual-glow";
        }
        switchChamber("baseline");
      }, 1200);
    };
  }

};
