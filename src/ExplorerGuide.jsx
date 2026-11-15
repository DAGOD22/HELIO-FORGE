import React from 'react';
export default function ExplorerGuide({galaxy=false}){
 return <details className="explore-guide"><summary>Guide</summary><div className="explore-guide-card"><b>{galaxy?'Find your way around':'Explore and discover'}</b><p>{galaxy?'Use Catalogue to find nearby stars, deep-sky objects and the six curated planetary systems. Details opens the selected profile.':'Use Objects to choose a world, Details for its facts, and Planets for quick selection. Select Earth’s profile to start an observation mission.'}</p><p>Drag to {galaxy?'rotate or pan':'rotate or pan'}, use + and − to zoom, and open display settings for 2D mode. {galaxy?'The galaxy is illustrative; catalogues are incomplete.':'Positions and appearances are approximations.'}</p></div></details>
}
