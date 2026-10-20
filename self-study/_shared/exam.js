/* Luyện đề: chọn đề, tính giờ 30 phút, nộp bài -> điểm + giải thích từng câu; làm lại. */
(function(){
var root=document.getElementById('exam');if(!root)return;
var D=JSON.parse(document.getElementById('exam-data').textContent);
var cur=0,timer=null,left=1800,submitted=false,ans={};
function el(t,c,txt){var e=document.createElement(t);if(c)e.className=c;if(txt!==undefined)e.textContent=txt;return e}
function fmt(s){return Math.floor(s/60)+':'+('0'+(s%60)).slice(-2)}
function render(){
  clearInterval(timer);root.innerHTML='';
  var tabs=el('div','row');D.sets.forEach(function(s,i){var b=el('button','btn'+(i===cur?'':' alt'),'Đề '+(i+1));b.onclick=function(){cur=i;left=1800;submitted=false;ans={};render()};tabs.appendChild(b)});root.appendChild(tabs);
  var set=D.sets[cur];
  var bar=el('div','sim');bar.innerHTML='<div class="simh">Đề số '+(cur+1)+' · 15 câu · 30 phút</div>';
  var tm=el('span','quiz-score','Thời gian còn lại: '+fmt(left));bar.appendChild(tm);
  var sb=el('button','btn','Nộp bài');sb.style.marginLeft='10px';sb.onclick=function(){submit()};bar.appendChild(sb);
  var rb=el('button','btn alt','↺ Làm lại đề này');rb.style.marginLeft='6px';rb.onclick=function(){left=1800;submitted=false;ans={};render()};bar.appendChild(rb);
  root.appendChild(bar);
  set.forEach(function(q,qi){
    var box=el('div','qitem');var t=el('div','qtxt');t.style.fontWeight='600';t.textContent=(qi+1)+'. '+q.q;box.appendChild(t);
    var meta=el('div',null,'📎 '+q.src);meta.style.fontSize='.78rem';meta.style.color='var(--muted)';box.appendChild(meta);
    q.opts.forEach(function(o,oi){var b=el('button','opt','ABCD'[oi]+'. '+o);b.type='button';
      if(ans[qi]===oi)b.style.outline='2px solid var(--accent)';
      b.onclick=function(){if(submitted)return;ans[qi]=oi;[].forEach.call(box.querySelectorAll('.opt'),function(x){x.style.outline=''});b.style.outline='2px solid var(--accent)'};box.appendChild(b)});
    var ex=el('div','explain');ex.id='ex'+qi;box.appendChild(ex);root.appendChild(box)});
  var res=el('div','quiz-score');res.id='res';root.appendChild(res);
  if(!submitted){timer=setInterval(function(){left--;tm.textContent='Thời gian còn lại: '+fmt(left);if(left<=0){submit()}},1000)}
}
function submit(){
  if(submitted)return;submitted=true;clearInterval(timer);var set=D.sets[cur],score=0;
  set.forEach(function(q,qi){var box=root.querySelectorAll('.qitem')[qi],opts=box.querySelectorAll('.opt');[].forEach.call(opts,function(o){o.dataset.done='1';o.style.outline=''});
    var ok=ans[qi]===q.correct;if(ok)score++;
    opts[q.correct].classList.add('correct');if(ans[qi]!==undefined&&!ok)opts[ans[qi]].classList.add('wrong');
    var ex=box.querySelector('.explain');ex.innerHTML='';var h=el('div',null,ok?'✅ Đúng':(ans[qi]===undefined?'⚪ Chưa trả lời. Đáp án: ':'❌ Sai. Đáp án đúng: ')+(ok?'':'ABCD'[q.correct]));h.style.fontWeight='800';ex.appendChild(h);ex.appendChild(document.createTextNode(q.explain));ex.classList.add('show')});
  var r=document.getElementById('res');r.textContent='Kết quả: '+score+'/15 câu đúng ('+(score*10/15).toFixed(2)+' điểm thang 10).';r.scrollIntoView({behavior:'smooth',block:'center'});
}
render();
})();
