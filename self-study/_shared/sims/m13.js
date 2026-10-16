/* Widget module 13: tham số hoá Cholesky rho=LL^T/Tr, cận Helstrom của cặp rho, và cắt cụt Fock.
   Hàm lõi (M13.*) dùng QL.jacobiEig/QL.helstromError/QL.coherentAmps từ qlib.js; đối chiếu Python ở data/verify/m13_verify.py. */
(function(root){
'use strict';
var QL=root.QL||(typeof require!=='undefined'?require('../qlib.js'):null);
var M13={};
function softplus(x){return x>30?x:Math.log(1+Math.exp(x))}
M13.softplus=softplus;
M13.zeros=function(d){var a=[];for(var i=0;i<d;i++)a.push(new Array(d).fill(0));return a};
/* raw: mảng d*d (hàng trước). mode 'chol': tril, đường chéo softplus+1e-5, rho=LL^T/Tr. mode 'raw': đối xứng hoá rồi dịch vết về 1 (RawMatrixHead). */
M13.rhoFromRaw=function(raw,d,mode){
  var R=M13.zeros(d),i,j,k;
  for(i=0;i<d;i++)for(j=0;j<d;j++)R[i][j]=raw[i*d+j]||0;
  if(mode==='raw'){
    var S=M13.zeros(d),tr=0;
    for(i=0;i<d;i++)for(j=0;j<d;j++)S[i][j]=0.5*(R[i][j]+R[j][i]);
    for(i=0;i<d;i++)tr+=S[i][i];
    for(i=0;i<d;i++)S[i][i]-=(tr-1)/d;
    return S;
  }
  var L=M13.zeros(d);
  for(i=0;i<d;i++)for(j=0;j<=i;j++)L[i][j]=(i===j)?softplus(R[i][j])+1e-5:R[i][j];
  var G=M13.zeros(d),t=0;
  for(i=0;i<d;i++)for(j=0;j<d;j++){var s=0;for(k=0;k<d;k++)s+=L[i][k]*L[j][k];G[i][j]=s}
  for(i=0;i<d;i++)t+=G[i][i];
  t=Math.max(t,1e-8);
  for(i=0;i<d;i++)for(j=0;j<d;j++)G[i][j]/=t;
  return G;
};
M13.eigs=function(A){return QL.jacobiEig(A,false).vals.slice().sort(function(a,b){return a-b})};
M13.pe=function(r0,r1){return QL.helstromError(r0,r1,0.5)};   /* 1/2(1-||(r0-r1)/2||_1), chưa kẹp */
M13.parity=function(rho){var d=rho.length,o=M13.zeros(d);for(var i=0;i<d;i++)for(var j=0;j<d;j++)o[i][j]=(((i+j)%2)?-1:1)*rho[i][j];return o};
/* cắt cụt Fock: trạng thái |+a> và |-a> (a=sqrt(nbar)) trong d mức, chuẩn hoá lại */
M13.truncPe=function(nbar,d){
  var a=Math.sqrt(nbar),v0=QL.coherentAmps(a,d),v1=QL.coherentAmps(-a,d),n0=0,n1=0,i,j;
  v0.forEach(function(x){n0+=x*x});v1.forEach(function(x){n1+=x*x});
  var r0=M13.zeros(d),r1=M13.zeros(d);
  for(i=0;i<d;i++)for(j=0;j<d;j++){r0[i][j]=v0[i]*v0[j]/n0;r1[i][j]=v1[i]*v1[j]/n1}
  return M13.pe(r0,r1);
};
M13.purePe=function(nbar){return QL.helstromBPSKPure(nbar)};
M13.rng=function(seed){var s=seed>>>0;return function(){s|=0;s=s+0x6D2B79F5|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
if(typeof module!=='undefined'&&module.exports)module.exports=M13;
root.M13=M13;

var SIM=root.SIM;if(!SIM||!SIM.W)return;
function fmtM(A){return SIM.tbl([''].concat(A.map(function(_,j){return j})),A.map(function(r,i){return [String(i)].concat(r.map(function(x){return SIM.f(x,3)}))}))}
function lang(){return (document.documentElement.lang||'vi').slice(0,2)==='en'?'en':'vi'}
var T={vi:{title:'Cholesky: ρ = LLᵀ / Tr, rồi cận Helstrom của cặp (ρ₀, ρ₁)',raw0:'Đầu ra thô của đầu mạng cho ρ₀ (d×d, hàng trước)',raw1:'Đầu ra thô cho ρ₁',mode:'Đầu ra',chol:'Cholesky (hợp lệ theo cấu trúc)',raw:'Ma trận thô (chỉ đối xứng hoá + chuẩn hoá vết)',rnd:'Ngẫu nhiên',par:'ρ₁ = Π ρ₀ Π',run:'Tính',eig0:'Trị riêng của ρ₀',eig1:'Trị riêng của ρ₁',tr:'Vết',min:'Trị riêng nhỏ nhất',pe:'P_e Helstrom = ½(1 − ‖(ρ₀−ρ₁)/2‖₁)',okpsd:'PSD đúng',badpsd:'KHÔNG PSD: ρ không phải trạng thái',clamp:'Sau khi kẹp vào [0, ½]',nb:'Số photon trung bình n̄',dd:'Số mức Fock d',pt:'Đuôi Poisson P(N ≥ d)',pc:'P_e dạng đóng (trạng thái thuần)',ptr:'P_e sau khi cắt cụt ở d mức',tt:'Cắt cụt Fock: d mức có đủ cho n̄ này không',err:'Sai lệch tương đối'},
 en:{title:'Cholesky: ρ = LLᵀ / Tr, then the Helstrom bound of the pair (ρ₀, ρ₁)',raw0:'Raw head output for ρ₀ (d×d, row-major)',raw1:'Raw output for ρ₁',mode:'Output',chol:'Cholesky (valid by construction)',raw:'Raw matrix (symmetrise + trace-normalise only)',rnd:'Random',par:'ρ₁ = Π ρ₀ Π',run:'Compute',eig0:'Eigenvalues of ρ₀',eig1:'Eigenvalues of ρ₁',tr:'Trace',min:'Smallest eigenvalue',pe:'Helstrom P_e = ½(1 − ‖(ρ₀−ρ₁)/2‖₁)',okpsd:'PSD holds',badpsd:'NOT PSD: ρ is not a state',clamp:'After clamping to [0, ½]',nb:'Mean photon number n̄',dd:'Fock levels d',pt:'Poisson tail P(N ≥ d)',pc:'Closed-form P_e (pure states)',ptr:'P_e after truncation to d levels',tt:'Fock truncation: is d enough for this n̄',err:'Relative error'}};
SIM.W.m13_chol=function(root){
  var t=T[lang()],d=3;
  var def0='0.9 0 0  0.4 0.6 0  -0.2 0.3 0.5',def1='0.8 0 0  -0.5 0.7 0  0.1 -0.3 0.4';
  SIM.frame(root,t.title,'<div class="row"><label>'+t.raw0+'<br><textarea class="a0" rows="2">'+def0+'</textarea></label></div><div class="row"><label>'+t.raw1+'<br><textarea class="a1" rows="2">'+def1+'</textarea></label></div>'+
   '<div class="row"><label>'+t.mode+' <select class="md"><option value="chol">'+t.chol+'</option><option value="raw">'+t.raw+'</option></select></label><button class="btn rnd" type="button">'+t.rnd+'</button> <button class="btn par" type="button">'+t.par+'</button> <button class="btn go" type="button">'+t.run+'</button></div><div class="out"></div>');
  var a0=SIM.$(root,'.a0'),a1=SIM.$(root,'.a1'),md=SIM.$(root,'.md'),out=SIM.$(root,'.out');
  function run(){
    var r0=M13.rhoFromRaw(SIM.nums(a0.value),d,md.value),r1=M13.rhoFromRaw(SIM.nums(a1.value),d,md.value);
    var e0=M13.eigs(r0),e1=M13.eigs(r1),pe=M13.pe(r0,r1),tr0=0,tr1=0;
    for(var i=0;i<d;i++){tr0+=r0[i][i];tr1+=r1[i][i]}
    var ok=e0[0]>=-1e-12&&e1[0]>=-1e-12;
    out.innerHTML='<div class="row"><div>ρ₀'+fmtM(r0)+'</div><div>ρ₁'+fmtM(r1)+'</div></div>'+
     SIM.tbl(['',t.eig0,t.eig1],[[t.tr,SIM.f(tr0,6),SIM.f(tr1,6)],[t.min,SIM.f(e0[0],4),SIM.f(e1[0],4)],[ 'λ', e0.map(function(x){return SIM.f(x,3)}).join(', '),e1.map(function(x){return SIM.f(x,3)}).join(', ')]])+
     '<p class="'+(ok?'ok':'no')+'">'+(ok?t.okpsd:t.badpsd)+'</p><p><b>'+t.pe+' = '+SIM.f(pe,6)+'</b> &nbsp; ('+t.clamp+': '+SIM.f(Math.min(0.5,Math.max(0,pe)),6)+')</p>';
  }
  function setR(seed){var g=M13.rng(seed),A=[],B=[];for(var i=0;i<d*d;i++){A.push((g()*2-1).toFixed(2));B.push((g()*2-1).toFixed(2))}a0.value=A.join(' ');a1.value=B.join(' ');run()}
  var seed=1;
  SIM.$(root,'.rnd').onclick=function(){seed++;setR(seed*7919)};
  SIM.$(root,'.par').onclick=function(){var r0=M13.rhoFromRaw(SIM.nums(a0.value),d,md.value);var P=M13.parity(r0);var raw=[];for(var i=0;i<d;i++)for(var j=0;j<d;j++)raw.push(0);
    /* đặt L1 sao cho L1L1ᵀ = ΠL0L0ᵀΠ: L1 = ΠL0 (đảo dấu hàng lẻ), nên giữ đường chéo thô và đảo dấu phần dưới ở hàng lẻ */
    var v=SIM.nums(a0.value);for(var i=0;i<d;i++)for(var j=0;j<d;j++)raw[i*d+j]=(i%2&&i!==j)?-v[i*d+j]:v[i*d+j];a1.value=raw.join(' ');run()};
  SIM.$(root,'.go').onclick=run;md.onchange=run;run();
};
SIM.W.m13_trunc=function(root){
  var t=T[lang()];
  SIM.frame(root,t.tt,'<div class="row"><label>'+t.nb+' <input class="nb" type="number" value="1.1" step="0.1" min="0.05" max="30" style="width:80px"></label> <button class="btn go" type="button">'+t.run+'</button></div><div class="out"></div>');
  var nb=SIM.$(root,'.nb'),out=SIM.$(root,'.out');
  function run(){
    var n=parseFloat(nb.value)||1,pc=M13.purePe(n),rows=[4,8,16,32,64].map(function(d){var p=M13.truncPe(n,d),tail=QL.poissonTail(n,d);return [String(d),SIM.f(tail,3),SIM.f(p,5),SIM.f(Math.abs(p-pc)/pc,3)]});
    out.innerHTML='<p>'+t.pc+': <b>'+SIM.f(pc,6)+'</b></p>'+SIM.tbl([t.dd,t.pt,t.ptr,t.err],rows);
  }
  SIM.$(root,'.go').onclick=run;nb.onchange=run;run();
};
})(typeof window!=='undefined'?window:globalThis);
