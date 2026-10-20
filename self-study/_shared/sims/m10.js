/* Mô phỏng module m10: máy thu thực dụng gần giới hạn lượng tử. Hàm thuần nằm trong M10 (kiểm bằng Node so với data/verify/m10_verify.py). */
(function(root){
'use strict';
var QL=root.QL||(typeof require!=='undefined'?require('../qlib.js'):null);
var M10={};
M10.erfc=function(x){return 1-QL.erf(x)};
/* BPSK {|a>,|-a>}, n=|a|^2 */
M10.hom=function(n){return 0.5*M10.erfc(Math.sqrt(2*n))};
M10.ken=function(n){return 0.5*Math.exp(-4*n)};
M10.hel=function(n){return 0.5*(1-Math.sqrt(Math.max(0,1-Math.exp(-4*n))))};
/* Eq.(10) dạng nhị phân: beta*tanh(2 a beta)=a, chia đôi */
M10.beta=function(a){
  if(a<=0)return Math.SQRT1_2;var lo=1e-9,hi=50;
  for(var i=0;i<200;i++){var m=0.5*(lo+hi);if(m*Math.tanh(2*a*m)-a<0)lo=m;else hi=m}
  return 0.5*(lo+hi);
};
M10.odStage=function(a){var b=M10.beta(a);return 0.5-Math.exp(-a*a-b*b)*Math.sinh(2*a*b)};
M10.od=function(n){return M10.odStage(Math.sqrt(n))};
/* QPSK, n=|alpha|^2, t2 = phần truyền tới tầng đếm photon */
M10.qpskHet=function(n){var p=0.5*(1+QL.erf(Math.sqrt(n)/Math.SQRT2));return 1-p*p};
M10.qpskHel=function(n){
  var s=0;for(var k=0;k<4;k++){var re=0;
    for(var m=0;m<4;m++){var c=Math.exp(-n*(1-Math.cos(Math.PI*m/2))),ph=n*Math.sin(Math.PI*m/2);   /* c_m=exp(-n(1-i^m)) */
      var ang=ph-2*Math.PI*k*m/4;re+=c*Math.cos(ang)}
    s+=Math.sqrt(Math.max(re,0))}
  return 1-s*s/16;
};
M10.hdk=function(n,t2){var r=Math.sqrt(1-t2);return 1-0.5*(1+QL.erf(r*Math.sqrt(n)))*(1-0.5*Math.exp(-2*t2*n))};
M10.hdod=function(n,t2){var r=Math.sqrt(1-t2),a=Math.sqrt(t2*n)/Math.SQRT2;return 1-0.5*(1+QL.erf(r*Math.sqrt(n)))*(1-M10.odStage(a))};
M10.bestT=function(f,n){
  var best=1e9,bt=0.5,i,t,v;for(i=1;i<=199;i++){t=i/200;v=f(n,t);if(v<best){best=v;bt=t}}
  var lo=Math.max(bt-0.005,1e-4),hi=Math.min(bt+0.005,1-1e-4);
  for(i=0;i<60;i++){var a=lo+(hi-lo)/3,b=hi-(hi-lo)/3;if(f(n,a)<f(n,b))hi=b;else lo=a}
  t=0.5*(lo+hi);return {t2:t,pe:f(n,t)};
};
root.M10=M10;
if(typeof module!=='undefined'&&module.exports)module.exports=M10;
if(typeof SIM==='undefined'||!SIM.W)return;
var vi=((document.documentElement.getAttribute('lang')||'vi').slice(0,2)==='vi');
function T(a,b){return vi?a:b}
function grid(a,b,k){var o=[];for(var i=0;i<k;i++)o.push(a*Math.pow(b/a,i/(k-1)));return o}

SIM.W.m10_binary=function(rt){
  SIM.frame(rt,T('P_e theo n̄ cho nhị phân: homodyne, Kennedy, dịch chuyển tối ưu, Helstrom','P_e versus n̄ for binary signals: homodyne, Kennedy, optimised displacement, Helstrom'),
   '<div class="row"><label>n̄ = |α|² <input id="nb" type="number" value="0.5" step="0.1" min="0.01" max="6" style="width:80px"></label></div><div id="o"></div><div id="p"></div>');
  function draw(){
    var n=parseFloat(SIM.$(rt,'#nb').value);if(!(n>0))return;
    var h=M10.hel(n),rows=[[T('Homodyne','Homodyne'),M10.hom(n)],['Kennedy',M10.ken(n)],[T('Dịch chuyển tối ưu','Optimised displacement'),M10.od(n)],['Helstrom',h]];
    SIM.$(rt,'#o').innerHTML=SIM.tbl([T('Máy thu','Receiver'),'P_e',T('Tỉ số với Helstrom','Ratio to Helstrom')],rows.map(function(r){return [r[0],SIM.f(r[1],4),SIM.f(r[1]/h,3)]}))+
      '<p>'+T('Kennedy tốt hơn homodyne khi n̄ lớn hơn ≈ 0,384.','Kennedy beats homodyne once n̄ exceeds ≈ 0.384.')+'</p>';
    var xs=grid(0.05,4,40);
    SIM.$(rt,'#p').innerHTML=SIM.plot([{x:xs,y:xs.map(M10.hom),label:'Homodyne'},{x:xs,y:xs.map(M10.ken),label:'Kennedy'},{x:xs,y:xs.map(M10.od),label:T('Dịch chuyển tối ưu','Optimised displacement')},{x:xs,y:xs.map(M10.hel),label:'Helstrom'}],{logy:true,logx:true,xlabel:'n̄',ylabel:'P_e'});
  }
  SIM.$(rt,'#nb').addEventListener('input',draw);draw();
};
SIM.W.m10_qpsk=function(rt){
  SIM.frame(rt,T('QPSK: heterodyne, máy thu lai HD-K và HD-OD, Helstrom','QPSK: heterodyne, hybrid HD-K and HD-OD receivers, Helstrom'),
   '<div class="row"><label>|α|² <input id="nb" type="number" value="0.97" step="0.1" min="0.05" max="8" style="width:80px"></label></div><div id="o"></div><div id="p"></div>');
  function draw(){
    var n=parseFloat(SIM.$(rt,'#nb').value);if(!(n>0))return;
    var het=M10.qpskHet(n),k=M10.bestT(M10.hdk,n),o=M10.bestT(M10.hdod,n),h=M10.qpskHel(n);
    SIM.$(rt,'#o').innerHTML=SIM.tbl([T('Máy thu','Receiver'),'P_e',T('Tỉ số với heterodyne','Ratio to heterodyne'),'t² '+T('tối ưu','optimal')],
      [['Heterodyne',SIM.f(het,4),'1','-'],['HD-K',SIM.f(k.pe,4),SIM.f(k.pe/het,3),SIM.f(k.t2,3)],['HD-OD',SIM.f(o.pe,4),SIM.f(o.pe/het,3),SIM.f(o.t2,3)],['Helstrom',SIM.f(h,4),SIM.f(h/het,3),'-']]);
    var xs=grid(0.1,6,30);
    SIM.$(rt,'#p').innerHTML=SIM.plot([{x:xs,y:xs.map(function(x){return 1}),label:'Heterodyne'},{x:xs,y:xs.map(function(x){return M10.bestT(M10.hdk,x).pe/M10.qpskHet(x)}),label:'HD-K'},{x:xs,y:xs.map(function(x){return M10.bestT(M10.hdod,x).pe/M10.qpskHet(x)}),label:'HD-OD'},{x:xs,y:xs.map(function(x){return M10.qpskHel(x)/M10.qpskHet(x)}),label:'Helstrom'}],{logx:true,logy:true,xlabel:'|α|²',ylabel:T('P_e / P_e(heterodyne)','P_e / P_e(heterodyne)')});
  }
  SIM.$(rt,'#nb').addEventListener('input',draw);draw();
};
})(typeof window!=='undefined'?window:this);
