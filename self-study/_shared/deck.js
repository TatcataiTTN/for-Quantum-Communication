/* Deck canvas 1280x720 (chuẩn HUST): co theo khung (CSS transform), phím ← →, chấm tròn, Toàn màn hình. Không tự co chữ: nội dung phải vừa canvas (kiểm bằng tests/site_sweep.py). */
(function(){
var T=window.QC_T||{};
document.querySelectorAll('.mdeck').forEach(function(deck){
  var stage=deck.querySelector('.mdeck-stage'),canvas=deck.querySelector('.mdeck-canvas');
  var slides=[].slice.call(deck.querySelectorAll('.mdeck-slide')),bar=deck.querySelector('.mdeck-bar');
  var prevBtn=bar.querySelector('.mdeck-prev'),nextBtn=bar.querySelector('.mdeck-next'),count=bar.querySelector('.mdeck-count'),dotsWrap=bar.querySelector('.mdeck-dots'),fsBtn=bar.querySelector('.mdeck-fs');
  var i=0;
  try{var sv=parseInt(sessionStorage.getItem('deck:'+location.pathname+':'+(deck.id||'0')),10);if(sv>=0&&sv<slides.length)i=sv}catch(e){}
  slides.forEach(function(s,idx){var d=document.createElement('button');d.type='button';d.title='Slide '+(idx+1);d.addEventListener('click',function(){go(idx)});dotsWrap.appendChild(d)});
  var dots=[].slice.call(dotsWrap.children);
  function isFs(){return document.fullscreenElement===deck||document.webkitFullscreenElement===deck}
  function scale(){
    var w;
    if(isFs()){var barH=bar.offsetHeight,aw=window.innerWidth,ah=window.innerHeight-barH;w=Math.min(aw,ah*16/9);stage.style.width=w+'px'}
    else{stage.style.width='';w=stage.clientWidth}
    canvas.style.transform='scale('+(w/1280)+')';
  }
  function render(){
    slides.forEach(function(s,idx){s.classList.toggle('active',idx===i)});
    dots.forEach(function(d,idx){d.classList.toggle('on',idx===i)});
    count.textContent=(i+1)+'/'+slides.length;prevBtn.disabled=i===0;nextBtn.disabled=i===slides.length-1;
    try{sessionStorage.setItem('deck:'+location.pathname+':'+(deck.id||'0'),i)}catch(e){}
    scale();
  }
  function go(n){i=Math.max(0,Math.min(slides.length-1,n));render()}
  prevBtn.addEventListener('click',function(){go(i-1)});nextBtn.addEventListener('click',function(){go(i+1)});
  deck.tabIndex=0;
  deck.addEventListener('keydown',function(e){
    if(e.target.closest&&e.target.closest('input,textarea,select'))return;
    if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){go(i+1);e.preventDefault()}
    if(e.key==='ArrowLeft'||e.key==='PageUp'){go(i-1);e.preventDefault()}
  });
  if(fsBtn)fsBtn.addEventListener('click',function(){if(!isFs())(deck.requestFullscreen||deck.webkitRequestFullscreen).call(deck);else(document.exitFullscreen||document.webkitExitFullscreen).call(document)});
  document.addEventListener('fullscreenchange',function(){setTimeout(scale,50)});document.addEventListener('webkitfullscreenchange',function(){setTimeout(scale,50)});
  window.addEventListener('resize',scale);
  deck.__go=go;render();
});
})();
