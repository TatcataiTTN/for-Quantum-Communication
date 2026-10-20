/* Widget m12: khoang cach vet D, do trung thuc F, bat dang thuc Fuchs-van de Graaf va P_e Helstrom.
   Trang thai thuc doi xung (qubit nam trong mat phang x-z cua cau Bloch): rho=(I + r*(sin(phi)X + cos(phi)Z))/2.
   Moi phep tinh ma tran dung QL.jacobiEig (qlib.js); doi chieu numpy bang data/verify/m12_verify.py + tests node. */
(function(){
'use strict';
var M={};
M.qubit=function(r,phi){var s=r*Math.sin(phi),c=r*Math.cos(phi);return [[(1+c)/2,s/2],[s/2,(1-c)/2]]};
M.sqrtm=function(A){var e=QL.jacobiEig(A,true),n=A.length,R=[];
  for(var i=0;i<n;i++){R.push(new Array(n).fill(0))}
  for(var k=0;k<n;k++){var l=Math.sqrt(Math.max(e.vals[k],0));
    for(var i=0;i<n;i++)for(var j=0;j<n;j++)R[i][j]+=l*e.vecs[i][k]*e.vecs[j][k]}
  return R};
M.mul=function(A,B){var n=A.length,C=[];for(var i=0;i<n;i++){C.push(new Array(n).fill(0));for(var j=0;j<n;j++)for(var k=0;k<n;k++)C[i][j]+=A[i][k]*B[k][j]}return C};
M.traceNorm=function(A){var s=0;QL.jacobiEig(A,false).vals.forEach(function(v){s+=Math.abs(v)});return s};
M.fidelity=function(r0,r1){var s=M.sqrtm(r0),X=M.mul(M.mul(s,r1),s),e=QL.jacobiEig(X,false).vals,t=0;
  e.forEach(function(v){t+=Math.sqrt(Math.max(v,0))});return t};           /* F=Tr sqrt(sqrt(r0) r1 sqrt(r0)) */
M.traceDist=function(r0,r1){var n=r0.length,D=[];for(var i=0;i<n;i++){D.push([]);for(var j=0;j<n;j++)D[i].push(r0[i][j]-r1[i][j])}return 0.5*M.traceNorm(D)};
M.helstrom=function(r0,r1,p0){return QL.helstromError(r0,r1,p0)};
M.analyse=function(r0,r1,p0){var D=M.traceDist(r0,r1),F=M.fidelity(r0,r1);
  return {D:D,F:F,lo:1-F,hi:Math.sqrt(Math.max(0,1-F*F)),Pe:0.5*(1-D),PeP:M.helstrom(r0,r1,p0)}};
window.M12=M;
if(typeof module!=='undefined')module.exports=M;
if(typeof SIM==='undefined')return;
SIM.W.m12=function(root){
  var vi=(document.documentElement.lang||'vi')==='vi';
  var T=vi?{t:'Khoảng cách vết, độ trung thực và cận Helstrom',r:'bán kính Bloch r',ph:'góc φ (độ)',p:'xác suất tiên nghiệm p0',s0:'Trạng thái ρ0',s1:'Trạng thái ρ1',ok:'đúng',bad:'SAI',
    chk:'Kiểm tra bất đẳng thức Fuchs-van de Graaf',pe:'P_e Helstrom (p0 = 1/2)',pep:'P_e Helstrom (p0 đã chọn)',bp:'BPSK kết hợp thuần: n̄ → P_e',nb:'số photon trung bình n̄'}
   :{t:'Trace distance, fidelity and the Helstrom bound',r:'Bloch radius r',ph:'angle φ (deg)',p:'prior p0',s0:'State ρ0',s1:'State ρ1',ok:'holds',bad:'FAILS',
    chk:'Fuchs-van de Graaf inequality check',pe:'Helstrom P_e (p0 = 1/2)',pep:'Helstrom P_e (chosen p0)',bp:'Pure coherent BPSK: n̄ → P_e',nb:'mean photon number n̄'};
  function sl(id,lab,min,max,step,val){return '<label style="display:block;font-size:.85rem">'+lab+' <b id="'+id+'v"></b><input type="range" id="'+id+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+val+'" style="width:100%"></label>'}
  SIM.frame(root,T.t,'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><b>'+T.s0+'</b>'+sl('a_r0',T.r,0,1,0.01,1)+sl('a_f0',T.ph,0,180,1,0)+'</div><div><b>'+T.s1+'</b>'+sl('a_r1',T.r,0,1,0.01,1)+sl('a_f1',T.ph,0,180,1,60)+'</div></div>'+sl('a_p',T.p,0.05,0.95,0.01,0.5)+'<div id="a_out" style="margin-top:8px"></div><h4 style="margin:10px 0 4px">'+T.bp+'</h4>'+sl('a_n',T.nb,0.05,2,0.05,0.5)+'<div id="a_bp"></div>');
  function g(id){return +SIM.$(root,'#'+id).value}
  function upd(){
    ['a_r0','a_f0','a_r1','a_f1','a_p','a_n'].forEach(function(id){SIM.$(root,'#'+id+'v').textContent=SIM.f(g(id),3)});
    var r0=M.qubit(g('a_r0'),g('a_f0')*Math.PI/180),r1=M.qubit(g('a_r1'),g('a_f1')*Math.PI/180),a=M.analyse(r0,r1,g('a_p'));
    var tol=1e-9,okL=a.lo<=a.D+tol,okU=a.D<=a.hi+tol;
    SIM.$(root,'#a_out').innerHTML=SIM.tbl(['D = ½Tr|ρ0−ρ1|','F = Tr√(√ρ0 ρ1 √ρ0)','1−F','√(1−F²)',T.pe,T.pep],[[SIM.f(a.D,5),SIM.f(a.F,5),SIM.f(a.lo,5),SIM.f(a.hi,5),SIM.f(a.Pe,5),SIM.f(a.PeP,5)]])+
      '<p>'+T.chk+': 1−F ≤ D <b>'+(okL?T.ok:T.bad)+'</b>; D ≤ √(1−F²) <b>'+(okU?T.ok:T.bad)+'</b>.</p>';
    var n=g('a_n'),ov=Math.exp(-4*n),pe=QL.helstromBPSKPure(n);
    SIM.$(root,'#a_bp').innerHTML=SIM.tbl(['|⟨α|−α⟩|² = e^(−4n̄)','F = e^(−2n̄)','D = √(1−e^(−4n̄))','P_e'],[[SIM.f(ov,5),SIM.f(Math.exp(-2*n),5),SIM.f(Math.sqrt(1-ov),5),SIM.f(pe,5)]]);
  }
  root.querySelectorAll('input').forEach(function(e){e.addEventListener('input',upd)});upd();
};
})();
