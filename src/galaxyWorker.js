import {schematicGalaxy} from './galaxyModel';
// Synthetic particles add visual density; none are catalog entries or systems.
self.onmessage=event=>{const count=event.data.count;if(!Number.isInteger(count)||count<1||count>1200000)return;const data=schematicGalaxy(count);self.postMessage(data,[data.positions.buffer,data.colors.buffer]);};
