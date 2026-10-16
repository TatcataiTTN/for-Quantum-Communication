/* Widget m11: PSK ket hop M trang thai nhu tap GU nhom Z_M. Gram tuan hoan -> gia tri rieng bang DFT (hang dau),
   doi chieu dang dong Poisson (gom n theo n mod M); P_e cua SRM = 1 - ((1/M) sum sqrt(lam_m))^2.
   Doi chieu numpy: data/verify/m11_verify.py (M=4,n=1: 0.245545 0.737803 1.483784 1.532868; P_e=0.09242142). */
(function(){
'use strict';
var G={};
G.row=function(M,nb){var re=[],im=[];for(var k=0;k<M;k++){var t=2*Math.PI*k/M,m=Math.exp(-nb*(1-Math.cos(t)));re.push(m*Math.cos(nb*Math.sin(t)));im.push(m*Math.sin(nb*Math.sin(t)))}return {re:re,im:im}};
G.eigs=function(M,nb){var g=G.row(M,nb),out=[];for(var m=0;m<M;m++){var s=0;for(var k=0;k<M;k++){var t=2*Math.PI*m*k/M;s+=g.re[k]*Math.cos(t)+g.im[k]*Math.sin(t)}out.push(s)}return out};
G.eigsClosed=function(M,nb){var out=[];for(var m=0;m<M;m++){var s=0;for(var n=m;n<400;n+=M)s+=nb>0?Math.exp(-nb+n*Math.log(nb)-QL.lgamma(n+1)):(n===0?1:0);out.push(M*s)}return out};
G.pe=function(M,nb){var l=G.eigs(M,nb),s=0;l.forEach(function(v){s+=Math.sqrt(Math.max(v,0))});return 1-(s/M)*(s/M)};
window.M11=G;
if(typeof module!=='undefined'&&module.exports)module.exports=G;
if(typeof SIM==='undefined')return;
SIM.W.m11=function(root){
  var vi=(document.documentElement.lang||'vi')==='vi';
  var T=vi?{t:'Gram tuần hoàn, DFT và P_e của SRM cho PSK kết hợp',M:'số trạng thái M',n:'số photon trung bình n̄',lam:'Giá trị riêng λ_m (DFT hàng đầu)',cl:'Dạng đóng Poisson',sum:'Tổng λ_m (phải bằng M)',pe:'P_e của SRM (= cận tối ưu cho GU thuần)',pc:'P_c',curve:'P_e theo n̄ cho M = 2, 3, 4, 8',xl:'n̄',yl:'P_e',dm:'sai lệch DFT so với dạng đóng',th:['m','λ_m (DFT)','λ_m (Poisson)']}
   :{t:'Circulant Gram matrix, DFT and SRM error for coherent PSK',M:'number of states M',n:'mean photon number n̄',lam:'Eigenvalues λ_m (DFT of first row)',cl:'Poisson closed form',sum:'Sum of λ_m (must equal M)',pe:'SRM P_e (= optimum for pure GU)',pc:'P_c',curve:'P_e versus n̄ for M = 2, 3, 4, 8',xl:'n̄',yl:'P_e',dm:'DFT versus closed-form gap',th:['m','λ_m (DFT)','λ_m (Poisson)']};
  function sl(id,lab,min,max,step,val){return '<label style="display:block;font-size:.85rem">'+lab+' <b id="'+id+'v"></b><input type="range" id="'+id+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+val+'" style="width:100%"></label>'}
  SIM.frame(root,T.t,'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+sl('c_M',T.M,2,16,1,4)+sl('c_n',T.n,0.05,8,0.05,1)+'</div><div id="c_out"></div><div id="c_pl"></div>');
  function g(id){return +SIM.$(root,'#'+id).value}
  function upd(){
    var M=g('c_M'),nb=g('c_n');SIM.$(root,'#c_Mv').textContent=M;SIM.$(root,'#c_nv').textContent=SIM.f(nb,3);
    var a=G.eigs(M,nb),b=G.eigsClosed(M,nb),s=0,d=0,rows=[];
    a.forEach(function(v,i){s+=v;d=Math.max(d,Math.abs(v-b[i]));rows.push([i,SIM.f(v,6),SIM.f(b[i],6)])});
    var pe=G.pe(M,nb);
    SIM.$(root,'#c_out').innerHTML='<p>'+T.sum+' = <b>'+SIM.f(s,6)+'</b>; '+T.dm+' = '+d.toExponential(1)+'</p>'+SIM.tbl(T.th,rows)+'<p>'+T.pe+' = <b>'+SIM.f(pe,6)+'</b>; '+T.pc+' = '+SIM.f(1-pe,6)+'</p>';
    var xs=[],S=[2,3,4,8].map(function(m){return {x:[],y:[],label:'M='+m}});
    for(var i=0;i<=60;i++){var x=0.05+i*0.1;xs.push(x);S.forEach(function(se,j){se.x.push(x);se.y.push(Math.max(G.pe([2,3,4,8][j],x),1e-9))})}
    SIM.$(root,'#c_pl').innerHTML='<b>'+T.curve+'</b>'+SIM.plot(S,{logy:true,xlabel:T.xl,ylabel:T.yl,ymin:1e-6,ymax:1});
  }
  root.querySelectorAll('input').forEach(function(e){e.addEventListener('input',upd)});upd();
};
})();
