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

  // CONSOLE TOGGLE
  var toggle = document.getElementById("ff-console-toggle");
  var panel = document.getElementById("ff-console");

  toggle.onclick = function(){
    if(panel.className.indexOf("is-open")>-1){
      panel.className = "ff-console";
    } else {
      panel.className = "ff-console is-open";
    }
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
          if(rIn && rOut){
            var rVal = rIn.value || "";
            rOut.textContent = FFEngines.reflection(rVal);
          }
        }

        if(to === "decision"){
          var aEl = document.getElementById("ff-decision-a");
          var bEl = document.getElementById("ff-decision-b");
          var dOut = document.getElementById("ff-decision-output");
          if(aEl && bEl && dOut){
            dOut.textContent = FFEngines.decision(aEl.value, bEl.value);
          }
        }

        if(to === "identity"){
          var iEl = document.getElementById("ff-identity-input");
          var iOut = document.getElementById("ff-identity-output");
          if(iEl && iOut){
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

  // initial state
  switchChamber("baseline");

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

};
