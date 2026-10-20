/* qlib.js: thư viện toán lượng tử/FSO thuần JS (chạy trong trình duyệt và Node).
   Mọi hàm đều được đối chiếu với Python (numpy/scipy) trong tests/test_qlib.js + tests/gen_qlib_cases.py.
   Quy ước: ma trận là mảng các hàng (Array<Array<number>>), thực đối xứng (trạng thái kết hợp thực).
   Mô hình kênh khớp ttn-12-08/quadrature_baseline.py: beta = ±sqrt(I)*sqrt(nbar) + sigma*w, w ~ N(0,1) thực. */
(function(root){
'use strict';
var QL={};

/* ---------- Hàm đặc biệt ---------- */
QL.lgamma=function(x){ /* Lanczos g=7, n=9 */
  var g=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  if(x<0.5)return Math.log(Math.PI/Math.abs(Math.sin(Math.PI*x)))-QL.lgamma(1-x);
  x-=1;var a=g[0],t=x+7.5;for(var i=1;i<9;i++)a+=g[i]/(x+i);
  return 0.5*Math.log(2*Math.PI)+(x+0.5)*Math.log(t)-t+Math.log(a);
};
QL.erf=function(x){ /* Abramowitz-Stegun 7.1.26 không đủ chính xác; dùng chuỗi/liên phân số */
  var s=x<0?-1:1;x=Math.abs(x);
  if(x<3){var sum=x,term=x,n=0;while(Math.abs(term)>1e-17*Math.abs(sum)){n++;term*=-x*x/n;sum+=term/(2*n+1);if(n>200)break}return s*2/Math.sqrt(Math.PI)*sum}
  /* liên phân số cho erfc */
  var f=0;for(var k=60;k>=1;k--)f=k/2/(x+f);
  return s*(1-Math.exp(-x*x)/(Math.sqrt(Math.PI)*(x+f)));
};
/* K_nu(x)=int_0^inf exp(-x cosh t) cosh(nu t) dt = h*(f(0)/2+sum f(ih)), cầu phương hình thang */
QL.besselK=function(nu,x){
  nu=Math.abs(nu);var tmax=1;
  while(-x*Math.cosh(tmax)+nu*tmax>-745&&tmax<60)tmax+=0.5;
  var N=3000,h=tmax/N,s=0.5*Math.exp(-x);
  for(var i=1;i<=N;i++){var t=i*h;s+=Math.exp(-x*Math.cosh(t))*Math.cosh(nu*t)}
  return s*h;
};
QL.logBesselK=function(nu,x){ /* log K_nu(x), ổn định cho x lớn: tách exp(-x) */
  nu=Math.abs(nu);var tmax=1;
  while(-x*(Math.cosh(tmax)-1)+nu*tmax>-745&&tmax<60)tmax+=0.5;
  var N=3000,h=tmax/N,s=0.5;
  for(var i=1;i<=N;i++){var t=i*h;s+=Math.exp(-x*(Math.cosh(t)-1))*Math.cosh(nu*t)}
  return Math.log(s*h)-x;
};

/* ---------- Nút và trọng số cầu phương ---------- */
QL.gaussLegendre=function(n){
  var x=[],w=[];
  for(var i=0;i<n;i++){
    var z=Math.cos(Math.PI*(i+0.75)/(n+0.5)),pp;
    for(var it=0;it<100;it++){
      var p1=1,p2=0;
      for(var j=0;j<n;j++){var p3=p2;p2=p1;p1=((2*j+1)*z*p2-j*p3)/(j+1)}
      pp=n*(z*p1-p2)/(z*z-1);var z1=z;z=z1-p1/pp;if(Math.abs(z-z1)<1e-15)break;
    }
    x.push(z);w.push(2/((1-z*z)*pp*pp));
  }
  return {x:x,w:w};
};
QL.jacobiEig=function(A,wantVec){ /* ma trận thực đối xứng; trả {vals, vecs(cột)} */
  var n=A.length,a=A.map(function(r){return r.slice()}),v=null;
  if(wantVec){v=[];for(var i=0;i<n;i++){v.push(new Array(n).fill(0));v[i][i]=1}}
  for(var sweep=0;sweep<100;sweep++){
    var off=0;for(var p=0;p<n;p++)for(var q=p+1;q<n;q++)off+=a[p][q]*a[p][q];
    if(off<1e-30)break;
    for(var p=0;p<n-1;p++)for(var q=p+1;q<n;q++){
      if(Math.abs(a[p][q])<1e-300)continue;
      var th=(a[q][q]-a[p][p])/(2*a[p][q]);
      var t=(th>=0?1:-1)/(Math.abs(th)+Math.sqrt(th*th+1));
      var c=1/Math.sqrt(t*t+1),s=t*c;
      for(var k=0;k<n;k++){var akp=a[k][p],akq=a[k][q];a[k][p]=c*akp-s*akq;a[k][q]=s*akp+c*akq}
      for(var k=0;k<n;k++){var apk=a[p][k],aqk=a[q][k];a[p][k]=c*apk-s*aqk;a[q][k]=s*apk+c*aqk}
      if(wantVec)for(var k=0;k<n;k++){var vkp=v[k][p],vkq=v[k][q];v[k][p]=c*vkp-s*vkq;v[k][q]=s*vkp+c*vkq}
    }
  }
  var vals=[];for(var i=0;i<n;i++)vals.push(a[i][i]);
  return {vals:vals,vecs:v};
};
QL.gaussHermiteE=function(n){ /* hermegauss (trọng số e^{-x^2/2}), Golub-Welsch; trọng số chuẩn hoá tổng = 1 */
  var J=[];for(var i=0;i<n;i++)J.push(new Array(n).fill(0));
  for(var i=0;i<n-1;i++){J[i][i+1]=J[i+1][i]=Math.sqrt(i+1)}
  var e=QL.jacobiEig(J,true),idx=e.vals.map(function(_,i){return i}).sort(function(a,b){return e.vals[a]-e.vals[b]});
  var x=[],w=[];idx.forEach(function(i){x.push(e.vals[i]);w.push(e.vecs[0][i]*e.vecs[0][i])});
  return {x:x,w:w};
};

/* ---------- Turbulence: Rytov và Gamma-Gamma ---------- */
QL.rytov=function(Cn2,lambda,L){ /* sóng phẳng: 1.23 Cn2 k^{7/6} L^{11/6} (L tính bằng mét) */
  var k=2*Math.PI/lambda;return 1.23*Cn2*Math.pow(k,7/6)*Math.pow(L,11/6);
};
QL.ggParams=function(sigR2){ /* Andrews-Phillips: sigma_R^{12/5} = (sigma_R^2)^{6/5} */
  var sr=Math.sqrt(Math.max(sigR2,0)),dt=Math.pow(sr,12/5);
  var a=1/Math.max(Math.exp(0.49*sigR2/Math.pow(1+1.11*dt,7/6))-1,1e-300);
  var b=1/Math.max(Math.exp(0.51*sigR2/Math.pow(1+0.69*dt,5/6))-1,1e-300);
  return {alpha:a,beta:b};
};
QL.ggLogPdf=function(I,a,b){
  var z=2*Math.sqrt(a*b*I);
  return Math.log(2)+0.5*(a+b)*Math.log(a*b)-QL.lgamma(a)-QL.lgamma(b)+(0.5*(a+b)-1)*Math.log(I)+QL.logBesselK(a-b,z);
};
QL.ggPdf=function(I,a,b){return Math.exp(Math.max(-700,Math.min(700,QL.ggLogPdf(I,a,b))))};
QL.ggScintillationIndex=function(a,b){return 1/a+1/b+1/(a*b)};

/* ---------- Trạng thái kết hợp và kênh ---------- */
QL.coherentAmps=function(beta,d){ /* <n|beta> với beta thực; trả mảng thực độ dài d */
  var out=new Array(d),lf=0,lb=beta===0?-Infinity:Math.log(Math.abs(beta));
  for(var n=0;n<d;n++){
    if(n>0)lf+=0.5*Math.log(n);
    var la=-0.5*beta*beta+(n===0?0:n*lb)-lf;
    var sg=(beta<0&&(n%2===1))?-1:1;
    out[n]=(beta===0&&n>0)?0:sg*Math.exp(la);
  }
  return out;
};
QL.channelStates=function(nbar,sigma,aGG,bGG,d,nI,nW,range){
  d=d||16;nI=nI||24;nW=nW||7;range=range||[-12,6];
  var amp=Math.sqrt(nbar),varI=1/aGG+1/bGG+1/(aGG*bGG),hw=10*Math.sqrt(varI);
  var lo=Math.max(range[0],-hw),hi=Math.min(range[1],hw);
  var gl=QL.gaussLegendre(nI),wI=[],I=[],lw=0;
  for(var i=0;i<nI;i++){
    var li=0.5*(hi-lo)*gl.x[i]+0.5*(hi+lo),Ii=Math.exp(li);I.push(Ii);
    var pdf=Math.exp(Math.max(-700,Math.min(700,QL.ggLogPdf(Ii,aGG,bGG))));
    var wi=0.5*(hi-lo)*gl.w[i]*pdf*Ii;if(!isFinite(wi))wi=0;wI.push(wi);lw+=wi;
  }
  for(var i=0;i<nI;i++)wI[i]=lw>0?wI[i]/lw:1/nI;
  var hg=QL.gaussHermiteE(nW),sw=0;hg.w.forEach(function(v){sw+=v});
  var r0=[],r1=[];for(var i=0;i<d;i++){r0.push(new Array(d).fill(0));r1.push(new Array(d).fill(0))}
  for(var i=0;i<nI;i++){for(var j=0;j<nW;j++){
    var wt=wI[i]*hg.w[j]/sw,s=Math.sqrt(I[i])*amp,nz=sigma*hg.x[j];
    var a0=QL.coherentAmps(s+nz,d),a1=QL.coherentAmps(-s+nz,d);
    for(var p=0;p<d;p++)for(var q=0;q<d;q++){r0[p][q]+=wt*a0[p]*a0[q];r1[p][q]+=wt*a1[p]*a1[q]}
  }}
  var t0=0,t1=0;for(var p=0;p<d;p++){t0+=r0[p][p];t1+=r1[p][p]}
  for(var p=0;p<d;p++)for(var q=0;q<d;q++){r0[p][q]/=t0;r1[p][q]/=t1}
  return {rho0:r0,rho1:r1};
};

/* ---------- Helstrom ---------- */
QL.helstromError=function(rho0,rho1,p0){
  p0=(p0===undefined)?0.5:p0;var d=rho0.length,D=[];
  for(var i=0;i<d;i++){D.push([]);for(var j=0;j<d;j++)D[i].push(p0*rho0[i][j]-(1-p0)*rho1[i][j])}
  var ev=QL.jacobiEig(D,false).vals,s=0;ev.forEach(function(v){s+=Math.abs(v)});
  return 0.5*(1-s);
};
QL.helstromPure=function(overlapSq){return 0.5*(1-Math.sqrt(Math.max(0,1-overlapSq)))}; /* hai trạng thái thuần, p0=1/2 */
QL.helstromBPSKPure=function(nbar){return QL.helstromPure(Math.exp(-4*nbar))};      /* |<a|-a>|^2 = e^{-4|a|^2} */
QL.channelHelstrom=function(nbar,sigma,sigR2,d,nI,nW){
  var g=QL.ggParams(sigR2),s=QL.channelStates(nbar,sigma,g.alpha,g.beta,d,nI,nW);
  return QL.helstromError(s.rho0,s.rho1);
};
QL.poissonTail=function(nbar,d){ /* P(N>=d) của phân bố Poisson(nbar) */
  var p=Math.exp(-nbar),s=p;for(var n=1;n<d;n++){p*=nbar/n;s+=p}return Math.max(0,1-s);
};

if(typeof module!=='undefined'&&module.exports)module.exports=QL;else root.QL=QL;
})(typeof window!=='undefined'?window:this);
