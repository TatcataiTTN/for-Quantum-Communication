/* Cổng đăng nhập phía trình duyệt. Chỉ lưu SHA-256 của "salt|tài khoản:mật khẩu", không lưu mật khẩu thô.
   Lưu ý: đây là rào cản tiện dụng, không phải bảo mật thật (trang tĩnh, file vẫn tải trực tiếp được). */
(function(){
var SALT='qc-selfstudy-v1|',HASH='db93a443b87bb36e7f234c53c2a3007fb84a146000cac659be226ab095a400c4',KEY='qc-auth-v1';
try{if(localStorage.getItem(KEY)===HASH)return}catch(e){}
document.documentElement.style.visibility='hidden';
function sha256(ascii){
  function rr(v,a){return(v>>>a)|(v<<(32-a))}
  var mp=Math.pow,mw=mp(2,32),i,j,r='',w=[],al=ascii.length*8,hash=sha256.h=sha256.h||[],k=sha256.k=sha256.k||[],pc=k.length,ic={};
  for(var c=2;pc<64;c++){if(!ic[c]){for(i=0;i<313;i+=c)ic[i]=c;hash[pc]=(mp(c,.5)*mw)|0;k[pc++]=(mp(c,1/3)*mw)|0}}
  ascii+='\x80';while(ascii.length%64-56)ascii+='\x00';
  for(i=0;i<ascii.length;i++){j=ascii.charCodeAt(i);if(j>>8)return;w[i>>2]|=j<<((3-i)%4)*8}
  w[w.length]=((al/mw)|0);w[w.length]=(al);
  for(j=0;j<w.length;){var ww=w.slice(j,j+=16),old=hash;hash=hash.slice(0,8);
    for(i=0;i<64;i++){var w15=ww[i-15],w2=ww[i-2],a=hash[0],e=hash[4];
      var t1=hash[7]+(rr(e,6)^rr(e,11)^rr(e,25))+((e&hash[5])^((~e)&hash[6]))+k[i]+(ww[i]=(i<16)?ww[i]:(ww[i-16]+(rr(w15,7)^rr(w15,18)^(w15>>>3))+ww[i-7]+(rr(w2,17)^rr(w2,19)^(w2>>>10)))|0);
      var t2=(rr(a,2)^rr(a,13)^rr(a,22))+((a&hash[1])^(a&hash[2])^(hash[1]&hash[2]));
      hash=[(t1+t2)|0].concat(hash);hash[4]=(hash[4]+t1)|0}
    for(i=0;i<8;i++)hash[i]=(hash[i]+old[i])|0}
  for(i=0;i<8;i++)for(j=3;j+1;j--){var b=(hash[i]>>(j*8))&255;r+=((b<16)?0:'')+b.toString(16)}
  return r}
function utf8(s){return unescape(encodeURIComponent(s))}
function build(){
  var o=document.createElement('div');o.id='qc-gate';
  o.innerHTML='<form class="qc-gate-box" autocomplete="on"><h1>Quantum Communication · Tự học</h1><p>Vui lòng đăng nhập để xem tài liệu.</p>'+
   '<label>Tài khoản<input name="u" autocomplete="username" required></label><label>Mật khẩu<input name="p" type="password" autocomplete="current-password" required></label>'+
   '<button type="submit">Đăng nhập</button><div class="qc-gate-err" role="alert"></div></form>';
  var st=document.createElement('style');st.textContent='#qc-gate{position:fixed;inset:0;z-index:99999;background:#0f1a2e;display:flex;align-items:center;justify-content:center;font:16px/1.5 -apple-system,Segoe UI,Roboto,Arial,sans-serif}.qc-gate-box{background:#fff;color:#1d2433;border-radius:14px;padding:26px 28px;width:min(360px,92vw);box-shadow:0 10px 40px rgba(0,0,0,.4)}.qc-gate-box h1{font-size:1.2rem;margin:0 0 6px;color:#b3122f}.qc-gate-box p{margin:0 0 14px;color:#5d6678;font-size:.92rem}.qc-gate-box label{display:block;font-size:.85rem;font-weight:600;margin:8px 0}.qc-gate-box input{display:block;width:100%;margin-top:4px;font:inherit;padding:8px 10px;border:1px solid #cfd3dc;border-radius:8px}.qc-gate-box button{margin-top:14px;width:100%;font:inherit;font-weight:700;background:#b3122f;color:#fff;border:0;border-radius:8px;padding:10px;cursor:pointer}.qc-gate-err{color:#b3122f;font-size:.85rem;min-height:1.2em;margin-top:8px}';
  document.head.appendChild(st);document.body.appendChild(o);document.documentElement.style.visibility='visible';
  o.querySelector('form').addEventListener('submit',function(ev){ev.preventDefault();
    var u=o.querySelector('[name=u]').value.trim(),p=o.querySelector('[name=p]').value;
    var h=sha256(utf8(SALT+u+':'+p));
    if(h===HASH){try{localStorage.setItem(KEY,HASH)}catch(e){}o.remove()}
    else o.querySelector('.qc-gate-err').textContent='Sai tài khoản hoặc mật khẩu.'});
}
if(document.body)build();else document.addEventListener('DOMContentLoaded',build);
})();
