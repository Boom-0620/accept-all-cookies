/* Original eight-bar toy-box score. No samples, uploads or network requests. */
(() => {
  'use strict';
  const BPM = 116;
  const MELODY = [
    [76,79,0,84,81,79,76,0], [81,0,76,79,81,84,83,0],
    [77,81,0,84,86,84,81,77], [79,0,83,86,83,81,79,0],
    [88,0,86,84,79,81,84,0], [81,84,88,86,84,81,79,76],
    [77,0,81,84,81,79,77,0], [79,83,86,83,79,76,72,0]
  ];
  const ROOTS = [48,45,41,43,48,45,41,43];
  const CHORDS = [[60,64,67],[57,60,64],[57,60,65],[59,62,67],
    [60,64,67],[57,60,64],[57,60,65],[59,62,67]];
  const frequency = note => 440 * Math.pow(2,(note-69)/12);
  window.OreoMusic = Object.freeze({
    create(context, destination) {
      const bus=context.createGain();bus.gain.value=.68;bus.connect(destination);
      const active=new Set();let timer=null,running=false,disposed=false,step=0,nextTime=0;
      function voice(at,duration,hz,gain,type='sine',endHz=hz) {
        if(disposed)return;
        const osc=context.createOscillator(),env=context.createGain();
        osc.type=type;osc.frequency.setValueAtTime(hz,at);
        if(endHz!==hz)osc.frequency.exponentialRampToValueAtTime(endHz,at+duration);
        env.gain.setValueAtTime(.0001,at);
        env.gain.exponentialRampToValueAtTime(gain,at+.008);
        env.gain.exponentialRampToValueAtTime(.0001,at+duration);
        osc.connect(env);env.connect(bus);
        const note={osc,env};active.add(note);
        osc.onended=()=>{active.delete(note);osc.disconnect();env.disconnect();};
        osc.start(at);osc.stop(at+duration+.02);
      }
      function mallet(note,at,accent=1) {
        if(!note)return;
        const hz=frequency(note);
        voice(at,.31,hz,.31*accent,'sine');
        voice(at,.105,hz*2.76,.045*accent,'sine');
        voice(at,.16,hz,.035*accent,'triangle');
      }
      function beat(index,at) {
        const bar=Math.floor(index/8)%8,pulse=index%8;
        mallet(MELODY[bar][pulse],at,pulse%2?.82:1);
        if(pulse===0||pulse===4)voice(at,.23,frequency(ROOTS[bar]+(pulse===4?7:0)),.3,'triangle');
        if(pulse===2||pulse===6)for(const note of CHORDS[bar])voice(at,.13,frequency(note),.065,'triangle');
        if(pulse%2===1)voice(at,.032,1250,.055,'sine',560);
      }
      function pump() {
        if(!running||disposed)return;
        if(context.state==='running') {
          const now=context.currentTime;
          if(nextTime<now)nextTime=now+.035;
          while(nextTime<now+.18) {
            beat(step,nextTime);
            nextTime+=(60/BPM/2)*(step%2?.88:1.12); // Slight toy-march swing.
            step=(step+1)%64;
          }
        }
        timer=setTimeout(pump,65);
      }
      function haltNotes() {
        for(const {osc,env} of active){try{osc.stop();osc.disconnect();env.disconnect();}catch(_) {}}
        active.clear();
      }
      function cancelLoop() {running=false;if(timer!==null)clearTimeout(timer);timer=null;}
      return Object.freeze({
        start(){if(running||disposed)return;running=true;step=0;nextTime=context.currentTime+.04;pump();},
        finish(){
          if(disposed||!running)return;
          cancelLoop();haltNotes();
          const at=context.currentTime+.02;
          [79,83,84].forEach((note,i)=>mallet(note,at+i*.11,.8));
          voice(at+.22,.4,frequency(48),.22,'triangle');
        },
        stop(){if(disposed)return;cancelLoop();haltNotes();bus.disconnect();disposed=true;},
        getState:()=>({running,activeVoices:active.size,disposed,bpm:BPM})
      });
    }
  });
})();
