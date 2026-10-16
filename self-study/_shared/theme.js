/* Theme + font-size switcher (cấu hình đọc trước khi vẽ ở <head>; file này gắn nút) */
(function(){
  function apply(t){if(t&&t!=='light')document.documentElement.setAttribute('data-theme',t);else document.documentElement.removeAttribute('data-theme');try{localStorage.setItem('site-theme',t)}catch(e){}}
  document.querySelectorAll('[data-set-theme]').forEach(function(b){b.addEventListener('click',function(){apply(b.getAttribute('data-set-theme'));var d=b.closest('details');if(d)d.open=false})});
  document.querySelectorAll('[data-set-font]').forEach(function(b){b.addEventListener('click',function(){var v=b.getAttribute('data-set-font');document.documentElement.style.fontSize=v;try{localStorage.setItem('site-font',v)}catch(e){}})});
  try{var f=localStorage.getItem('site-font');if(f)document.documentElement.style.fontSize=f}catch(e){}
})();
