/* m08: cận Chernoff lượng tử. Hàm lõi QC.* (thuần JS, chạy được trong Node để đối chiếu Python ở data/verify/m08_verify.py)
   và widget SIM.W.chernoff. Mọi phép lấy luỹ thừa ma trận dùng QL.jacobiEig (qlib.js). */
(function(root){
'use strict';
var QL=root.QL||(typeof require!=='undefined'?require('../qlib.js'):null);
var QC={};
QC.EPS=1e-14;
/* Phân rã trạng thái: eigenvalues đã cắt về 0 nếu < EPS, và ma trận chồng lấn D_ij=(v_i.w_j)^2 */
QC.prep=function(rho,sig){
  var d=rho.length,a=QL.jacobiEig(rho,true),b=QL.jacobiEig(sig,true),D=[];
  for(var i=0;i<d;i++){D.push([]);for(var j=0;j<d;j++){var s=0;for(var k=0;k<d;k++)s+=a.vecs[k][i]*b.vecs[k][j];D[i].push(s*s)}}
  var lam=a.vals.map(function(x){return x>QC.EPS?x:0}),mu=b.vals.map(function(x){return x>QC.EPS?x:0});
  return {lam:lam,mu:mu,D:D};
};
/* Q_s = Tr(rho^s sigma^(1-s)) = sum_ij lam_i^s mu_j^(1-s) |U_ij|^2  (Audenaert 2007, sau Eq. 6) */
QC.Qs=function(P,s){
  var t=0,d=P.lam.length;
  for(var i=0;i<d;i++){if(P.lam[i]<=0)continue;var li=Math.pow(P.lam[i],s);
    for(var j=0;j<d;j++){if(P.mu[j]<=0)continue;t+=li*Math.pow(P.mu[j],1-s)*P.D[i][j]}}
  return t;
};
/* Q = min_{s in [0,1]} Q_s. Q_s lồi theo s nên tìm tam phân/vàng trên [e,1-e] là đủ. */
QC.qMin=function(rho,sig){
  var P=QC.prep(rho,sig),lo=1e-6,hi=1-1e-6,g=(Math.sqrt(5)-1)/2;
  var c=hi-g*(hi-lo),d=lo+g*(hi-lo),fc=QC.Qs(P,c),fd=QC.Qs(P,d);
  for(var it=0;it<80;it++){
    if(fc<fd){hi=d;d=c;fd=fc;c=hi-g*(hi-lo);fc=QC.Qs(P,c)}
    else{lo=c;c=d;fc=fd;d=lo+g*(hi-lo);fd=QC.Qs(P,d)}
  }
  var s=(lo+hi)/2;return {Q:QC.Qs(P,s),s:s,P:P};
};
QC.kron=function(A,B){
  var a=A.length,b=B.length,C=[];
  for(var i=0;i<a*b;i++)C.push(new Array(a*b).fill(0));
  for(var i=0;i<a;i++)for(var j=0;j<a;j++){var x=A[i][j];if(x===0)continue;
    for(var k=0;k<b;k++)for(var l=0;l<b;l++)C[i*b+k][j*b+l]=x*B[k][l]}
  return C;
};
QC.kronPow=function(A,N){var o=A;for(var n=1;n<N;n++)o=QC.kron(o,A);return o};
/* Trạng thái qubit thực: Bloch r*(cos t, sin t) theo (Z,X): rho = (I + z Z + x X)/2 */
QC.qubit=function(r,thetaRad){
  var z=r*Math.cos(thetaRad),x=r*Math.sin(thetaRad);
  return [[0.5*(1+z),0.5*x],[0.5*x,0.5*(1-z)]];
};
/* Cận dưới/trên của P_e cho N bản sao: (1-sqrt(1-Q^{2N}))/2 <= P_e <= Q^N/2 (Audenaert Eq. 6 + Eq. 4) */
QC.bounds=function(Q,N){return {lower:0.5*(1-Math.sqrt(Math.max(0,1-Math.pow(Q,2*N)))),upper:0.5*Math.pow(Q,N)}};
QC.pureBPSK=function(nbar,N){var Q=Math.exp(-4*nbar);return {Q:Q,exact:0.5*(1-Math.sqrt(Math.max(0,1-Math.pow(Q,N))))}};
/* Gaussian đóng (Calsamiglia Eq. 94, r=0): ±alpha dịch chuyển trạng thái nhiệt n_th */
QC.thermalBPSK=function(alpha,nth){var beta=Math.log(1+1/nth);return Math.exp(-4*alpha*alpha*Math.tanh(beta/4))};
if(typeof module!=='undefined'&&module.exports)module.exports=QC;else root.QC=QC;

/* ---------------- Widget ---------------- */
if(typeof window==='undefined'||!window.SIM)return;
var SIM=window.SIM,EN=(document.documentElement.lang==='en');
var T=function(v,e){return EN?e:v};
SIM.W.chernoff=function(root){
  var id='ch'+Math.random().toString(36).slice(2,7);
  var body='<div class="row"><label>'+T('Họ trạng thái','State family')+' <select id="'+id+'f"><option value="q">'+T('Qubit hỗn hợp (r, θ)','Mixed qubits (r, θ)')+'</option><option value="fso">'+T('Trạng thái kênh FSO (BPSK)','FSO channel states (BPSK)')+'</option><option value="pure">'+T('BPSK kết hợp thuần','Pure coherent BPSK')+'</option></select></label>'+
   '<label>N <input id="'+id+'N" type="number" min="1" max="6" value="3" style="width:56px"></label></div>'+
   '<div class="row" id="'+id+'pq"><label>r₀ <input id="'+id+'r0" type="number" step="0.05" min="0" max="1" value="0.8" style="width:70px"></label>'+
   '<label>r₁ <input id="'+id+'r1" type="number" step="0.05" min="0" max="1" value="0.8" style="width:70px"></label>'+
   '<label>θ (°) <input id="'+id+'th" type="number" step="5" min="0" max="180" value="90" style="width:70px"></label></div>'+
   '<div class="row" id="'+id+'pf" style="display:none"><label>n̄ <input id="'+id+'nb" type="number" step="0.1" min="0.05" max="2" value="0.5" style="width:70px"></label>'+
   '<label>σ <input id="'+id+'sg" type="number" step="0.05" min="0" max="1" value="0.3" style="width:70px"></label>'+
   '<label>σ<sub>R</sub>² <input id="'+id+'sr" type="number" step="0.1" min="0.05" max="3" value="1" style="width:70px"></label></div>'+
   '<div class="out" id="'+id+'o"></div>';
  SIM.frame(root,T('Q(s), cận Chernoff và xác suất lỗi Helstrom','Q(s), the Chernoff bound and the Helstrom error'),body);
  var $=function(k){return root.querySelector('#'+id+k)};
  function build(){
    var fam=$('f').value,N=Math.max(1,Math.min(6,Math.round(+$('N').value||1)));
    var rho0,rho1,note='';
    if(fam==='q'){rho0=QC.qubit(+$('r0').value,0);rho1=QC.qubit(+$('r1').value,(+$('th').value)*Math.PI/180);}
    else if(fam==='fso'){
      N=Math.min(N,2);
      var nb=+$('nb').value,sg=+$('sg').value,sr=+$('sr').value,g=QL.ggParams(sr),st=QL.channelStates(nb,sg,g.alpha,g.beta,8,24,7);
      rho0=st.rho0;rho1=st.rho1;note=T('Cắt Fock d = 8; N ≤ 2 (ma trận 8^N). Các bản sao được giả định độc lập.','Fock cutoff d = 8; N ≤ 2 (matrix size 8^N). Copies are assumed independent.');
    } else {
      var nb2=+$('nb').value,a=QL.coherentAmps(Math.sqrt(nb2),8),b=QL.coherentAmps(-Math.sqrt(nb2),8);
      var n=0;a.forEach(function(x){n+=x*x});
      rho0=a.map(function(x){return a.map(function(y){return x*y/n})});rho1=b.map(function(x){return b.map(function(y){return x*y/n})});
      N=Math.min(N,2);note=T('Trạng thái thuần: Q_s không phụ thuộc s, Q = e^(−4n̄).','Pure states: Q_s does not depend on s, Q = e^(−4n̄).');
    }
    var q=QC.qMin(rho0,rho1),Q=q.Q,xs=[],ys=[];
    for(var i=1;i<=39;i++){var s=i/40;xs.push(s);ys.push(QC.Qs(q.P,s))}
    var curve=[{x:xs,y:ys,label:'Q(s)'},{x:[q.s,q.s],y:[Math.min.apply(null,ys)*0.98,Math.max.apply(null,ys)],label:'s* = '+SIM.f(q.s,3),color:'#b3122f'}];
    var Ns=[],hel=[],up=[],lo=[],maxN=(fam==='q')?N:Math.min(N,2);
    for(var k=1;k<=maxN;k++){
      Ns.push(k);var R0=QC.kronPow(rho0,k),R1=QC.kronPow(rho1,k);
      hel.push(QL.helstromError(R0,R1,0.5));var bd=QC.bounds(Q,k);up.push(bd.upper);lo.push(bd.lower);
    }
    var rows=[];
    for(var k=0;k<Ns.length;k++)rows.push([Ns[k],SIM.f(lo[k],4),'<b>'+SIM.f(hel[k],4)+'</b>',SIM.f(up[k],4),SIM.f(hel[k]/up[k],3),(lo[k]<=hel[k]*(1+1e-9)&&hel[k]<=up[k]*(1+1e-9))?'<span class="ok">✓</span>':'<span class="no">✗</span>']);
    var tb=SIM.tbl([ 'N',T('cận dưới','lower'),T('Helstrom đúng','Helstrom exact'),T('cận Chernoff ½Q^N','Chernoff ½Q^N'),T('tỉ số','ratio'),T('kẹp','sandwich')],rows);
    var extra='';
    if(fam==='q'){var r0=+$('r0').value,r1=+$('r1').value,th=(+$('th').value)*Math.PI/180;
      if(Math.abs(r0-r1)<1e-12){var cl=Math.pow(Math.cos(th/2),2)+Math.sqrt(1-r0*r0)*Math.pow(Math.sin(th/2),2);extra='<br>'+T('Công thức đóng khi r₀ = r₁ (s* = 1/2): ','Closed form when r₀ = r₁ (s* = 1/2): ')+'Q = cos²(θ/2) + √(1−r²) sin²(θ/2) = <b>'+SIM.f(cl,5)+'</b>'}}
    if(fam==='pure'){var pb=QC.pureBPSK(+$('nb').value,1);extra='<br>'+T('Helstrom N=1 đúng: ','Exact Helstrom N=1: ')+SIM.f(pb.exact,5)}
    root.querySelector('#'+id+'o').innerHTML=SIM.plot(curve,{xlabel:'s',ylabel:'Q(s) = Tr(ρ^s σ^(1−s))',w:520,h:230})+
      '<p>Q = min<sub>s</sub> Q(s) = <b>'+SIM.f(Q,5)+'</b> (s* = '+SIM.f(q.s,3)+'), ξ<sub>QCB</sub> = −ln Q = <b>'+SIM.f(-Math.log(Q),4)+'</b> '+T('nat/bản sao','nats per copy')+extra+'</p>'+tb+(note?'<p style="font-size:.8em;color:var(--muted)">'+note+'</p>':'');
    var p1=root.querySelector('#'+id+'pq'),p2=root.querySelector('#'+id+'pf');
    p1.style.display=(fam==='q')?'':'none';p2.style.display=(fam==='q')?'none':'';
  }
  ['f','N','r0','r1','th','nb','sg','sr'].forEach(function(k){var e=$(k);e.addEventListener('input',build);e.addEventListener('change',build)});
  build();
};
})(typeof window!=='undefined'?window:this);
