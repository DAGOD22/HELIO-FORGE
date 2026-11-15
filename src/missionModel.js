// An intentionally simplified educational trade model. Values are game assumptions,
// not estimates for any real spacecraft or launch contract.
// NASA Earth Fact Sheet: mean radius 6,371 km; GM 398,600.4 km³/s.
export const EARTH_RADIUS_KM=6371, EARTH_GM_KM3_S2=398600.4;
export const OBJECTIVES={
 fire:{name:'Track wildfires',question:'How can we spot heat signatures as fires develop?',instrument:'thermal',orbit:'polar',target:2,budget:30},
 ocean:{name:'Watch coastal waters',question:'How can we monitor changing coastal ecosystems?',instrument:'multispectral',orbit:'polar',target:3,budget:30},
 air:{name:'Measure the atmosphere',question:'How can we follow changes in atmospheric composition?',instrument:'spectrometer',orbit:'mid',target:1.5,budget:30},
};
export const OPTIONS={
 orbit:{polar:{name:'Sun-synchronous polar',detail:'Consistent lighting; less daily contact.',sun:.62,contact:.75,altitude:500},mid:{name:'Mid-inclination LEO',detail:'More ground access; variable lighting.',sun:.68,contact:1,altitude:500}},
 bus:{compact:{name:'Compact bus',detail:'Light, economical; 12-month design life.',mass:8,cost:5,power:9,battery:30,storage:8,life:12},extended:{name:'Extended bus',detail:'More storage and battery; 24-month design life.',mass:16,cost:9,power:12,battery:60,storage:20,life:24}},
 instrument:{thermal:{name:'Thermal imager',detail:'Heat signatures · 2 GB/day',mass:4,cost:5,power:7,data:2},multispectral:{name:'Multispectral camera',detail:'Land and ocean colour · 3 GB/day',mass:5,cost:6,power:9,data:3},spectrometer:{name:'Atmospheric spectrometer',detail:'Composition · 1.5 GB/day',mass:4,cost:6,power:8,data:1.5}},
 solar:{body:{name:'Body-mounted panels',detail:'Lower mass and cost · 28 W in sunlight',mass:2,cost:2,watts:28},deploy:{name:'Deployable arrays',detail:'More power, mass and cost · 48 W in sunlight',mass:4,cost:4,watts:48}},
 radio:{low:{name:'Low-rate radio',detail:'Efficient · 1.2 GB/day before orbit & ground factors',mass:1,cost:1,power:2,capacity:1.2},high:{name:'High-rate radio',detail:'More data, power and cost · 4 GB/day before factors',mass:3,cost:3,power:5,capacity:4}},
 ground:{single:{name:'Single ground station',detail:'Fewer contacts · 1× capacity',cost:2,factor:1},network:{name:'Ground station network',detail:'More contacts · 1.6× capacity',cost:5,factor:1.6}},
 launch:{rideshare:{name:'Rideshare',detail:'Lower cost · 25 kg capacity',cost:3,capacity:25},dedicated:{name:'Dedicated small launch',detail:'More capacity · 40 kg capacity',cost:7,capacity:40}},
 duration:{12:{name:'12 months',detail:'Shorter campaign · $2M operations',months:12,cost:2},24:{name:'24 months',detail:'More science time · $4M operations',months:24,cost:4}},
};
export const DEFAULT_DESIGN={objective:'fire',orbit:'polar',bus:'compact',instrument:'thermal',solar:'deploy',radio:'high',ground:'single',launch:'rideshare',duration:'12'};
export function calculate(design){
 if(!design||!Object.hasOwn(OBJECTIVES,design.objective)||Object.keys(OPTIONS).some(key=>!Object.hasOwn(OPTIONS[key],design[key]))) throw new Error('Invalid mission design');
 const objective=OBJECTIVES[design.objective];
 const parts=Object.fromEntries(Object.keys(OPTIONS).map(key=>[key,OPTIONS[key][design[key]]]));
 const {bus,instrument,solar,radio,ground,launch,orbit,duration}=parts;
 const mass=bus.mass+instrument.mass+solar.mass+radio.mass;
 const cost=bus.cost+instrument.cost+solar.cost+radio.cost+ground.cost+launch.cost+duration.cost;
 const load=bus.power+instrument.power+radio.power;
 const averagePower=solar.watts*orbit.sun;
 // Circular two-body period; all loads run through the assumed eclipse fraction.
 const periodHours=2*Math.PI*Math.sqrt((EARTH_RADIUS_KM+orbit.altitude)**3/EARTH_GM_KM3_S2)/3600;
 const eclipseWh=load*periodHours*(1-orbit.sun);
 return {objective,parts,mass,cost,load,averagePower,periodHours,eclipseWh,downlink:radio.capacity*ground.factor*orbit.contact,canLaunch:mass<=launch.capacity&&cost<=objective.budget};
}
export function simulate(design, decisions={}){
 const solarDecision=decisions.solar==='conserve'?'conserve':'push';
 const contactDecision=decisions.contacts==='conserve'?'conserve':'push';
 const c=calculate(design),{bus,instrument,solar,orbit,duration}=c.parts;
 if(!c.canLaunch)return {...c,launched:false};
 let stored=0,returned=0,lost=0,produced=0;
 const timeline=[];
 // Each month has 30 identical days. Events are deterministic, not probabilities.
 for(let month=1;month<=duration.months;month++){
  if(month>bus.life){timeline.push({month,returned:0,stored,lost:0,power:0,cumulativeReturned:returned,cumulativeLost:lost,cumulativeProduced:produced,event:month===bus.life+1?'Design life exceeded: spacecraft retired.':null});continue;}
  const generation=solar.watts*orbit.sun*(month>=4?(solarDecision==='conserve'?.9:.8):1);
  // Bus and radio are prioritized; science is reduced by energy or eclipse battery shortage.
  const sciencePower=Math.max(0,Math.min(1,(generation-bus.power-c.parts.radio.power)/instrument.power));
  const batteryFactor=Math.min(1,bus.battery/c.eclipseWh);
  const availability=Math.min(1,generation/(bus.power+c.parts.radio.power),batteryFactor);
  const duty=Math.min(month>=4&&solarDecision==='conserve'?.75:1,month===7&&contactDecision==='conserve'?.5:1);
  const energyPower=Math.min(sciencePower,batteryFactor);
  const power=Math.min(energyPower,duty);
  let monthReturn=0,monthLoss=0;
  for(let day=0;day<30;day++){
   const made=instrument.data*power; produced+=made; stored+=made;
   const overflow=Math.max(0,stored-bus.storage);lost+=overflow;monthLoss+=overflow;stored-=overflow;
   const sent=Math.min(stored,c.downlink*availability*(month===7?.5:1));stored-=sent;returned+=sent;monthReturn+=sent;
  }
  timeline.push({month,returned:monthReturn,stored,lost:monthLoss,power,energyPower,duty,cumulativeReturned:returned,cumulativeLost:lost,cumulativeProduced:produced,event:month===4?(solarDecision==='conserve'?'Solar output reduced 10%; science duty capped at 75%.':'Solar output reduced 20% for the rest of the mission.'):month===7?(contactDecision==='conserve'?'Ground contacts halved; science duty capped at 50% this month.':'Ground contacts halved this month.'):null});
 }
 const fit=design.instrument===c.objective.instrument?1:0;
 const orbitFit=design.orbit===c.objective.orbit?1:.7;
 const target=c.objective.target*30*duration.months;
 const score=Math.round(100*Math.min(1,returned/target)*fit*orbitFit);
 const advice=[];
 if(!fit)advice.push('Choose the instrument matched to your science objective; the current payload cannot answer the question in this model.');
 if(orbitFit<1)advice.push('Try the recommended orbit for this objective to improve observation quality.');
 if(c.averagePower<c.load||timeline.some(t=>t.energyPower<.99&&t.month<=bus.life))advice.push('Science was power-limited. Try deployable arrays or reduce the load.');
 if(c.eclipseWh>bus.battery)advice.push('Eclipse energy exceeds battery capacity. Try the extended bus or a lower-power design.');
 if(timeline.some(t=>t.duty<.99&&t.power===t.duty))advice.push('Your operating choices reduced collection to protect the array or avoid overflow. Compare another response to see the trade-off.');
 if(lost>1)advice.push('Storage overflow discarded data. Increase downlink capacity or onboard storage.');
 if(duration.months>bus.life)advice.push('The selected campaign exceeds bus design life. Choose the extended bus or a shorter campaign.');
 if(!advice.length)advice.push('This design met its modeled constraints. Try reducing cost or testing a different objective.');
 return {...c,launched:true,decisions:{solar:solarDecision,contacts:contactDecision},score,returned,produced,lost,stored,target,fit,orbitFit,timeline,advice};
}
