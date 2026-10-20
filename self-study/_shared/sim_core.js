/* Lõi mô phỏng: mỗi widget là SIM.W.<tên>=function(root){...}, gắn vào <div class="sim" data-sim="tên"></div>.
   Mọi tính toán phải gọi QL.* (qlib.js) hoặc thư viện riêng của module, không nhúng thuật toán vào widget. */
(function(){
'use strict';
var SIM=window.SIM={W:{}};
SIM.esc=function(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')};
SIM.frame=function(root,title,body){root.innerHTML='<div class="simh">🧪 '+title+'</div>'+body};
SIM.$=function(root,sel){return root.querySelector(sel)};
SIM.nums=function(s){return s.split(/[\s,;]+/).filter(Boolean).map(Number)};
SIM.f=function(x,k){if(x===Infinity)return '∞';if(x===0)return '0';k=k||4;var a=Math.abs(x);return (a<1e-3||a>=1e5)?x.toExponential(k-1):String(+x.toPrecision(k))};
SIM.tbl=function(head,rows,cls){return '<table class="t '+(cls||'')+'"><tr>'+head.map(function(h){return '<th>'+h+'</th>'}).join('')+'</tr>'+rows.map(function(r){var c='';if(r&&r.cls){c=' class="'+r.cls+'"';r=r.cells}return '<tr'+c+'>'+r.map(function(x){return '<td>'+x+'</td>'}).join('')+'</tr>'}).join('')+'</table>'};
/* Vẽ đường cong SVG đơn giản: series=[{x:[],y:[],color,label}], opts {logx,logy,xlabel,ylabel,w,h} */
SIM.plot=function(series,o){
  o=o||{};var W=o.w||520,H=o.h||260,m={l:54,r:12,t:12,b:38};
  var xs=[],ys=[];series.forEach(function(s){s.x.forEach(function(v,i){var y=s.y[i];if(isFinite(v)&&isFinite(y)&&(!o.logy||y>0)&&(!o.logx||v>0)){xs.push(o.logx?Math.log10(v):v);ys.push(o.logy?Math.log10(y):y)}})});
  if(!xs.length)return '<p class="no">Không có dữ liệu để vẽ.</p>';
  var x0=Math.min.apply(null,xs),x1=Math.max.apply(null,xs),y0=Math.min.apply(null,ys),y1=Math.max.apply(null,ys);
  if(o.ymin!==undefined)y0=o.logy?Math.log10(o.ymin):o.ymin;if(o.ymax!==undefined)y1=o.logy?Math.log10(o.ymax):o.ymax;
  if(x1===x0){x1+=1;x0-=1}if(y1===y0){y1+=1;y0-=1}
  function X(v){v=o.logx?Math.log10(v):v;return m.l+(v-x0)/(x1-x0)*(W-m.l-m.r)}
  function Y(v){v=o.logy?Math.log10(v):v;return H-m.b-(v-y0)/(y1-y0)*(H-m.t-m.b)}
  var cols=['#1f4e8c','#b3122f','#1b7f4c','#a05a00','#6b3fa0'],g='';
  function tick(v,log){return log?'1e'+Math.round(v):SIM.f(v,3)}
  for(var i=0;i<=4;i++){var tx=x0+(x1-x0)*i/4,ty=y0+(y1-y0)*i/4,px=m.l+(W-m.l-m.r)*i/4,py=H-m.b-(H-m.t-m.b)*i/4;
    g+='<line x1="'+px+'" x2="'+px+'" y1="'+m.t+'" y2="'+(H-m.b)+'" stroke="#8884" /><line x1="'+m.l+'" x2="'+(W-m.r)+'" y1="'+py+'" y2="'+py+'" stroke="#8884"/>';
    g+='<text x="'+px+'" y="'+(H-m.b+14)+'" font-size="10" text-anchor="middle" fill="currentColor">'+tick(tx,o.logx)+'</text><text x="'+(m.l-4)+'" y="'+(py+3)+'" font-size="10" text-anchor="end" fill="currentColor">'+tick(ty,o.logy)+'</text>'}
  series.forEach(function(s,k){var c=s.color||cols[k%cols.length],d='';s.x.forEach(function(v,i){var y=s.y[i];if(!isFinite(v)||!isFinite(y)||(o.logy&&y<=0)||(o.logx&&v<=0))return;d+=(d?'L':'M')+X(v).toFixed(1)+' '+Y(y).toFixed(1)});g+='<path d="'+d+'" fill="none" stroke="'+c+'" stroke-width="2"/>';
    g+='<text x="'+(m.l+8)+'" y="'+(m.t+12+k*13)+'" font-size="11" fill="'+c+'">━ '+SIM.esc(s.label||'')+'</text>'});
  g+='<text x="'+(W/2)+'" y="'+(H-4)+'" font-size="11" text-anchor="middle" fill="currentColor">'+SIM.esc(o.xlabel||'')+'</text><text x="12" y="'+(H/2)+'" font-size="11" text-anchor="middle" fill="currentColor" transform="rotate(-90 12 '+(H/2)+')">'+SIM.esc(o.ylabel||'')+'</text>';
  return '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;max-width:'+W+'px;height:auto;background:var(--card);border:1px solid var(--border);border-radius:8px" role="img">'+g+'</svg>';
};
function init(){document.querySelectorAll('.sim[data-sim]').forEach(function(root){var n=root.getAttribute('data-sim'),fn=SIM.W[n];
  if(!fn){root.innerHTML='<p class="no">Chưa có mô phỏng: '+SIM.esc(n)+'</p>';return}
  try{fn(root)}catch(e){root.innerHTML='<p class="no">Lỗi mô phỏng '+SIM.esc(n)+': '+SIM.esc(e.message)+'</p>';console.error(e)}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
