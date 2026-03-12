window.onload = function(){

  var toggle = document.getElementById("ff-console-toggle");
  var panel = document.getElementById("ff-console");

  if(toggle){
    toggle.onclick = function(){
      if(panel.className.indexOf("is-open")>-1){
        panel.className = "ff-console";
      } else {
        panel.className = "ff-console is-open";
      }
    };
  }

  var chambers = ["baseline","threshold","pulse","somatic","reflection","decision","identity","ritual"];
  var navMap = document.getElementById("ff-nav-map");
  var dots = {};
  var i;

  if(navMap){
    for(i=0;i<chambers.length;i++){
      var d = document.createElement("div");
      d.className = "ff-console-nav-dot";
      navMap.appendChild(d);
      dots[chambers[i]] = d;
    }
  }

  var logEl = document.getElementById("ff-log");
  var log = [];

  function addLog(msg){
    log.unshift(msg);
    if(log.length>40){ log.pop(); }
    var html = "";
    for(var j=0;j<log.length;j++){
      html += "<div class='ff-console-log-entry'>" + log[j] + "</div>";
    }
    if(logEl){ logEl.innerHTML = html; }
  }

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

    if(dots["baseline"]){
      dots["baseline"].className = pulseOn ? "ff-console-nav-dot is-active" : "ff-console-nav-dot";
    }

    addLog("heartbeat");

  },1000);

};
