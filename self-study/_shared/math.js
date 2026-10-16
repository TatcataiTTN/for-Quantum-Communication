/* Vẽ công thức bằng KaTeX cục bộ: \( ... \) (dòng), \[ ... \] hoặc $$ ... $$ (khối). Không lỗi nếu KaTeX không tải được. */
(function(){
  function run(){
    if(!window.renderMathInElement)return;
    try{renderMathInElement(document.body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false}],throwOnError:false,ignoredTags:['script','noscript','style','textarea','pre','code']})}catch(e){console.warn('katex',e)}
  }
  window.QCmath=function(el){if(!window.renderMathInElement)return;try{renderMathInElement(el||document.body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false}],throwOnError:false,ignoredTags:['script','noscript','style','textarea','pre','code']})}catch(e){}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
