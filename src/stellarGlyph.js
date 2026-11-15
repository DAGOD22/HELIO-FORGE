// Shared symbolic glyph rules. A catalogue ID determines decorative markings;
// they are not observations of surface structures or stellar radii.
export function glyphAngle(id){
 let hash=2166136261;for(const ch of String(id)){hash=Math.imul(hash^ch.codePointAt(0),16777619)}
 return (hash>>>0)%360;
}
export const stellarFragment=`
 vec2 uv=(gl_PointCoord-vec2(.5))*2.0;float radius=length(uv);
 if(radius>1.0)discard;
 float disc=1.0-smoothstep(.66,.72,radius);
 float limb=sqrt(max(0.0,1.0-radius*radius));
 float flow=sin(uv.x*19.0+sin(uv.y*13.0+seed)*1.7+seed)*sin(uv.y*22.0-seed);
 float grain=sin(uv.x*43.0+uv.y*19.0+seed)*sin(uv.y*47.0-uv.x*11.0);
 float surface=clamp(.53+.3*limb+.12*flow+.045*grain,.18,1.0);
 float halo=exp(-max(0.0,radius-.65)*11.0)*.27;
 vec3 tint=mix(vColor*.52,vColor*1.22,surface);
 gl_FragColor=vec4(tint,fade*(disc*.91+halo*(1.0-disc))*(.68+.32*vBrightness));
`;
