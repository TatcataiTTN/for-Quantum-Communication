/* Mô phỏng module m14: chi phí tính cận Helstrom (SDP, phân rã riêng, cầu phương oracle, surrogate nơ-ron) và điểm hoà vốn N*.
   Hàm thuần nằm trong M14 (Node đối chiếu data/verify/m14_verify.py); widget chỉ gọi M14.* */
(function(root){
'use strict';
var M14={};
M14.mlpFlops=function(f,hid,d,heads){
  heads=heads||2;var dims=[f].concat(hid),back=0,i;
  for(i=0;i<hid.length;i++)back+=2*dims[i]*dims[i+1];
  var head=heads*2*hid[hid.length-1]*d*d,chol=heads*d*d,eig=d*d*d;
  return {back:back,head:head,chol:chol,eig:eig,total:back+head+chol+eig};
};
M14.mlpParams=function(f,hid,d,heads){
  heads=heads||2;var dims=[f].concat(hid),p=0,i;
  for(i=0;i<hid.length;i++)p+=dims[i]*dims[i+1]+dims[i+1];
  return p+heads*(hid[hid.length-1]*d*d+d*d);
};
M14.sdpIter=function(M,d){var m=M*d*d;return m*m*d*d};
M14.oracleFlops=function(d,K,c){c=(c===undefined)?10:c;return 4*K*d*d+c*d*d*d};
M14.breakeven=function(T,tRef,tSur){return T/(tRef-tSur)};
root.M14=M14;
if(typeof module!=='undefined'&&module.exports)module.exports=M14;
if(typeof SIM==='undefined'||!SIM.W)return;
var LANG=(document.documentElement.getAttribute('lang')||'vi').slice(0,2),vi=LANG==='vi';
function T(a,b){return vi?a:b}
function val(r,id){return parseFloat(SIM.$(r,'#'+id).value)}
function E(x){return SIM.f(x,4)}

/* (a) FLOPs, tham số, bộ nhớ của MLP + Cholesky head, so với chi phí SDP và oracle */
SIM.W.m14_flops=function(rt){
  SIM.frame(rt,T('Máy tính FLOPs: MLP + đầu Cholesky, so với SDP và oracle cầu phương','FLOPs calculator: MLP + Cholesky head versus SDP and the quadrature oracle'),
   '<div class="row"><label>f <input id="f" value="9" size="3"></label><label>'+T('lớp ẩn','hidden')+' <input id="h" value="128,128,256,256" size="16"></label>'+
   '<label>d <input id="d" value="16" size="3"></label><label>M <input id="M" value="2" size="3"></label><label>K = n<sub>I</sub>n<sub>w</sub> <input id="K" value="1968" size="5"></label>'+
   '<label>'+T('hệ số eig c','eig factor c')+' <input id="c" value="10" size="3"></label><button class="btn" id="go">'+T('Tính','Compute')+'</button></div><div class="out"></div>');
  function run(){
    var f=val(rt,'f'),h=SIM.nums(SIM.$(rt,'#h').value),d=val(rt,'d'),M=val(rt,'M'),K=val(rt,'K'),c=val(rt,'c');
    var a=M14.mlpFlops(f,h,d,2),p=M14.mlpParams(f,h,d,2),s=M14.sdpIter(M,d),o=M14.oracleFlops(d,K,c);
    var rows=[[T('SharedMLP (lớp tuyến tính)','SharedMLP (linear layers)'),E(a.back)],[T('2 đầu Cholesky: 2·2·h·d²','2 Cholesky heads: 2·2·h·d²'),E(a.head)],
      [T('Chuẩn hoá Cholesky 2·d²','Cholesky normalisation 2·d²'),E(a.chol)],['d³ '+T('phân rã riêng','eigendecomposition'),E(a.eig)],
      {cls:'hl',cells:['<b>'+T('Tổng surrogate','Surrogate total')+'</b>','<b>'+E(a.total)+'</b>']}];
    SIM.$(rt,'.out').innerHTML=SIM.tbl([T('Thành phần','Component'),'FLOPs'],rows)+
      '<p>'+T('Tham số','Parameters')+': <b>'+p+'</b> ('+E(p*4/1e6)+' MB FP32) · '+T('SDP mỗi vòng lặp','SDP per iteration')+' M²d⁶ = <b>'+E(s)+'</b> ('+T('×20 vòng','×20 iterations')+' = '+E(20*s)+') · '+
      T('oracle cầu phương ≈ 4Kd²+c·d³','quadrature oracle ≈ 4Kd²+c·d³')+' = <b>'+E(o)+'</b> · '+T('tỉ số oracle / surrogate','oracle / surrogate ratio')+' = <b>'+E(o/a.total)+'</b></p>'+
      '<p style="font-size:.82rem;color:var(--muted)">'+T('FLOPs gần nhau (cùng bậc) nhưng độ trễ đo được khác 700 lần vì suy luận theo lô dùng BLAS hiệu quả, còn oracle chạy vòng lặp Python.','FLOPs are within one order of magnitude, yet measured latency differs about 700 times because batched inference uses efficient BLAS while the oracle runs a Python loop.')+'</p>';
  }
  SIM.$(rt,'#go').onclick=run;run();
};
/* (b) Điểm hoà vốn N* = T / (t_ref - t_sur) */
SIM.W.m14_breakeven=function(rt){
  SIM.frame(rt,T('Điểm hoà vốn N* của surrogate','Break-even N* of the surrogate'),
   '<div class="row"><label>T (s) <input id="T" value="110000" size="8"></label><label>t<sub>SDP</sub> (ms) <input id="ts" value="113.89" size="7"></label>'+
   '<label>t<sub>oracle</sub> (ms) <input id="to" value="13.5" size="6"></label><label>t<sub>sur</sub> (ms) <input id="tu" value="0.018" size="6"></label>'+
   '<button class="btn" id="go">'+T('Tính','Compute')+'</button></div><div class="out"></div>');
  function run(){
    var Tt=val(rt,'T'),ts=val(rt,'ts')/1e3,to=val(rt,'to')/1e3,tu=val(rt,'tu')/1e3;
    var xs=[],y1=[],y2=[],i;for(i=0;i<=24;i++){var lg=3+i*0.25;xs.push(Math.pow(10,lg));y1.push(Tt+tu*xs[i]);y2.push(ts*xs[i])}
    var y3=xs.map(function(n){return to*n});
    var ser=[{x:xs,y:y2,label:T('chi phí tích luỹ SDP','cumulative SDP cost')},{x:xs,y:y3,label:T('oracle cầu phương','quadrature oracle'),color:'#1b7f4c'},{x:xs,y:y1,label:T('huấn luyện + surrogate','training + surrogate'),color:'#b3122f'}];
    SIM.$(rt,'.out').innerHTML='<p>N*<sub>SDP</sub> = <b>'+E(M14.breakeven(Tt,ts,tu))+'</b> · N*<sub>oracle</sub> = <b>'+E(M14.breakeven(Tt,to,tu))+'</b> '+T('lần đánh giá','evaluations')+'</p>'+
      SIM.plot(ser,{logx:true,logy:true,xlabel:'N',ylabel:T('giây','seconds'),w:560,h:280});
  }
  SIM.$(rt,'#go').onclick=run;run();
};
})(typeof window!=='undefined'?window:globalThis);
