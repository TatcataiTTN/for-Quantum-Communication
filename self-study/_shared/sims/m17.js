/* Mô phỏng m17: pass@k không chệch. Hàm thuần M17.passk kiểm bằng Node so với data/verify/m17_verify.py */
(function(root){
'use strict';
var M17={};
M17.passk=function(n,c,k){if(n-c<k)return 1;var p=1;for(var i=0;i<k;i++)p*=(n-c-i)/(n-i);return 1-p};
root.M17=M17;
if(typeof module!=='undefined'&&module.exports)module.exports=M17;
if(typeof SIM==='undefined'||!SIM.W)return;
var vi=((document.documentElement.getAttribute('lang')||'vi').slice(0,2)==='vi');
function T(a,b){return vi?a:b}
SIM.W.m17_passk=function(rt){
  SIM.frame(rt,T('pass@k không chệch theo số mẫu đúng','Unbiased pass@k versus correct samples'),
   '<div class="row"><label>n <input id="n" type="number" value="10" min="1" max="200" style="width:70px"></label> <label>c <input id="c" type="number" value="3" min="0" max="200" style="width:70px"></label></div><div id="o"></div>');
  function draw(){var n=parseInt(SIM.$(rt,'#n').value),c=parseInt(SIM.$(rt,'#c').value);if(!(n>=1)||!(c>=0)||c>n)return;
    var rows=[];[1,2,4,5,8,16].forEach(function(k){if(k<=n)rows.push(['k='+k,SIM.f(M17.passk(n,c,k),4)])});
    SIM.$(rt,'#o').innerHTML=SIM.tbl(['k','pass@k'],rows)}
  rt.addEventListener('input',draw);draw();
};
})(typeof window!=='undefined'?window:globalThis);
