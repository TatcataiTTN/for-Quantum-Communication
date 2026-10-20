/* Widget m09: P_e của máy thu Kennedy, homodyne, heterodyne, dịch chuyển tối ưu và cận Helstrom theo n̄=|α|^2.
   Hàm thuần nằm trong M09 (kiểm bằng Node so với data/verify/m09_verify.py qua m09_cases.json). */
(function(root){
'use strict';
var QL=root.QL||(typeof require!=='undefined'?require('../qlib.js'):null);
var M09={};
M09.erfc=function(x){ if(x<3)return 1-QL.erf(x); var f=0;for(var k=80;k>=1;k--)f=k/2/(x+f); return Math.exp(-x*x)/(Math.sqrt(Math.PI)*(x+f)); };
M09.helstrom=function(n){return QL.helstromBPSKPure(n)};
M09.kennedy=function(n){return 0.5*Math.exp(-4*n)};
M09.homodyne=function(n){return 0.5*M09.erfc(Math.sqrt(2*n))};
M09.heterodyne=function(n){return 0.5*M09.erfc(Math.sqrt(n))};
M09.kennedyImperfect=function(n,eta,nu){return 0.5*((1-Math.exp(-nu))+Math.exp(-nu-eta*4*n))};
M09.odError=function(n,b){var a=Math.sqrt(n);return 0.5*((1-Math.exp(-(a-b)*(a-b)))+Math.exp(-(a+b)*(a+b)))};
M09.od=function(n){ /* cực tiểu theo b>0 bằng tìm tỉ lệ vàng */
  var a=Math.sqrt(n),lo=0,hi=a+6,g=(Math.sqrt(5)-1)/2,c=hi-g*(hi-lo),d=lo+g*(hi-lo);
  for(var i=0;i<200;i++){ if(M09.odError(n,c)<M09.odError(n,d)){hi=d}else{lo=c} c=hi-g*(hi-lo);d=lo+g*(hi-lo); }
  var b=(lo+hi)/2;return {beta:b,pe:M09.odError(n,b)};
};
M09.ggAvg=function(f,a,b){ /* trung bình theo Gamma-Gamma, cầu phương hình thang trên log I */
  var N=4000,lo=Math.log(1e-4),hi=Math.log(40),h=(hi-lo)/N,s=0,z=0;
  for(var i=0;i<=N;i++){var l=lo+i*h,I=Math.exp(l),w=QL.ggPdf(I,a,b)*I*((i===0||i===N)?0.5:1);s+=w*f(I);z+=w}
  return s/z;
};
M09.crossKH=function(){var lo=0.05,hi=2;for(var i=0;i<100;i++){var m=(lo+hi)/2;if(M09.kennedy(m)>M09.homodyne(m))lo=m;else hi=m}return (lo+hi)/2};
root.M09=M09;
if(typeof module!=='undefined'&&module.exports)module.exports=M09;
if(typeof SIM==='undefined'||!SIM.W)return;

var LANG=(document.documentElement.getAttribute('lang')||'vi').slice(0,2),vi=LANG==='vi';
function T(a,b){return vi?a:b}
function val(rt,id){return parseFloat(SIM.$(rt,'#'+id).value)}

SIM.W.m09_pe=function(rt){
  SIM.frame(rt,T('P_e của các máy thu theo n̄ (công thức đóng)','P_e of the receivers versus n̄ (closed forms)'),
   '<div class="row"><label>n̄<sub>max</sub> <input id="nm" value="6" size="4"></label><label>n̄ <input id="n0" value="1" size="4"></label>'+
   '<label>η <input id="eta" value="1" size="4"></label><label>ν <input id="nu" value="0" size="6"></label><button class="btn" id="go">'+T('Vẽ','Plot')+'</button></div><div class="out"></div>');
  function run(){
    var nm=val(rt,'nm'),n0=val(rt,'n0'),eta=val(rt,'eta'),nu=val(rt,'nu'),N=60,xs=[],H=[],K=[],Hm=[],He=[],Ki=[];
    for(var i=1;i<=N;i++){var n=nm*i/N;xs.push(n);H.push(M09.helstrom(n));K.push(M09.kennedy(n));Hm.push(M09.homodyne(n));He.push(M09.heterodyne(n));Ki.push(M09.kennedyImperfect(n,eta,nu))}
    var ser=[{x:xs,y:H,label:'Helstrom'},{x:xs,y:K,label:'Kennedy'},{x:xs,y:Hm,label:'homodyne'},{x:xs,y:He,label:'heterodyne'}];
    if(eta!==1||nu!==0)ser.push({x:xs,y:Ki,label:T('Kennedy thực (η, ν)','Kennedy real (η, ν)')});
    var o=M09.od(n0);
    var rows=[['Helstrom',M09.helstrom(n0)],['Kennedy',M09.kennedy(n0)],[T('Kennedy thực (η, ν)','Kennedy real (η, ν)'),M09.kennedyImperfect(n0,eta,nu)],[T('dịch chuyển tối ưu','optimised displacement')+' (β*='+SIM.f(o.beta,4)+')',o.pe],['homodyne',M09.homodyne(n0)],['heterodyne',M09.heterodyne(n0)]].map(function(r){return [r[0],SIM.f(r[1],4)]});
    SIM.$(rt,'.out').innerHTML='<p>'+T('Kennedy = homodyne tại','Kennedy = homodyne at')+' n̄ = <b>'+SIM.f(M09.crossKH(),4)+'</b>; K/H = 1+√(1−e<sup>−4n̄</sup>) = <b>'+SIM.f(M09.kennedy(n0)/M09.helstrom(n0),4)+'</b> '+T('tại','at')+' n̄ = '+n0+'</p>'+
      SIM.plot(ser,{logy:true,xlabel:'n̄ = |α|²',ylabel:'P_e',ymin:1e-9,ymax:0.5})+SIM.tbl([T('Máy thu','Receiver'),'P_e'],rows);
  }
  SIM.$(rt,'#go').onclick=run;run();
};
SIM.W.m09_fading=function(rt){
  SIM.frame(rt,T('P_e trung bình dưới nhiễu loạn Gamma-Gamma (biết trạng thái kênh)','Mean P_e under Gamma-Gamma turbulence (channel state known)'),
   '<div class="row"><label>C<sub>n</sub>² <input id="cn" value="1e-14" size="7"></label><label>λ (µm) <input id="lam" value="1.55" size="5"></label><label>L (m) <input id="L" value="2000" size="6"></label><button class="btn" id="go">'+T('Tính','Compute')+'</button></div><div class="out"></div>');
  function run(){
    var s2=QL.rytov(val(rt,'cn'),val(rt,'lam')*1e-6,val(rt,'L')),g=QL.ggParams(s2);
    var rows=[0.5,1,2,4].map(function(n){return [n,SIM.f(M09.ggAvg(function(I){return M09.kennedy(I*n)},g.alpha,g.beta),4),SIM.f(M09.ggAvg(function(I){return M09.homodyne(I*n)},g.alpha,g.beta),4),SIM.f(M09.ggAvg(function(I){return M09.helstrom(I*n)},g.alpha,g.beta),4)]});
    SIM.$(rt,'.out').innerHTML='<p>σ<sub>R</sub>² = <b>'+SIM.f(s2,4)+'</b>, α = <b>'+SIM.f(g.alpha,4)+'</b>, β = <b>'+SIM.f(g.beta,4)+'</b></p>'+SIM.tbl(['n̄','Kennedy','homodyne','Helstrom'],rows);
  }
  SIM.$(rt,'#go').onclick=run;run();
};
})(typeof window!=='undefined'?window:globalThis);
