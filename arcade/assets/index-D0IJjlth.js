import{j as i,S as W,c as g,r as h}from"./index-DlycF9-D.js";import{c as G,a as V}from"./index-BFiyL2bU.js";import{S as B,a as q,b as K,c as Y}from"./index-DEktp2tO.js";import{X as $}from"./x-R36eWOcz.js";import{S as J}from"./sliders-horizontal-D79Mwz_0.js";import{R as Q}from"./rotate-ccw-Sj0W5Rjh.js";import"./index-B4axmwqs.js";const Z=[["path",{d:"M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z",key:"1ptgy4"}],["path",{d:"M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97",key:"1sl1rz"}]],ee=G("droplets",Z),te=V("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-[opacity,transform,background-color,color] duration-150 ease-out outline-none focus-visible:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-primary)] disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",{variants:{variant:{primary:"bg-fg text-primary-fg hover:opacity-90",secondary:"border border-border bg-surface-2 text-fg hover:bg-surface",ghost:"text-muted hover:bg-surface-2 hover:text-fg",default:"bg-fg text-primary-fg hover:opacity-90"},size:{md:"h-11 px-4",sm:"h-9 px-3",icon:"size-11",default:"h-11 px-4"}},defaultVariants:{variant:"primary",size:"md"}});function U({className:o,variant:t,size:r,asChild:e,...s}){const l=e?W:"button";return i.jsx(l,{className:g(te({variant:t,size:r}),o),...s})}function D({label:o,value:t,min:r=0,max:e=1,step:s=.01,display:l,onValueChange:a}){return i.jsxs("label",{className:"block",children:[i.jsxs("span",{className:"mb-2 flex items-baseline justify-between gap-3",children:[i.jsx("span",{className:"text-sm font-medium text-fg",children:o}),i.jsx("span",{className:"font-mono text-xs tabular-nums text-muted",children:l??t.toFixed(2)})]}),i.jsxs(B,{className:"relative flex h-11 w-full touch-none items-center select-none",value:[t],min:r,max:e,step:s,onValueChange:c=>{const m=c[0];typeof m=="number"&&a(m)},children:[i.jsx(q,{className:"relative h-1 w-full grow overflow-hidden rounded-full bg-border",children:i.jsx(K,{className:"absolute h-full bg-fg"})}),i.jsx(Y,{className:g("block size-4 rounded-full bg-fg shadow-[0_0_0_4px_var(--color-bg)]","outline-none transition-[box-shadow,transform] duration-150 ease-out","hover:scale-105 focus-visible:shadow-[0_0_0_4px_var(--color-bg),0_0_0_6px_var(--color-primary)]"),"aria-label":o})]})]})}const k=[{id:"abyss",label:"Abyss"},{id:"thermal",label:"Thermal"},{id:"aurora",label:"Aurora"},{id:"ink",label:"Ink"},{id:"ember",label:"Ember"},{id:"ice",label:"Ice"}],x={viscosity:.32,strength:.58,colorMap:"abyss"},X="still.params.v1",T=`#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`,re=`#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform float uDamping;
uniform float uC2;
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy * uTexel;
  vec4 c = texture(uState, uv);
  float h = c.r;
  float hOld = c.g;
  float l = texture(uState, uv - vec2(uTexel.x, 0.0)).r;
  float r = texture(uState, uv + vec2(uTexel.x, 0.0)).r;
  float t = texture(uState, uv + vec2(0.0, uTexel.y)).r;
  float b = texture(uState, uv - vec2(0.0, uTexel.y)).r;
  float lap = (l + r + t + b) - 4.0 * h;
  float hNew = (2.0 * h - hOld) * uDamping + uC2 * lap;
  hNew *= 0.9992;
  hNew = clamp(hNew, -2.4, 2.4);
  fragColor = vec4(hNew, h, 0.0, 1.0);
}
`,se=`#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform vec2 uPoint;
uniform float uAmp;
uniform float uRadius;
uniform float uAspect;
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy * uTexel;
  vec4 c = texture(uState, uv);
  vec2 d = (uv - uPoint) * vec2(uAspect, 1.0);
  float g = exp(-dot(d, d) / max(uRadius * uRadius, 1e-6));
  fragColor = vec4(c.r + uAmp * g, c.g, 0.0, 1.0);
}
`,ae=`#version 300 es
precision highp float;
out vec4 fragColor;
void main() {
  fragColor = vec4(0.0);
}
`,ie=`#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform vec2 uResolution;
uniform int uColorMap;
uniform float uTime;
out vec4 fragColor;

vec3 cmapAbyss(float t) {
  vec3 deep = vec3(0.016, 0.028, 0.045);
  vec3 mid = vec3(0.06, 0.14, 0.20);
  vec3 rim = vec3(0.42, 0.62, 0.68);
  vec3 foam = vec3(0.86, 0.90, 0.92);
  if (t < 0.48) return mix(deep, mid, t / 0.48);
  if (t < 0.74) return mix(mid, rim, (t - 0.48) / 0.26);
  return mix(rim, foam, (t - 0.74) / 0.26);
}

vec3 cmapThermal(float t) {
  vec3 a = vec3(0.03, 0.02, 0.04);
  vec3 b = vec3(0.42, 0.05, 0.08);
  vec3 c = vec3(0.86, 0.32, 0.06);
  vec3 d = vec3(0.98, 0.86, 0.42);
  vec3 e = vec3(0.99, 0.97, 0.92);
  if (t < 0.28) return mix(a, b, t / 0.28);
  if (t < 0.52) return mix(b, c, (t - 0.28) / 0.24);
  if (t < 0.78) return mix(c, d, (t - 0.52) / 0.26);
  return mix(d, e, (t - 0.78) / 0.22);
}

vec3 cmapAurora(float t) {
  vec3 a = vec3(0.02, 0.04, 0.06);
  vec3 b = vec3(0.04, 0.22, 0.24);
  vec3 c = vec3(0.10, 0.55, 0.48);
  vec3 d = vec3(0.55, 0.82, 0.62);
  vec3 e = vec3(0.86, 0.94, 0.90);
  if (t < 0.3) return mix(a, b, t / 0.3);
  if (t < 0.55) return mix(b, c, (t - 0.3) / 0.25);
  if (t < 0.8) return mix(c, d, (t - 0.55) / 0.25);
  return mix(d, e, (t - 0.8) / 0.2);
}

vec3 cmapInk(float t) {
  vec3 a = vec3(0.05, 0.05, 0.045);
  vec3 b = vec3(0.16, 0.16, 0.15);
  vec3 c = vec3(0.62, 0.61, 0.58);
  vec3 d = vec3(0.93, 0.92, 0.88);
  if (t < 0.4) return mix(a, b, t / 0.4);
  if (t < 0.72) return mix(b, c, (t - 0.4) / 0.32);
  return mix(c, d, (t - 0.72) / 0.28);
}

vec3 cmapEmber(float t) {
  vec3 a = vec3(0.04, 0.025, 0.02);
  vec3 b = vec3(0.22, 0.07, 0.04);
  vec3 c = vec3(0.62, 0.22, 0.08);
  vec3 d = vec3(0.92, 0.58, 0.32);
  vec3 e = vec3(0.98, 0.90, 0.78);
  if (t < 0.3) return mix(a, b, t / 0.3);
  if (t < 0.55) return mix(b, c, (t - 0.3) / 0.25);
  if (t < 0.8) return mix(c, d, (t - 0.55) / 0.25);
  return mix(d, e, (t - 0.8) / 0.2);
}

vec3 cmapIce(float t) {
  vec3 a = vec3(0.03, 0.05, 0.08);
  vec3 b = vec3(0.08, 0.18, 0.28);
  vec3 c = vec3(0.32, 0.58, 0.70);
  vec3 d = vec3(0.78, 0.90, 0.94);
  vec3 e = vec3(0.95, 0.98, 0.99);
  if (t < 0.32) return mix(a, b, t / 0.32);
  if (t < 0.58) return mix(b, c, (t - 0.32) / 0.26);
  if (t < 0.82) return mix(c, d, (t - 0.58) / 0.24);
  return mix(d, e, (t - 0.82) / 0.18);
}

vec3 colormap(float t, int id) {
  t = clamp(t, 0.0, 1.0);
  if (id == 1) return cmapThermal(t);
  if (id == 2) return cmapAurora(t);
  if (id == 3) return cmapInk(t);
  if (id == 4) return cmapEmber(t);
  if (id == 5) return cmapIce(t);
  return cmapAbyss(t);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float h = texture(uState, uv).r;
  float hx = texture(uState, uv + vec2(uTexel.x, 0.0)).r - texture(uState, uv - vec2(uTexel.x, 0.0)).r;
  float hy = texture(uState, uv + vec2(0.0, uTexel.y)).r - texture(uState, uv - vec2(0.0, uTexel.y)).r;
  vec3 n = normalize(vec3(-hx * 10.0, -hy * 10.0, 1.0));
  vec3 light = normalize(vec3(-0.35, 0.62, 0.78));
  float ndotl = max(dot(n, light), 0.0);
  vec3 view = vec3(0.0, 0.0, 1.0);
  float spec = pow(max(dot(reflect(-light, n), view), 0.0), 42.0);
  float fres = pow(1.0 - max(n.z, 0.0), 3.0);

  float t = 0.5 + 0.5 * tanh(h * 2.1);
  vec3 base = colormap(t, uColorMap);
  vec3 col = base * (0.28 + 0.72 * ndotl);
  col += spec * vec3(0.85, 0.90, 0.94) * 0.55;
  col += fres * base * 0.22;
  col += abs(h) * 0.04;

  float grain = fract(sin(dot(gl_FragCoord.xy + uTime * 12.0, vec2(12.9898, 78.233))) * 43758.5453);
  col += (grain - 0.5) * 0.018;

  float vig = smoothstep(1.15, 0.35, length((uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0)));
  col *= mix(0.72, 1.0, vig);

  fragColor = vec4(pow(clamp(col, 0.0, 1.0), vec3(0.92)), 1.0);
}
`,oe={abyss:0,thermal:1,aurora:2,ink:3,ember:4,ice:5};function j(o,t,r){const e=o.createShader(t);if(!e)throw new Error("Unable to create shader");if(o.shaderSource(e,r),o.compileShader(e),!o.getShaderParameter(e,o.COMPILE_STATUS)){const s=o.getShaderInfoLog(e)??"shader compile failed";throw o.deleteShader(e),new Error(s)}return e}function E(o,t,r,e){const s=j(o,o.VERTEX_SHADER,t),l=j(o,o.FRAGMENT_SHADER,r),a=o.createProgram();if(!a)throw new Error("Unable to create program");if(o.attachShader(a,s),o.attachShader(a,l),o.linkProgram(a),o.deleteShader(s),o.deleteShader(l),!o.getProgramParameter(a,o.LINK_STATUS)){const m=o.getProgramInfoLog(a)??"program link failed";throw o.deleteProgram(a),new Error(m)}const c={};for(const m of e)c[m]=o.getUniformLocation(a,m);return{prog:a,loc:c}}class ne{gl;canvas;vao;sim;drop;clearProg;draw;a;b;readA=!0;simW=1;simH=1;params={...x};raf=0;last=0;acc=0;running=!1;ro=null;constructor(t){this.canvas=t;const r=t.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1,stencil:!1,powerPreference:"high-performance",preserveDrawingBuffer:!0});if(!r)throw new Error("WebGL2 is required for Still.");this.gl=r,r.getExtension("EXT_color_buffer_float"),r.getExtension("OES_texture_float_linear"),r.getExtension("EXT_float_blend");const e=r.createVertexArray();if(!e)throw new Error("Unable to create VAO");this.vao=e,r.bindVertexArray(e),this.sim=E(r,T,re,["uState","uTexel","uDamping","uC2"]),this.drop=E(r,T,se,["uState","uTexel","uPoint","uAmp","uRadius","uAspect"]),this.clearProg=E(r,T,ae,[]),this.draw=E(r,T,ie,["uState","uTexel","uResolution","uColorMap","uTime"]),this.a=this.makeTarget(1,1),this.b=this.makeTarget(1,1),this.resize(),this.seed()}setParams(t){this.params={...this.params,...t}}start(){if(this.running)return;this.running=!0,this.last=performance.now(),this.acc=0;const t=e=>{if(!this.running)return;const s=Math.min((e-this.last)/1e3,.1);this.last=e,this.acc+=s;const l=1/60;let a=0;for(;this.acc>=l&&a<3;)this.stepSim(),this.acc-=l,a+=1;this.render(e/1e3),this.raf=requestAnimationFrame(t)};this.raf=requestAnimationFrame(t);const r=this.canvas.parentElement??this.canvas;this.ro=new ResizeObserver(()=>this.resize()),this.ro.observe(r)}stop(){this.running=!1,cancelAnimationFrame(this.raf),this.ro?.disconnect(),this.ro=null}destroy(){this.stop();const t=this.gl;this.deleteTarget(this.a),this.deleteTarget(this.b),t.deleteProgram(this.sim.prog),t.deleteProgram(this.drop.prog),t.deleteProgram(this.clearProg.prog),t.deleteProgram(this.draw.prog),t.deleteVertexArray(this.vao),t.getExtension("WEBGL_lose_context")?.loseContext()}clear(){this.pass(this.clearProg,this.a,null),this.pass(this.clearProg,this.b,null)}disturb(t,r,e=1){const s=.045+this.params.strength*.62,l=.016+(1-this.params.strength)*.01,a=s*e*(.55+(1-this.params.viscosity)*.45);this.addDrop(t,1-r,a,l)}seed(){this.addDrop(.5,.52,.42,.028),this.addDrop(.38,.44,.18,.02),this.addDrop(.64,.58,.14,.018)}addDrop(t,r,e,s){const l=this.readA?this.a:this.b,a=this.readA?this.b:this.a,c=this.gl;c.useProgram(this.drop.prog),c.bindFramebuffer(c.FRAMEBUFFER,a.fbo),c.viewport(0,0,this.simW,this.simH),c.activeTexture(c.TEXTURE0),c.bindTexture(c.TEXTURE_2D,l.tex),c.uniform1i(this.drop.loc.uState,0),c.uniform2f(this.drop.loc.uTexel,1/this.simW,1/this.simH),c.uniform2f(this.drop.loc.uPoint,t,r),c.uniform1f(this.drop.loc.uAmp,e),c.uniform1f(this.drop.loc.uRadius,s),c.uniform1f(this.drop.loc.uAspect,this.simW/this.simH),c.bindVertexArray(this.vao),c.drawArrays(c.TRIANGLES,0,3),this.readA=!this.readA}stepSim(){const t=this.readA?this.a:this.b,r=this.readA?this.b:this.a,e=this.params.viscosity,s=.9975-e*.07,l=.38*(1-e*.62),a=this.gl;a.useProgram(this.sim.prog),a.bindFramebuffer(a.FRAMEBUFFER,r.fbo),a.viewport(0,0,this.simW,this.simH),a.activeTexture(a.TEXTURE0),a.bindTexture(a.TEXTURE_2D,t.tex),a.uniform1i(this.sim.loc.uState,0),a.uniform2f(this.sim.loc.uTexel,1/this.simW,1/this.simH),a.uniform1f(this.sim.loc.uDamping,s),a.uniform1f(this.sim.loc.uC2,l),a.bindVertexArray(this.vao),a.drawArrays(a.TRIANGLES,0,3),this.readA=!this.readA}render(t){const r=this.readA?this.a:this.b,e=this.gl;e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,this.canvas.width,this.canvas.height),e.useProgram(this.draw.prog),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,r.tex),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.uniform1i(this.draw.loc.uState,0),e.uniform2f(this.draw.loc.uTexel,1/this.simW,1/this.simH),e.uniform2f(this.draw.loc.uResolution,this.canvas.width,this.canvas.height),e.uniform1i(this.draw.loc.uColorMap,oe[this.params.colorMap]),e.uniform1f(this.draw.loc.uTime,t),e.bindVertexArray(this.vao),e.drawArrays(e.TRIANGLES,0,3),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST)}pass(t,r,e){const s=this.gl;s.useProgram(t.prog),s.bindFramebuffer(s.FRAMEBUFFER,r.fbo),s.viewport(0,0,this.simW,this.simH),e&&(s.activeTexture(s.TEXTURE0),s.bindTexture(s.TEXTURE_2D,e.tex)),s.bindVertexArray(this.vao),s.drawArrays(s.TRIANGLES,0,3)}resize(){const t=this.canvas,r=Math.min(window.devicePixelRatio||1,2),e=Math.max(1,t.clientWidth||window.innerWidth),s=Math.max(1,t.clientHeight||window.innerHeight),l=Math.round(e*r),a=Math.round(s*r);(t.width!==l||t.height!==a)&&(t.width=l,t.height=a);const c=e<480?384:560,m=e/s;let v,f;m>=1?(v=c,f=Math.max(96,Math.round(c/m))):(f=c,v=Math.max(96,Math.round(c*m))),!(v===this.simW&&f===this.simH&&this.a.tex)&&(this.simW=v,this.simH=f,this.deleteTarget(this.a),this.deleteTarget(this.b),this.a=this.makeTarget(v,f),this.b=this.makeTarget(v,f),this.readA=!0)}makeTarget(t,r){const e=this.gl,s=e.createTexture(),l=e.createFramebuffer();if(!s||!l)throw new Error("Unable to allocate surface");if(e.bindTexture(e.TEXTURE_2D,s),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texImage2D(e.TEXTURE_2D,0,e.RGBA16F,t,r,0,e.RGBA,e.HALF_FLOAT,null),e.bindFramebuffer(e.FRAMEBUFFER,l),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,s,0),e.checkFramebufferStatus(e.FRAMEBUFFER)!==e.FRAMEBUFFER_COMPLETE)throw new Error("Surface buffer is incomplete");return e.bindFramebuffer(e.FRAMEBUFFER,null),{tex:s,fbo:l}}deleteTarget(t){const r=this.gl;t.tex&&r.deleteTexture(t.tex),t.fbo&&r.deleteFramebuffer(t.fbo)}}function ce(){if(typeof window>"u")return{...x};try{const o=window.localStorage.getItem(X);if(!o)return{...x};const t=JSON.parse(o),r=k.some(e=>e.id===t.colorMap)?t.colorMap:x.colorMap;return{viscosity:I(t.viscosity??x.viscosity),strength:I(t.strength??x.strength),colorMap:r}}catch{return{...x}}}function I(o){return Math.min(1,Math.max(0,o))}function le(){const o=h.useRef(null),t=h.useRef(null),r=h.useRef(null),e=h.useRef(!1),[s,l]=h.useState(ce),[a,c]=h.useState(!0),[m,v]=h.useState(null),[f,L]=h.useState(!1);h.useEffect(()=>{const n=o.current;if(n)try{const u=new ne(n);return u.setParams(s),u.start(),t.current=u,v(null),()=>{u.destroy(),t.current=null}}catch(u){v(u instanceof Error?u.message:"Unable to start the surface.")}},[]),h.useEffect(()=>{t.current?.setParams(s);try{window.localStorage.setItem(X,JSON.stringify(s))}catch{}},[s]);const A=h.useCallback((n,u)=>{const p=o.current;if(!p)return null;const d=p.getBoundingClientRect();return d.width<=0||d.height<=0?null:{x:(n-d.left)/d.width,y:(u-d.top)/d.height}},[]),_=h.useCallback((n,u,p)=>{const d=A(n,u),R=t.current;if(!d||!R)return;if(p||!r.current){R.disturb(d.x,d.y,1),r.current=d;return}const b=r.current,M=d.x-b.x,P=d.y-b.y,F=Math.hypot(M,P),y=Math.max(1,Math.ceil(F/.008)),H=Math.min(1.15,.55+F*8);for(let w=1;w<=y;w++){const C=w/y;R.disturb(b.x+M*C,b.y+P*C,H/Math.sqrt(y))}r.current=d},[A]),z=n=>{n.button!==0&&n.pointerType==="mouse"||(e.current=!0,c(!1),n.currentTarget.setPointerCapture(n.pointerId),_(n.clientX,n.clientY,!0))},O=n=>{e.current&&_(n.clientX,n.clientY,!1)},S=n=>{e.current=!1,r.current=null,n.currentTarget.hasPointerCapture(n.pointerId)&&n.currentTarget.releasePointerCapture(n.pointerId)},N=()=>{t.current?.clear()};return h.useEffect(()=>{const n=u=>{const p=u.target;p&&(p.tagName==="INPUT"||p.isContentEditable)||(u.code==="Space"||u.key==="c"||u.key==="C")&&(u.preventDefault(),N())};return window.addEventListener("keydown",n),()=>window.removeEventListener("keydown",n)},[]),i.jsxs("div",{className:"relative h-dvh w-full overflow-hidden bg-bg text-fg",children:[i.jsx("canvas",{ref:o,className:"absolute inset-0 size-full touch-none",style:{touchAction:"none",display:"block"},onPointerDown:z,onPointerMove:O,onPointerUp:S,onPointerCancel:S,onContextMenu:n=>n.preventDefault()}),m?i.jsx("div",{className:"absolute inset-0 grid place-items-center bg-bg px-6 text-center",children:i.jsxs("div",{className:"max-w-sm",children:[i.jsx("p",{className:"font-display text-2xl",children:"Surface unavailable"}),i.jsx("p",{className:"mt-2 text-sm text-muted",children:m})]})}):null,i.jsxs("header",{className:"pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:p-6",children:[i.jsxs("div",{children:[i.jsx("p",{className:"font-display text-3xl leading-none tracking-[-0.03em]",children:"Still"}),i.jsx("p",{className:"mt-1 text-sm text-muted",children:"A living surface"})]}),i.jsx("div",{className:"pointer-events-auto flex items-center gap-2",children:i.jsxs(U,{type:"button",variant:"secondary",size:"icon",className:"lg:hidden","aria-expanded":f,"aria-controls":"still-controls",onClick:()=>L(n=>!n),children:[f?i.jsx($,{className:"size-4"}):i.jsx(J,{className:"size-4"}),i.jsx("span",{className:"sr-only",children:f?"Close controls":"Open controls"})]})})]}),i.jsx("p",{className:g("pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-6 text-center font-display text-xl italic text-fg/70 transition-opacity duration-300 ease-out sm:text-2xl",a?"opacity-100":"opacity-0"),children:"Drag to disturb the surface"}),i.jsxs("aside",{id:"still-controls",className:g("absolute z-10 border border-border bg-surface/92 p-4 shadow-lg backdrop-blur-sm","inset-x-3 bottom-[max(4.5rem,env(safe-area-inset-bottom))] rounded-t-xl rounded-b-xl","transition-[opacity,transform] duration-200 ease-out","lg:inset-auto lg:right-6 lg:bottom-20 lg:w-[22rem] lg:rounded-xl lg:p-5",f?"translate-y-0 opacity-100":"pointer-events-none translate-y-3 opacity-0 lg:pointer-events-auto lg:translate-y-0 lg:opacity-100"),children:[i.jsxs("div",{className:"mb-4 hidden items-center gap-2 lg:flex",children:[i.jsx(ee,{className:"size-4 text-muted"}),i.jsx("p",{className:"text-sm font-medium",children:"Surface"})]}),i.jsxs("div",{className:"space-y-4",children:[i.jsx(D,{label:"Viscosity",value:s.viscosity,onValueChange:n=>l(u=>({...u,viscosity:n})),display:`${Math.round(s.viscosity*100)}`}),i.jsx(D,{label:"Wave strength",value:s.strength,onValueChange:n=>l(u=>({...u,strength:n})),display:`${Math.round(s.strength*100)}`}),i.jsxs("fieldset",{children:[i.jsx("legend",{className:"mb-2 text-sm font-medium text-fg",children:"Color map"}),i.jsx("div",{className:"grid grid-cols-3 gap-2",children:k.map(n=>{const u=s.colorMap===n.id;return i.jsx("button",{type:"button",onClick:()=>l(p=>({...p,colorMap:n.id})),className:g("h-11 rounded-sm border px-2 text-sm font-medium transition-colors duration-150",u?"border-fg bg-fg text-primary-fg":"border-border bg-surface-2 text-muted hover:text-fg"),"aria-pressed":u,children:n.label},n.id)})})]}),i.jsxs(U,{type:"button",variant:"secondary",className:"w-full",onClick:N,children:[i.jsx(Q,{className:"size-4"}),"Clear surface"]})]})]})]})}function xe(){return i.jsx(le,{})}export{xe as default};
