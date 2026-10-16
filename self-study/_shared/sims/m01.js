/* Mô phỏng module m01: CHSH (W&M Eq. 13.26-13.28), ngưỡng nhiễu MABK, relay 2 chặng (Bhatnagar 2025, Eq. 12 và 41).
   Hàm thuần nằm trong M01 (kiểm bằng Node so với data/verify/m01_verify.py). */
(function(root){
'use strict';
var QL=root.QL||(typeof require!=='undefined'?require('../qlib.js'):null);
var M01={};
var D2R=Math.PI/180;
/* tương quan phân cực cho trạng thái (|HH>+|VV>)/sqrt2 pha nhiễu trắng với độ nhìn thấy v */
M01.E=function(t1,t2,v){return (v===undefined?1:v)*Math.cos(2*(t1-t2)*D2R)};
M01.chsh=function(a,a2,b,b2,v){return M01.E(a,b,v)-M01.E(a,b2,v)+M01.E(a2,b,v)+M01.E(a2,b2,v)};
M01.Bpsi=function(psiDeg){var p=psiDeg*D2R;return 3*Math.cos(2*p)-Math.cos(6*p)};
M01.vcChsh=function(){return 1/Math.SQRT2};
M01.mabkRatio=function(n){return Math.pow(2,(n-1)/2)};     /* lượng tử / LHV của MABK chuẩn hoá, GHZ */
M01.mabkVc=function(n){return 1/M01.mabkRatio(n)};
M01.twoHop=function(p1,p2){return p1*(1-p2)+(1-p1)*p2};      /* Eq. (12) Bhatnagar 2025 */
M01.peBpsk=function(nbar){return QL.helstromBPSKPure(nbar)};   /* Eq. (41) với nbar=gamma^2 */
M01.vcFromQuantum=function(L,NLpsi,NLI){return (L-NLI)/(NLpsi-NLI)};
root.M01=M01;
if(typeof module!=='undefined'&&module.exports)module.exports=M01;
if(typeof SIM==='undefined'||!SIM.W)return;
var LANG=(document.documentElement.getAttribute('lang')||'vi').slice(0,2),vi=LANG==='vi';
function T(a,b){return vi?a:b}
function val(r,id){return parseFloat(SIM.$(r,'#'+id).value)}
function slider(id,lab,min,max,step,v){return '<label style="display:block;margin:.2rem 0">'+lab+' = <b id="'+id+'v">'+v+'</b><br><input type="range" id="'+id+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+v+'" style="width:100%"></label>'}

SIM.W.m01_chsh=function(rt){
  SIM.frame(rt,T('CHSH: giá trị S theo bốn góc phân tích và độ nhìn thấy v','CHSH: the value of S for four analyser angles and the visibility v'),
    '<div class="simgrid">'+slider('a',T('góc a (độ)','angle a (deg)'),0,180,0.5,0)+slider('a2',T("góc a' (độ)","angle a' (deg)"),0,180,0.5,45)+slider('b',T('góc b (độ)','angle b (deg)'),0,180,0.5,22.5)+slider('b2',T("góc b' (độ)","angle b' (deg)"),0,180,0.5,67.5)+slider('v',T('độ nhìn thấy v','visibility v'),0,1,0.01,1)+'</div><div id="out"></div>');
  function upd(){var a=val(rt,'a'),a2=val(rt,'a2'),b=val(rt,'b'),b2=val(rt,'b2'),v=val(rt,'v');
    ['a','a2','b','b2','v'].forEach(function(k){SIM.$(rt,'#'+k+'v').textContent=SIM.$(rt,'#'+k).value});
    var S=M01.chsh(a,a2,b,b2,v),ab=Math.abs(S),viol=ab>2+1e-12;
    SIM.$(rt,'#out').innerHTML=SIM.tbl([T('đại lượng','quantity'),T('giá trị','value')],[
      ['E(a,b)',SIM.f(M01.E(a,b,v))],['E(a,b\')',SIM.f(M01.E(a,b2,v))],['E(a\',b)',SIM.f(M01.E(a2,b,v))],['E(a\',b\')',SIM.f(M01.E(a2,b2,v))],
      {cls:viol?'good':'',cells:['S = E(a,b) − E(a,b\') + E(a\',b) + E(a\',b\')',SIM.f(S)]},
      [T('Biên cục bộ | S | ≤ 2','Local bound | S | ≤ 2'),viol?T('<b>bị vi phạm</b> (|S| &gt; 2)','<b>violated</b> (|S| &gt; 2)'):T('thoả (mô hình biến ẩn cục bộ giải thích được)','satisfied (a local hidden-variable model can explain it)')],
      [T('Biên Tsirelson 2√2','Tsirelson bound 2√2'),SIM.f(2*Math.SQRT2)],[T('Ngưỡng v để vi phạm tại cấu hình tối ưu','Threshold v for violation at the optimal setting'),SIM.f(M01.vcChsh())]]);
  }
  rt.addEventListener('input',upd);upd();
};
SIM.W.m01_mabk=function(rt){
  var rows=[];for(var n=2;n<=8;n++)rows.push([n,'1',SIM.f(M01.mabkRatio(n)),SIM.f(M01.mabkVc(n))]);
  SIM.frame(rt,T('MABK: ngưỡng độ nhìn thấy theo số bên n (trạng thái GHZ, hai thiết lập)','MABK: visibility threshold versus the number of parties n (GHZ state, two settings)'),
    SIM.tbl(['n',T('Biên cục bộ','Local bound'),T('Cực đại lượng tử','Quantum maximum'),'v<sub>c</sub> = 1/'+T('tỉ số','ratio')],rows)+
    '<p class="note">'+T('Đối chiếu bằng mã (số hoá) cho n = 2, 3, 4: tỉ số 1,414; 2,000; 2,828.','Checked numerically for n = 2, 3, 4: ratios 1.414, 2.000, 2.828.')+'</p>');
};
SIM.W.m01_relay=function(rt){
  SIM.frame(rt,T('Relay hai chặng: sai số đầu cuối từ hai cận Helstrom (kênh thuần, không nhiễu loạn)','Two-hop relay: end-to-end error from two Helstrom bounds (pure channel, no turbulence)'),
    '<div class="simgrid">'+slider('n1',T('n̄₁ = γ₁² (chặng Alice→Charlie)','n̄₁ = γ₁² (Alice→Charlie hop)'),0.05,3,0.05,0.5)+slider('n2',T('n̄₂ = γ₂² (chặng Charlie→Bob)','n̄₂ = γ₂² (Charlie→Bob hop)'),0.05,3,0.05,0.5)+'</div><div id="out"></div>');
  function upd(){var n1=val(rt,'n1'),n2=val(rt,'n2');SIM.$(rt,'#n1v').textContent=n1;SIM.$(rt,'#n2v').textContent=n2;
    var p1=M01.peBpsk(n1),p2=M01.peBpsk(n2),pe=M01.twoHop(p1,p2);
    SIM.$(rt,'#out').innerHTML=SIM.tbl([T('đại lượng','quantity'),T('giá trị','value')],[['P<sub>e,1</sub>',SIM.f(p1)],['P<sub>e,2</sub>',SIM.f(p2)],{cls:'good',cells:['P<sub>e</sub> = P<sub>e,1</sub>(1 − P<sub>e,2</sub>) + (1 − P<sub>e,1</sub>)P<sub>e,2</sub>',SIM.f(pe)]},[T('Chỉ một chặng (so sánh)','Single hop (for comparison)'),SIM.f(p1)]]);}
  rt.addEventListener('input',upd);upd();
};
})(typeof window!=='undefined'?window:this);
