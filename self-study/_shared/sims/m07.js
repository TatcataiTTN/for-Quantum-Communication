/* Widget m07: P_e của phép đo căn bậc hai (SRM) so với cận tối ưu cho M trạng thái kết hợp đối xứng (M-PSK).
   Ma trận Gram Hermite G = A + iB được nhúng thành ma trận thực đối xứng [[A,-B],[B,A]] để dùng QL.jacobiEig (qlib.js).
   Đối chiếu numpy: data/verify/m07_verify.py (srm_pe, mpsk_pe_closed, helstrom_pure) và tests Node trong cùng file này (M07.selfTest). */
(function(){
'use strict';
var M={};
M.gram=function(m,n){ /* G_jk = <a_j|a_k> = exp(-n + n e^{i th (k-j)}), th = 2pi/m; trả {A,B} */
  var A=[],B=[],th=2*Math.PI/m;
  for(var j=0;j<m;j++){A.push([]);B.push([]);for(var k=0;k<m;k++){var d=th*(k-j),mag=Math.exp(-n+n*Math.cos(d));A[j].push(mag*Math.cos(n*Math.sin(d)));B[j].push(mag*Math.sin(n*Math.sin(d)))}}
  return {A:A,B:B};
};
M.embed=function(A,B){var m=A.length,H=[],i,j;for(i=0;i<2*m;i++)H.push(new Array(2*m).fill(0));
  for(i=0;i<m;i++)for(j=0;j<m;j++){H[i][j]=A[i][j];H[i+m][j+m]=A[i][j];H[i][j+m]=-B[i][j];H[i+m][j]=B[i][j]}return H};
M.srmPe=function(m,n,eta){ /* SRM có trọng số: G^w = D G D, P_c = sum_i |(G^w)^{1/2}_ii|^2 */
  var g=M.gram(m,n),A=g.A,B=g.B,i,j;eta=eta||new Array(m).fill(1/m);
  var s=eta.map(Math.sqrt);for(i=0;i<m;i++)for(j=0;j<m;j++){A[i][j]*=s[i]*s[j];B[i][j]*=s[i]*s[j]}
  var e=QL.jacobiEig(M.embed(A,B),true),N=2*m,R=[];for(i=0;i<N;i++)R.push(new Array(N).fill(0));
  for(var k=0;k<N;k++){var l=Math.sqrt(Math.max(e.vals[k],0));for(i=0;i<N;i++)for(j=0;j<N;j++)R[i][j]+=l*e.vecs[i][k]*e.vecs[j][k]}
  var pc=0;for(i=0;i<m;i++)pc+=R[i][i]*R[i][i]+R[i+m][i]*R[i+m][i];return 1-pc;
};
M.eigGram=function(m,n){var g=M.gram(m,n),v=QL.jacobiEig(M.embed(g.A,g.B),false).vals.slice().sort(function(a,b){return a-b}),o=[];for(var i=0;i<v.length;i+=2)o.push((v[i]+v[i+1])/2);return o};
M.closedPe=function(m,n){var s=0;M.eigGram(m,n).forEach(function(x){s+=Math.sqrt(Math.max(x,0))});return 1-s*s/(m*m)};
M.helstrom=function(n,eta0){return 0.5*(1-Math.sqrt(1-4*eta0*(1-eta0)*Math.exp(-4*n)))}; /* |<a|-a>|^2 = e^{-4n} */
M.selfTest=function(){var t=[[2,.5,0.035063252],[3,.5,0.130976],[4,.5,0.261742],[4,1,0.092421],[8,2,0.22297]],ok=true;
  t.forEach(function(r){if(Math.abs(M.srmPe(r[0],r[1])-r[2])>2e-6||Math.abs(M.closedPe(r[0],r[1])-r[2])>2e-6)ok=false});return ok};
window.M07=M;if(typeof module!=='undefined')module.exports=M;
if(typeof SIM==='undefined')return;
SIM.W.m07=function(root){
  var vi=(document.documentElement.lang||'vi')==='vi';
  var T=vi?{t:'P_e của SRM so với cận tối ưu cho M trạng thái kết hợp đối xứng',m:'số trạng thái M',n:'số photon trung bình n̄',e:'xác suất tiên nghiệm η₀ (chỉ cho M = 2)',
    h:['M','P_e của SRM (nhúng thực + jacobiEig)','P_e dạng đóng (1/M²)(Σ√λ)²','Chênh lệch'],opt:'Với M = 2 cận tối ưu là Helstrom; với M > 2 đều hình học thì SRM chính là phép đo tối ưu (Eldar và Forney 2001, Thm 4), nên hai cột phải trùng.',
    he:'P_e Helstrom (M = 2, ưu tiên η₀)',sr:'P_e SRM có trọng số (M = 2, η₀)',gap:'SRM kém tối ưu',curve:'P_e theo n̄ (M cố định)',x:'số photon trung bình n̄',y:'P_e',tab:'Mọi M từ 2 đến 8 tại n̄ đã chọn'}
   :{t:'SRM error versus the optimum for symmetric coherent states',m:'number of states M',n:'mean photon number n̄',e:'prior η₀ (M = 2 only)',
    h:['M','SRM P_e (real embedding + jacobiEig)','Closed form (1/M²)(Σ√λ)²','Difference'],opt:'For M = 2 the optimum is the Helstrom bound; for M > 2 geometrically uniform states the SRM is the optimal measurement (Eldar and Forney 2001, Thm 4), so both columns must agree.',
    he:'Helstrom P_e (M = 2, prior η₀)',sr:'Weighted SRM P_e (M = 2, η₀)',gap:'SRM suboptimality',curve:'P_e versus n̄ (fixed M)',x:'mean photon number n̄',y:'P_e',tab:'All M from 2 to 8 at the chosen n̄'};
  SIM.frame(root,T.t,'<div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin:6px 0">'+
    '<label>'+T.m+': <b class="vm"></b><input class="im" type="range" min="2" max="8" step="1" value="4"></label>'+
    '<label>'+T.n+': <b class="vn"></b><input class="in" type="range" min="0.1" max="3" step="0.05" value="0.5"></label>'+
    '<label>'+T.e+': <b class="ve"></b><input class="ie" type="range" min="0.5" max="0.95" step="0.05" value="0.5"></label></div>'+
    '<div class="out"></div><p style="font-size:.85em">'+T.opt+'</p>');
  var $=function(s){return SIM.$(root,s)};
  function upd(){var m=+$('.im').value,n=+$('.in').value,e=+$('.ie').value;$('.vm').textContent=m;$('.vn').textContent=n.toFixed(2);$('.ve').textContent=e.toFixed(2);
    var rows=[];for(var k=2;k<=8;k++){var a=M.srmPe(k,n),b=M.closedPe(k,n);rows.push({cls:k===m?'sel':'row',cells:[k,SIM.f(a,5),SIM.f(b,5),SIM.f(Math.abs(a-b),2)]})}
    var h=M.helstrom(n,e),s=M.srmPe(2,n,[e,1-e]);
    var xs=[],ys=[],y2=[];for(var i=1;i<=60;i++){var x=i*0.05;xs.push(x);ys.push(Math.max(M.srmPe(m,x),1e-12));y2.push(Math.max(m===2?M.helstrom(x,0.5):M.closedPe(m,x),1e-12))}
    $('.out').innerHTML='<h4>'+T.tab+'</h4>'+SIM.tbl(T.h,rows)+
     '<p>'+T.he+' = <b>'+SIM.f(h,5)+'</b>; '+T.sr+' = <b>'+SIM.f(s,5)+'</b>; '+T.gap+' = <b>'+SIM.f(s-h,3)+'</b></p>'+
     '<h4>'+T.curve+' (M = '+m+')</h4>'+SIM.plot([{x:xs,y:ys,label:'SRM'},{x:xs,y:y2,label:vi?'dạng đóng / Helstrom':'closed form / Helstrom',color:'#b3122f'}],{logy:true,xlabel:T.x,ylabel:T.y,ymin:1e-6,ymax:1});}
  ['.im','.in','.ie'].forEach(function(s){$(s).addEventListener('input',upd)});upd();
};
})();
