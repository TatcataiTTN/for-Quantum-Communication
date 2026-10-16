/* Mô phỏng module m03: BPSK hai trạng thái dưới nhiễu loạn Gamma-Gamma + nhiễu Gauss.
   Hàm thuần nằm trong M03 (kiểm bằng Node so với data/verify/m03_verify.py); widget chỉ gọi QL.* và M03.* */
(function(root){
'use strict';
var QL=root.QL||(typeof require!=='undefined'?require('../qlib.js'):null);
var M03={};
/* Tham số Gamma-Gamma: 'standard' = Andrews-Phillips (sigma_R^{12/5}); 'printed' = đúng dạng in ở Eq.(8)-(9): 1+1.11*sqrt(sigma_R^2) */
M03.gg=function(s2,variant){
  var sr=Math.sqrt(Math.max(s2,0)),d=(variant==='printed')?sr:Math.pow(sr,12/5);
  var a=1/Math.max(Math.expm1(0.49*s2/Math.pow(1+1.11*d,7/6)),1e-300);
  var b=1/Math.max(Math.expm1(0.51*s2/Math.pow(1+0.69*d,5/6)),1e-300);
  return {alpha:a,beta:b};
};
M03.sigR2=function(Cn2,lam,L){return QL.rytov(Cn2,lam,L)};
M03.pe=function(nbar,sigma,s2,variant,d,nI,nW){
  var g=M03.gg(s2,variant),s=QL.channelStates(nbar,sigma,g.alpha,g.beta,d,nI,nW);
  return QL.helstromError(s.rho0,s.rho1);
};
M03.PAPER_TABLE=[[200,7.1309,3.2413],[400,5.7921,2.6328],[700,4.8969,2.2259],[800,4.7046,2.1385],[1200,4.1658,1.8935],[1400,3.9775,1.8080],[2400,3.3837,1.5380]];
root.M03=M03;
if(typeof module!=='undefined'&&module.exports)module.exports=M03;
if(typeof SIM==='undefined'||!SIM.W)return;

var LANG=(document.documentElement.getAttribute('lang')||'vi').slice(0,2),vi=LANG==='vi';
function T(a,b){return vi?a:b}
function val(root,id){return parseFloat(SIM.$(root,'#'+id).value)}

/* (a) P_e theo n-bar: BPSK thuần và kênh Gamma-Gamma + nhiễu */
SIM.W.m03_pe=function(rt){
  SIM.frame(rt,T('P_e theo số photon trung bình: BPSK thuần và kênh nhiễu loạn','P_e versus mean photon number: pure BPSK and the turbulent noisy channel'),
   '<div class="row"><label>C<sub>n</sub>² <input id="cn" value="5e-14" size="7"></label><label>λ (µm) <input id="lam" value="1.55" size="5"></label>'+
   '<label>L (m) <input id="L" value="1200" size="6"></label><label>σ <input id="sg" value="0.5" size="4"></label>'+
   '<label>'+T('Công thức α,β','α,β formula')+' <select id="var"><option value="standard">'+T('chuẩn σ_R^{12/5}','standard σ_R^{12/5}')+'</option><option value="printed">'+T('dạng in σ_R','as printed σ_R')+'</option></select></label>'+
   '<label>n̄<sub>max</sub> <input id="nm" value="3" size="3"></label><button class="btn" id="go">'+T('Vẽ','Plot')+'</button></div><div class="out"></div>');
  function run(){
    var cn=val(rt,'cn'),lam=val(rt,'lam')*1e-6,L=val(rt,'L'),sg=val(rt,'sg'),nm=val(rt,'nm'),v=SIM.$(rt,'#var').value;
    var s2=M03.sigR2(cn,lam,L),g=M03.gg(s2,v),xs=[],yp=[],ya=[],yc=[],N=12;
    for(var i=1;i<=N;i++){var n=nm*i/N;xs.push(n);yp.push(QL.helstromBPSKPure(n));ya.push(0.25*Math.exp(-4*n));yc.push(M03.pe(n,sg,s2,v,24,32,21))}
    var ser=[{x:xs,y:yp,label:T('BPSK thuần Eq.(5)','pure BPSK Eq.(5)')},{x:xs,y:yc,label:T('Gamma-Gamma + nhiễu (oracle cầu phương)','Gamma-Gamma + noise (quadrature oracle)')},{x:xs,y:ya,label:T('xấp xỉ ¼e^{-4n̄}','approx ¼e^{-4n̄}'),color:'#a05a00'}];
    var rows=[0,3,5,8,11].map(function(i){return [SIM.f(xs[i],3),SIM.f(yp[i],4),SIM.f(yc[i],4),SIM.f(yc[i]/yp[i],3)]});
    SIM.$(rt,'.out').innerHTML='<p>σ<sub>R</sub>² = <b>'+SIM.f(s2,4)+'</b>, α = <b>'+SIM.f(g.alpha,4)+'</b>, β = <b>'+SIM.f(g.beta,4)+'</b></p>'+
      SIM.plot(ser,{logy:true,xlabel:'n̄ = |α|²',ylabel:'P_e',ymin:1e-6,ymax:1})+SIM.tbl(['n̄',T('P_e thuần','pure P_e'),T('P_e kênh','channel P_e'),T('tỉ số','ratio')],rows);
  }
  SIM.$(rt,'#go').onclick=run;run();
};
/* (b) Bảng α, β theo L */
SIM.W.m03_gg=function(rt){
  SIM.frame(rt,T('Bảng α, β theo chiều dài tuyến L','Table of α, β versus link length L'),
   '<div class="row"><label>C<sub>n</sub>² <input id="cn" value="5e-14" size="7"></label><label>λ (µm) <input id="lam" value="1.55" size="5"></label><button class="btn" id="go">'+T('Tính','Compute')+'</button></div><div class="out"></div>');
  function run(){
    var cn=val(rt,'cn'),lam=val(rt,'lam')*1e-6;
    var rows=M03.PAPER_TABLE.map(function(p){var s2=M03.sigR2(cn,lam,p[0]),a=M03.gg(s2,'standard'),b=M03.gg(s2,'printed');
      return [p[0],SIM.f(s2,4),SIM.f(a.alpha,4)+' / '+SIM.f(a.beta,4),SIM.f(b.alpha,4)+' / '+SIM.f(b.beta,4),p[1]+' / '+p[2]]});
    SIM.$(rt,'.out').innerHTML=SIM.tbl(['L (m)','σ_R²',T('chuẩn σ_R^{12/5}: α / β','standard σ_R^{12/5}: α / β'),T('dạng in σ_R: α / β','as printed σ_R: α / β'),T('bài báo (C_n²=5e-14): α / β','paper (C_n²=5e-14): α / β')],rows)+
      '<p style="font-size:.82rem;color:var(--muted)">'+T('Cột bài báo là số in trong phần IX của bài. Với C_n²=5e-14 và λ=1,55 µm, không cột nào tái lập được cột đó.','The paper column is printed in Section IX. With C_n²=5e-14 and λ=1.55 µm no computed column reproduces it.')+'</p>';
  }
  SIM.$(rt,'#go').onclick=run;run();
};
})(typeof window!=='undefined'?window:globalThis);
