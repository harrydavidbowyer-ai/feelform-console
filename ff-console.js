window.onload = function(){

  var toggle = document.getElementById("ff-console-toggle");
  var panel = document.getElementById("ff-console");

  toggle.onclick = function(){
    if(panel.className.indexOf("is-open")>-1){
      panel.className = "ff-console";
    } else {
      panel.className = "ff-console is-open";
    }
  };

  var chambers = ["baseline","threshold","pulse","somatic","reflection","decision","identity","ritual"];
  var chamberEls = {};
  var navEls = {};

  for(var i=0;i<chambers.length;i++){
    var id = chambers[i];
    chamberEls[id] = document.getElementById("ch-" + id);
    navEls[id] = document.getElementById("nav-" + id);
  }

  function switchChamber(target){
    for(var j=0;j<chambers.length;j++){
      var cid = chambers[j];
      chamberEls[cid].className = "ff-chamber";
      navEls[cid].className = "ff-nav-glyph";
    }
    chamberEls[target].className = "ff-chamber is-active";
    navEls[target].className = "ff-nav-glyph is-active";
  }

  for(var k=0;k<chambers.length;k++){
    (function(ch){
      navEls[ch].onclick = function(){
        switchChamber(ch);
      };
    })(chambers[k]);
  }

  switchChamber("baseline");

  var pulseDot = document.getElementById("timing-pulse");
  var driftDot = document.getElementById("timing-drift");
  var pulseOn = false;
  var driftOn = false;

  setInterval(function(){
    pulseOn = !pulseOn;
    driftOn = !driftOn;

    pulseDot.className = pulseOn ? "ff-console-timing-dot is-on" : "ff-console-timing-dot";
    driftDot.className = driftOn ? "ff-console-timing-dot is-on" : "ff-console-timing-dot";

  },1000);

};
