// Shared symbolic glyph rules. A catalogue ID determines decorative markings;
// they are not observations of surface structures or stellar radii.
export function glyphAngle(id){
 let hash=2166136261;for(const ch of String(id)){hash=Math.imul(hash^ch.codePointAt(0),16777619)}
 return (hash>>>0)%360;
}
export const stellarFragment=`
 float radius=length(gl_PointCoord-vec2(.5))*2.0;
 if(radius>1.0)discard;
 vec2 uv=(gl_PointCoord-vec2(.5))*2.0;
 float disc=1.0-smoothstep(.72,.76,radius);
 float rim=sqrt(max(0.0,1.0-radius*radius));
 float detail=sin(uv.x*17.0+seed)*sin(uv.y*19.0-seed*.7)*.11+sin((uv.x+uv.y)*31.0+seed)*.04;
 float surface=clamp(.58+.26*rim+detail,.24,1.0);
 float halo=(1.0-smoothstep(.74,1.0,radius))*.18;
 vec3 tint=mix(vColor*.58,vColor*1.18,surface);
 gl_FragColor=vec4(tint,fade*(disc*.88+halo*(1.0-disc))*(.65+.35*vBrightness));
`;
