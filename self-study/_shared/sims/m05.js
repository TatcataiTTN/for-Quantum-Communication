/* Widget m05: ma trận Gram và P_e của phép đo căn bậc hai (PGM) cho M trạng thái kết hợp đối xứng vòng.
   Hàm thuần (chạy cả trong Node để đối chiếu Python): M05.analyse(nbar,M) -> {gram,lam,pe,peJacobi,...}.
   peJacobi tính độc lập: nhúng Hermite G = A+iB vào ma trận thực đối xứng 2M x 2M, dùng QL.jacobiEig lấy G^{1/2}. */
(function(root){
'use strict';
var QL=root.QL||(typeof require!=='undefined'?require('../qlib.js'):null);
var M05={};
M05.gramRow=function(nb,M){ /* <alpha_0|alpha_j> = exp(-nb(1-w^j)), w=e^{2 pi i/M} */
  var r=[];for(var j=0;j<M;j++){var th=2*Math.PI*j/M,m=Math.exp(-nb*(1-Math.cos(th))),ph=nb*Math.sin(th);r.push({re:m*Math.cos(ph),im:m*Math.sin(ph)})}return r};
M05.gram=function(nb,M){var r=M05.gramRow(nb,M),G=[];for(var j=0;j<M;j++){G.push([]);for(var k=0;k<M;k++)G[j].push(r[((k-j)%M+M)%M])}return G};
M05.lam=function(nb,M){ /* trị riêng của Gram circulant: lambda_m = sum_j r_j w^{jm} */
  var r=M05.gramRow(nb,M),L=[];for(var m=0;m<M;m++){var s=0;for(var j=0;j<M;j++){var th=2*Math.PI*j*m/M;s+=r[j].re*Math.cos(th)-r[j].im*Math.sin(th)}L.push(Math.max(s,0))}return L};
M05.peFromLam=function(L){var s=0;L.forEach(function(v){s+=Math.sqrt(v)});return 1-s*s/(L.length*L.length)};
M05.peJacobi=function(G){ /* SRM cho trạng thái thuần, xác suất đều: P_c=(1/M) sum_i |(G^{1/2})_ii|^2 */
  var M=G.length,E=[],i,j;for(i=0;i<2*M;i++)E.push(new Array(2*M).fill(0));
  for(i=0;i<M;i++)for(j=0;j<M;j++){var a=G[i][j].re,b=G[i][j].im;E[i][j]=a;E[i+M][j+M]=a;E[i+M][j]=b;E[i][j+M]=-b}
  var e=QL.jacobiEig(E,true),n=2*M,S=[];for(i=0;i<n;i++){S.push(new Array(n).fill(0))}
  for(var k=0;k<n;k++){var s=Math.sqrt(Math.max(e.vals[k],0));for(i=0;i<n;i++)for(j=0;j<n;j++)S[i][j]+=s*e.vecs[i][k]*e.vecs[j][k]}
  var pc=0;for(i=0;i<M;i++){pc+=S[i][i]*S[i][i]+S[M+i][i]*S[M+i][i]}return {pe:1-pc/M,vals:e.vals}};
M05.peBPSK=function(nb){return 0.5*(1-Math.sqrt(Math.max(0,1-Math.exp(-4*nb))))};
M05.analyse=function(nb,M){var G=M05.gram(nb,M),L=M05.lam(nb,M),pe=M05.peFromLam(L),pj=M05.peJacobi(G);
  return {gram:G,lam:L,pe:pe,peJacobi:pj.pe,peBPSK:M05.peBPSK(nb),absg:Math.exp(-nb*(1-Math.cos(2*Math.PI/M)))}};
if(typeof module!=='undefined'&&module.exports)module.exports=M05;else root.M05=M05;

if(typeof window!=='undefined'&&window.SIM){
var SIM=window.SIM;
var T={vi:{title:'Máy tính ma trận Gram và P_e của phép đo căn bậc hai',n:'n̄ (photon/ký hiệu)',m:'Số trạng thái M',gram:'Ma trận Gram G (mô-đun và pha, độ)',lam:'Trị riêng của G',pe:'P_e (PGM, tối ưu với trạng thái đối xứng vòng)',cmp:'So với BPSK cùng n̄',asy:'Tiệm cận (M=2: ¼e^{-4n̄}; M=3: ½e^{-3n̄})',chk:'Đối chiếu độc lập (Jacobi trên ma trận nhúng thực)',curve:'P_e theo n̄ (M = 2, 3, 4)',x:'n̄',y:'P_e',note:'Với M trạng thái đối xứng vòng và xác suất đều, phép đo căn bậc hai trùng phép đo tối ưu Helstrom.',ok:'khớp'},
 en:{title:'Gram matrix and square-root-measurement P_e calculator',n:'n̄ (photons/symbol)',m:'Number of states M',gram:'Gram matrix G (modulus and phase, degrees)',lam:'Eigenvalues of G',pe:'P_e (PGM, optimal for ring-symmetric states)',cmp:'Versus BPSK at the same n̄',asy:'Asymptote (M=2: ¼e^{-4n̄}; M=3: ½e^{-3n̄})',chk:'Independent check (Jacobi on the real embedding)',curve:'P_e versus n̄ (M = 2, 3, 4)',x:'n̄',y:'P_e',note:'For M ring-symmetric states with equal priors the square-root measurement coincides with the optimal Helstrom measurement.',ok:'agree'}};
SIM.W.gram_pgm=function(root){
  var lang=(document.documentElement.lang==='en')?'en':'vi',t=T[lang];
  SIM.frame(root,t.title,'<div class="row"><label>'+t.n+' <input type="number" class="in-n" value="1" min="0.05" max="12" step="0.05"></label><label>'+t.m+' <select class="in-m"><option>2</option><option selected>3</option><option>4</option><option>5</option><option>6</option><option>8</option></select></label></div><div class="out"></div>');
  var inN=SIM.$(root,'.in-n'),inM=SIM.$(root,'.in-m'),out=SIM.$(root,'.out');
  function f(x){return SIM.f(x,4)}
  function run(){
    var nb=Math.max(0.05,Math.min(12,parseFloat(inN.value)||1)),M=parseInt(inM.value,10),r=M05.analyse(nb,M),h='';
    var rows=r.gram.map(function(row,j){return ['|α<sub>'+j+'</sub>⟩'].concat(row.map(function(c){var mod=Math.sqrt(c.re*c.re+c.im*c.im),ph=Math.atan2(c.im,c.re)*180/Math.PI;return f(mod)+' ∠'+(Math.abs(ph)<1e-9?'0':ph.toFixed(1))+'°'}))});
    var head=['']; for(var k=0;k<M;k++)head.push('⟨α<sub>'+k+'</sub>|');
    h+='<p><b>'+t.gram+'</b></p>'+SIM.tbl(head,rows);
    h+='<p><b>'+t.lam+':</b> '+r.lam.map(f).join(' ; ')+' (Σ = '+f(r.lam.reduce(function(a,b){return a+b},0))+')</p>';
    var asy=(M===2)?0.25*Math.exp(-4*nb):(M===3)?0.5*Math.exp(-3*nb):null;
    h+='<p><b>'+t.pe+':</b> '+SIM.f(r.pe,5)+'</p><p>'+t.cmp+': P<sub>e</sub>(BPSK) = '+SIM.f(r.peBPSK,5)+(M===2?'':' ; ×'+SIM.f(r.pe/r.peBPSK,3))+' &nbsp;·&nbsp; '+t.asy+' = '+(asy===null?'—':SIM.f(asy,4))+'</p>';
    var rel=Math.abs(r.pe-r.peJacobi)/Math.max(r.pe,1e-300);
    h+='<p>'+t.chk+': '+SIM.f(r.peJacobi,5)+' <span class="'+(rel<1e-6?'ok':'no')+'">'+(rel<1e-6?'✓ '+t.ok:'✗')+'</span></p>';
    var xs=[],cs={2:[],3:[],4:[]};for(var i=0;i<60;i++){var x=0.1+i*0.1;xs.push(x);[2,3,4].forEach(function(m){cs[m].push(m===2?M05.peBPSK(x):M05.peFromLam(M05.lam(x,m)))})}
    h+='<p><b>'+t.curve+'</b></p>'+SIM.plot([2,3,4].map(function(m){return {x:xs,y:cs[m],label:'M='+m}}),{logy:true,xlabel:t.x,ylabel:t.y,ymin:1e-10,ymax:1});
    h+='<p style="font-size:.85em;color:var(--muted)">'+t.note+'</p>';
    out.innerHTML=h;
  }
  inN.addEventListener('input',run);inM.addEventListener('change',run);run();
};
}
})(typeof window!=='undefined'?window:globalThis);
