if(!self.define){let e,s={};const n=(n,i)=>(n=new URL(n+".js",i).href,s[n]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=s,document.head.appendChild(e)}else e=n,importScripts(n),s()})).then((()=>{let e=s[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(i,t)=>{const r=e||("document"in self?document.currentScript.src:"")||location.href;if(s[r])return;let o={};const l=e=>n(e,r),c={module:{uri:r},exports:o,require:l};s[r]=Promise.all(i.map((e=>c[e]||l(e)))).then((e=>(t(...e),o)))}}define(["./workbox-bc55f1ff"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"assets/index.56e88484.js",revision:null},{url:"assets/index.7211668c.css",revision:null},{url:"assets/vendor.6bafb6cf.js",revision:null},{url:"index.html",revision:"70a7611522165671c0c86a87528961b9"},{url:"manifest.webmanifest",revision:"2924a7142d5d675ff729fb5d774c9c40"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
