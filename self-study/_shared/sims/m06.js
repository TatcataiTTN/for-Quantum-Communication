/* Mô phỏng module m06: QPSK bốn trạng thái, PGM với đối xứng Z4. Hàm thuần nằm trong M06 (kiểm bằng Node so với data/verify/m06_verify.py). */
(function(root){
'use strict';
var QL=root.QL||(typeof require!=='undefined'?require('../qlib.js'):null);
var M06={};
/* Ma trận Gram G_jk=<alpha_j|alpha_k>, alpha_k=sqrt(n) i^k (phức). Trả {re,im}. */
M06.gram=function(n){
  var re=[],im=[];
  for(var j=0;j<4;j++){re.push([]);im.push([]);
    for(var k=0;k<4;k++){
      var aj=[Math.sqrt(n)*Math.cos(Math.PI*j/2),Math.sqrt(n)*Math.sin(Math.PI*j/2)],ak=[Math.sqrt(n)*Math.cos(Math.PI*k/2),Math.sqrt(n)*Math.sin(Math.PI*k/2)];
      /* conj(aj)*ak */
      var pr=aj[0]*ak[0]+aj[1]*ak[1],pi=aj[0]*ak[1]-aj[1]*ak[0],mag=Math.exp(-n+pr);
      re[j].push(mag*Math.cos(pi));im[j].push(mag*Math.sin(pi));
    }}
  return {re:re,im:im};
};
/* Trị riêng Hermite 4x4 bằng nhúng thực 8x8 [[A,-B],[B,A]] rồi jacobiEig; mỗi trị riêng xuất hiện hai lần. */
M06.gramEig=function(n){
  var g=M06.gram(n),M=[],i,j;
  for(i=0;i<8;i++)M.push(new Array(8).fill(0));
  for(i=0;i<4;i++)for(j=0;j<4;j++){M[i][j]=g.re[i][j];M[i+4][j+4]=g.re[i][j];M[i][j+4]=-g.im[i][j];M[i+4][j]=g.im[i][j]}
  var v=QL.jacobiEig(M,false).vals.slice().sort(function(a,b){return a-b}),out=[];
  for(i=0;i<8;i+=2)out.push(Math.max(0,(v[i]+v[i+1])/2));
  return out;
};
/* P_e của PGM = 1-((1/4) sum sqrt(lambda))^2 ; chính xác (tối ưu) cho QPSK thuần nhờ đối xứng. Với n lớn dùng công thức p_l để tránh triệt tiêu. */
M06.peGram=function(n){var s=0;M06.gramEig(n).forEach(function(l){s+=Math.sqrt(l)});return 1-s*s/16};
M06.pClass=function(n){var e=Math.exp(-n);return [e*(Math.cosh(n)+Math.cos(n))/2,e*(Math.sinh(n)+Math.sin(n))/2,e*(Math.cosh(n)-Math.cos(n))/2,e*(Math.sinh(n)-Math.sin(n))/2]};
M06.pe=function(n){ /* ổn định số: 1-(sum sqrt p)^2/4 = ... dùng 1-x với x gần 1 nên viết lại qua tổng bình phương hiệu */
  var p=M06.pClass(n).map(function(x){return Math.sqrt(Math.max(x,0))}),s=p[0]+p[1]+p[2]+p[3];
  /* 1 = sum p_l ; 1-(s^2)/4 = (sum p_l*4 - s^2)/4 = (1/4) sum_{l<m} (sqrt p_l - sqrt p_m)^2 */
  var t=0;for(var a=0;a<4;a++)for(var b=a+1;b<4;b++){var d=p[a]-p[b];t+=d*d}
  return t/4;
};
M06.peBPSK=function(n){var x=Math.exp(-4*n);return x/(2*(1+Math.sqrt(1-x)))};
M06.peAsym=function(n){return 0.5*Math.exp(-2*n)};
/* Gamma-Gamma: trung bình P_e(I n) theo f_I, cầu phương Gauss-Legendre theo log I (khớp m06_verify.py: I_nodes) */
M06.nodes=function(a,b,n){
  var vr=1/a+1/b+1/(a*b),hw=10*Math.sqrt(vr),lo=Math.max(-12,-hw),hi=Math.min(6,hw),gl=QL.gaussLegendre(n),I=[],w=[],s=0;
  for(var i=0;i<n;i++){var li=0.5*(hi-lo)*gl.x[i]+0.5*(hi+lo),Ii=Math.exp(li);I.push(Ii);var wi=0.5*(hi-lo)*gl.w[i]*Math.exp(Math.max(-700,Math.min(700,QL.ggLogPdf(Ii,a,b))))*Ii;if(!isFinite(wi))wi=0;w.push(wi);s+=wi}
  return {I:I,w:w.map(function(x){return x/s})};
};
M06.peTurb=function(f,n,s2,nq){
  if(s2<=0)return f(n);var g=QL.ggParams(s2),nd=M06.nodes(g.alpha,g.beta,nq||48),t=0;
  for(var i=0;i<nd.I.length;i++)t+=nd.w[i]*f(n*nd.I[i]);return t;
};
M06.relay=function(p1,p2){return p1+(1-p1)*p2};
root.M06=M06;
if(typeof module!=='undefined'&&module.exports)module.exports=M06;
if(typeof SIM==='undefined'||!SIM.W)return;
var LANG=(document.documentElement.getAttribute('lang')||'vi').slice(0,2),vi=LANG==='vi';
function T(a,b){return vi?a:b}
function val(r,id){return parseFloat(SIM.$(r,'#'+id).value)}
SIM.W.m06_pe=function(rt){
  SIM.frame(rt,T('P_e của PGM cho QPSK theo n̄ (trị riêng Gram bằng Jacobi)','PGM P_e for QPSK versus n̄ (Gram eigenvalues by Jacobi)'),
   '<div class="row"><label>n̄<sub>max</sub> <input id="nm" value="6" size="4"></label><button class="btn" id="go">'+T('Vẽ','Plot')+'</button></div><div class="out"></div>');
  function run(){
    var nm=val(rt,'nm'),xs=[],q=[],b=[],a=[],c=[],N=24;
    for(var i=1;i<=N;i++){var n=nm*i/N;xs.push(n);q.push(M06.pe(n));b.push(M06.peBPSK(n));a.push(M06.peAsym(n));c.push(0.75*Math.exp(-n))}
    var rows=[0.5,1,2,3].map(function(n){var jacobi=M06.peGram(n);return [SIM.f(n,3),SIM.f(jacobi,5),SIM.f(M06.pe(n),5),SIM.f(M06.peBPSK(n),4),SIM.f(M06.peAsym(n),4),SIM.f(0.75*Math.exp(-n),4)]});
    SIM.$(rt,'.out').innerHTML=SIM.plot([{x:xs,y:q,label:T('QPSK, PGM = tối ưu','QPSK, PGM = optimal')},{x:xs,y:b,label:'BPSK'},{x:xs,y:a,label:T('xấp xỉ ½e^{-2n̄}','approx ½e^{-2n̄}'),color:'#a05a00'},{x:xs,y:c,label:T('tài liệu: ¾e^{-n̄}','document: ¾e^{-n̄}'),color:'#6b3fa0'}],{logy:true,xlabel:'n̄ = |α|²',ylabel:'P_e',ymin:1e-8,ymax:1})+
      SIM.tbl(['n̄',T('Jacobi trên Gram','Jacobi on Gram'),T('công thức p_l','p_l formula'),'BPSK','½e^{-2n̄}','¾e^{-n̄}'],rows);
  }
  SIM.$(rt,'#go').onclick=run;run();
};
SIM.W.m06_turb=function(rt){
  SIM.frame(rt,T('P_e của QPSK và BPSK dưới nhiễu loạn Gamma-Gamma (trạng thái thuần)','QPSK and BPSK P_e under Gamma-Gamma turbulence (pure states)'),
   '<div class="row"><label>σ<sub>R</sub>² <input id="s2" value="0.5" size="4"></label><label>n̄<sub>max</sub> <input id="nm" value="8" size="4"></label><button class="btn" id="go">'+T('Vẽ','Plot')+'</button></div><div class="out"></div>');
  function run(){
    var s2=val(rt,'s2'),nm=val(rt,'nm'),xs=[],q=[],b=[],N=16,g=QL.ggParams(s2);
    for(var i=1;i<=N;i++){var n=nm*i/N;xs.push(n);q.push(M06.peTurb(M06.pe,n,s2));b.push(M06.peTurb(M06.peBPSK,n,s2))}
    var rows=[3,7,11,15].map(function(i){return [SIM.f(xs[i],3),SIM.f(q[i],4),SIM.f(b[i],4),SIM.f(q[i]/b[i],3)]});
    SIM.$(rt,'.out').innerHTML='<p>α = <b>'+SIM.f(g.alpha,4)+'</b>, β = <b>'+SIM.f(g.beta,4)+'</b></p>'+SIM.plot([{x:xs,y:q,label:'QPSK'},{x:xs,y:b,label:'BPSK'}],{logy:true,xlabel:'n̄',ylabel:'P_e',ymin:1e-8,ymax:1})+SIM.tbl(['n̄','QPSK','BPSK',T('tỉ số','ratio')],rows);
  }
  SIM.$(rt,'#go').onclick=run;run();
};
})(typeof window!=='undefined'?window:globalThis);
