/* Widget m04: phân biệt M trạng thái kết hợp (M-PSK). Mọi hàm đối chiếu Python trong data/verify/m04_verify.py
   (kiểm bằng tests Node: xem cuối tệp). Dùng QL.jacobiEig, QL.erf, QL.gaussLegendre từ qlib.js. */
(function(root){
'use strict';
var QL=root.QL||(typeof require!=='undefined'?require('../qlib.js'):null);
var M4={};
M4.erfc=function(x){return 1-QL.erf(x)};
/* Ma trận Gram Hermite G_ij=<a_i|a_j>=exp(-n+conj(a_i)a_j), a_k=sqrt(n)e^{2 pi i k/M}; trả {A,B}, G=A+iB */
M4.gram=function(M,n){var A=[],B=[];for(var i=0;i<M;i++){A.push([]);B.push([]);for(var j=0;j<M;j++){
  var d=2*Math.PI*(j-i)/M,m=Math.exp(-n*(1-Math.cos(d)));A[i].push(m*Math.cos(-n*Math.sin(d)));B[i].push(m*Math.sin(-n*Math.sin(d)))}}
  return {A:A,B:B}};
/* Căn bậc hai ma trận Gram bằng jacobiEig trên bản nhúng thực đối xứng 2M x 2M [[A,-B],[B,A]] (mỗi trị riêng xuất hiện hai lần).
   PGM (phép đo căn bậc hai) trùng Helstrom với các trạng thái đều về hình học: Pc=(1/M) sum_i |(sqrt G)_ii|^2. */
M4.pcPGM=function(M,n){
  var g=M4.gram(M,n),N=2*M,E=[],i,j,k;
  for(i=0;i<N;i++){E.push(new Array(N).fill(0))}
  for(i=0;i<M;i++)for(j=0;j<M;j++){E[i][j]=g.A[i][j];E[i][j+M]=-g.B[i][j];E[i+M][j]=g.B[i][j];E[i+M][j+M]=g.A[i][j]}
  var e=QL.jacobiEig(E,true),sr=[];for(i=0;i<N;i++)sr.push(Math.sqrt(Math.max(e.vals[i],0)));
  /* S=V diag(sqrt) V^T; phần tử phức S_ii = S[i][i]+ i S[i+M][i]; mỗi cặp suy biến cho cùng S nên đủ lấy khối trên-trái */
  var pc=0;for(i=0;i<M;i++){var re=0,im=0;for(k=0;k<N;k++){re+=e.vecs[i][k]*sr[k]*e.vecs[i][k];im+=e.vecs[i+M][k]*sr[k]*e.vecs[i][k]}
    pc+=re*re+im*im}
  return pc/M};
M4.peHelstrom=function(M,n){return 1-M4.pcPGM(M,n)};
M4.peSQLqpsk=function(n){var q=0.5*M4.erfc(Math.sqrt(n/2));return 1-(1-q)*(1-q)};     /* Becerra 2013, Eq.(2) */
M4.peHomodyneBPSK=function(n){return 0.5*M4.erfc(Math.sqrt(2*n))};
M4.peHeterodyne=function(M,n){            /* phân bố pha của alpha+z, E|z|^2=1; quyết định theo sector |theta|<pi/M */
  var gl=QL.gaussLegendre(64),h=Math.PI/M,s=0;
  for(var i=0;i<64;i++){var t=h*gl.x[i],c=Math.cos(t),sn=Math.sin(t);
    var f=(0.5*Math.exp(-n)+0.5*Math.sqrt(Math.PI*n)*c*Math.exp(-n*sn*sn)*(1+QL.erf(Math.sqrt(n)*c)))/Math.PI;s+=h*gl.w[i]*f}
  return 1-s};
M4.betaOpt=function(n,T){var a=Math.sqrt(T*n/2);if(a<1e-9)return 0;var lo=0,hi=a+1;
  for(var i=0;i<200;i++){var m=(lo+hi)/2;if(m*Math.tanh(2*a*m)-a>0)hi=m;else lo=m}return (lo+hi)/2};
M4.podBinary=function(n,T,b){var a=Math.sqrt(T*n/2);return 0.5-Math.exp(-(a*a+b*b))*Math.sinh(2*a*b)};   /* Müller 2012, Eq.(13) */
M4.peHDK=function(n,T){var r=Math.sqrt(1-T);return 1-0.5*(1+QL.erf(r*Math.sqrt(n)))*(1-0.5*Math.exp(-2*T*n))};   /* Eq.(8) */
M4.peHDOD=function(n,T){var r=Math.sqrt(1-T),b=M4.betaOpt(n,T);return 1-0.5*(1+QL.erf(r*Math.sqrt(n)))*(1-M4.podBinary(n,T,b))};
M4.minT=function(f,n){var best=1e9,bt=0.5,i,N=120;for(i=1;i<N;i++){var T=i/N,v=f(n,T);if(v<best){best=v;bt=T}}
  var lo=Math.max(1e-4,bt-1/N),hi=Math.min(1-1e-4,bt+1/N),g=(Math.sqrt(5)-1)/2;
  for(i=0;i<60;i++){var c=hi-g*(hi-lo),d=lo+g*(hi-lo);if(f(n,c)<f(n,d))hi=d;else lo=c}
  bt=(lo+hi)/2;return {pe:f(n,bt),T:bt}};
root.M4=M4;
if(typeof module!=='undefined'&&module.exports)module.exports=M4;
/* ---------- Widget ---------- */
if(typeof window!=='undefined'&&window.SIM){
var SIM=window.SIM;
SIM.W.mpsk_pe=function(root_){
  var T=SIM.tbl;
  SIM.frame(root_,'P<sub>e</sub> của M-PSK: Helstrom (PGM) và giới hạn lượng tử chuẩn / <span lang="en">P<sub>e</sub> of M-PSK: Helstrom (PGM) vs the standard quantum limit</span>',
    '<div class="row"><label>M <select class="m"><option>2</option><option>3</option><option selected>4</option><option>8</option></select></label> '+
    '<label>n&#772; max <input class="nmax" type="number" value="6" min="1" max="12" step="1" style="width:4em"></label></div><div class="out"></div>');
  function run(){var M=+SIM.$(root_,'.m').value,nm=+SIM.$(root_,'.nmax').value,xs=[],h=[],s=[],k,rows=[];
    for(k=1;k<=60;k++){var n=nm*k/60;xs.push(n);var hh=M4.peHelstrom(M,n),ss=(M===2)?M4.peHomodyneBPSK(n):M4.peHeterodyne(M,n);h.push(hh);s.push(ss)}
    [0.5,1,2,4].forEach(function(n){if(n<=nm){var hh=M4.peHelstrom(M,n),ss=(M===2)?M4.peHomodyneBPSK(n):M4.peHeterodyne(M,n);
      rows.push([SIM.f(n,3),SIM.f(hh,4),SIM.f(ss,4),SIM.f(ss/hh,3)])}});
    SIM.$(root_,'.out').innerHTML=SIM.plot([{x:xs,y:h,label:'Helstrom = PGM',color:'#b3122f'},{x:xs,y:s,label:(M===2?'homodyne':'heterodyne (SQL)'),color:'#1f4e8c'}],{logy:true,xlabel:'n̄ = |α|²',ylabel:'P_e',ymin:1e-9})+
      T(['n̄','P_e Helstrom','P_e SQL','SQL / Helstrom'],rows)}
  root_.addEventListener('change',run);root_.addEventListener('input',run);run()};
SIM.W.hybrid_qpsk=function(root_){
  var T=SIM.tbl;
  SIM.frame(root_,'QPSK: máy thu lai HD-K, HD-OD so với dị sai / <span lang="en">QPSK: hybrid HD-K and HD-OD receivers vs heterodyne</span>','<div class="row"><label>n&#772; max <input class="nmax" type="number" value="3" min="0.5" max="6" step="0.5" style="width:4em"></label></div><div class="out"></div>');
  function run(){var nm=+SIM.$(root_,'.nmax').value,xs=[],a=[],b=[],c=[],k,rows=[];
    for(k=1;k<=40;k++){var n=nm*k/40,het=M4.peSQLqpsk(n);xs.push(n);a.push(1);b.push(M4.minT(M4.peHDK,n).pe/het);c.push(M4.minT(M4.peHDOD,n).pe/het)}
    [0.5,1,1.8,3].forEach(function(n){if(n<=nm){var het=M4.peSQLqpsk(n),K=M4.minT(M4.peHDK,n),O=M4.minT(M4.peHDOD,n),H=M4.peHelstrom(4,n);
      rows.push([SIM.f(n,3),SIM.f(K.pe/het,4),SIM.f(O.pe/het,4),SIM.f(O.T,3),SIM.f(H/het,4)])}});
    SIM.$(root_,'.out').innerHTML=SIM.plot([{x:xs,y:a,label:'heterodyne = 1',color:'#a05a00'},{x:xs,y:b,label:'HD-K',color:'#1b7f4c'},{x:xs,y:c,label:'HD-OD',color:'#1f4e8c'}],{xlabel:'n̄ = |α|²',ylabel:'P_e / P_e(heterodyne)',ymin:0.8,ymax:1.2})+
      T(['n̄','HD-K','HD-OD','t² tối ưu (OD)','Helstrom'],rows)}
  root_.addEventListener('input',run);run()};
}
})(typeof window!=='undefined'?window:this);
