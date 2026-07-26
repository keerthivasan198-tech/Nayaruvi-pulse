#!/usr/bin/env python3
"""
Nayaruvi Pulse — Notification Patcher
Run: python3 patch.py
It reads index.html, applies 2 changes, writes index.html (backup saved as index.html.bak)
"""
import os, shutil, sys

INPUT = 'index.html'
BACKUP = 'index.html.bak'

if not os.path.exists(INPUT):
    print(f"ERROR: {INPUT} not found. Place patch.py next to your index.html")
    sys.exit(1)

shutil.copy(INPUT, BACKUP)
html = open(INPUT, 'r', encoding='utf-8').read()

# ── PATCH 1: CSS before </style> ─────────────────────────────────────
CSS_ANCHOR = "    @keyframes spin { to { transform: rotate(360deg); } }"
CSS_INSERT = """
    /* ── PulseNotify Browser Notification Banner ── */
    #pn-banner {
      position: fixed; bottom: 90px; left: 50%;
      transform: translateX(-50%) translateY(20px);
      z-index: 99999; background: rgba(15,23,42,0.97);
      border: 1px solid rgba(99,102,241,0.45); border-radius: 20px;
      padding: 14px 18px; display: flex; align-items: center; gap: 12px;
      box-shadow: 0 8px 40px rgba(99,102,241,0.25); backdrop-filter: blur(16px);
      max-width: min(440px, 92vw); opacity: 0;
      transition: opacity 0.3s ease, transform 0.3s ease; pointer-events: none;
    }
    #pn-banner.pn-visible { opacity:1; transform:translateX(-50%) translateY(0); pointer-events:all; }
    .pn-bell-icon { width:38px;height:38px;border-radius:10px;background:rgba(99,102,241,0.18);border:1px solid rgba(99,102,241,0.35);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .pn-allow-btn { background:#6366f1;color:white;border:none;padding:8px 18px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;transition:background 0.2s; }
    .pn-allow-btn:hover { background:#4f46e5; }
    .pn-later-btn { background:transparent;color:#64748b;border:1px solid rgba(255,255,255,0.08);padding:8px 12px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap; }
    .pn-later-btn:hover { color:#94a3b8; }
    #pn-header-bell { width:38px;height:38px;border-radius:10px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;flex-shrink:0; }
    #pn-header-bell:hover { background:rgba(99,102,241,0.2); }
    #pn-header-bell.pn-active { background:rgba(99,102,241,0.2);border-color:rgba(99,102,241,0.5); }
    #pn-header-bell.pn-blocked { background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.3); }"""

if CSS_ANCHOR not in html:
    print("WARNING: CSS anchor not found — CSS patch skipped")
else:
    html = html.replace(CSS_ANCHOR, CSS_ANCHOR + CSS_INSERT, 1)
    print("✓ CSS patch applied")

# ── PATCH 2: JS block before </body> ─────────────────────────────────
BODY_ANCHOR = "</body>x`"
# Also handle clean </body> in case file was already partially fixed
if BODY_ANCHOR not in html:
    BODY_ANCHOR = "</body>"

JS_INSERT = """
<script>
/* PulseNotify: Chrome Browser Notifications for Nayaruvi Pulse */
const PulseNotify=(()=>{
  const ICON='https://img.icons8.com/color/96/lightning-bolt.png';
  const SK='pn_d';
  const ok=()=>'Notification' in window&&Notification.permission==='granted';
  const no=()=>'Notification' in window&&Notification.permission==='denied';
  const sup=()=>'Notification' in window;

  function showBanner(){
    if(!sup()||ok()||no()){updateBell();return;}
    if(sessionStorage.getItem(SK))return;
    if(document.getElementById('pn-banner'))return;
    const b=document.createElement('div');
    b.id='pn-banner';
    b.innerHTML=`<div class="pn-bell-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.5" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div><div style="flex:1;min-width:0;"><p style="font-size:13px;font-weight:700;color:#f1f5f9;margin:0 0 3px;">Enable Chrome Notifications</p><p style="font-size:11px;color:#94a3b8;margin:0;">Get alerts for tasks, chat &amp; meetings</p></div><button class="pn-allow-btn" id="pn-ab">Allow</button><button class="pn-later-btn" id="pn-lb">Later</button>`;
    document.body.appendChild(b);
    requestAnimationFrame(()=>requestAnimationFrame(()=>b.classList.add('pn-visible')));
    document.getElementById('pn-ab').onclick=()=>{closeBanner();ask();};
    document.getElementById('pn-lb').onclick=()=>{closeBanner();sessionStorage.setItem(SK,'1');};
    setTimeout(()=>closeBanner(),15000);
  }

  function closeBanner(){
    const b=document.getElementById('pn-banner');
    if(!b)return;
    b.classList.remove('pn-visible');
    setTimeout(()=>b.remove(),350);
  }

  async function ask(){
    if(!sup())return false;
    if(ok()){updateBell();return true;}
    try{
      const r=await Notification.requestPermission();
      updateBell();
      if(r==='granted'){
        show('\u2705 Nayaruvi Pulse','Notifications enabled!',{tag:'pn-welcome'});
        showToast('Browser notifications enabled!');
        return true;
      }
      showToast('Notifications not allowed.');
      return false;
    }catch(e){return false;}
  }

  function show(title,body,opts){
    body=body||'';opts=opts||{};
    if(!ok())return;
    try{
      const n=new Notification(title,{body,icon:opts.icon||ICON,tag:opts.tag||('pn-'+Date.now()),requireInteraction:false,silent:false});
      n.onclick=()=>{window.focus();n.close();};
      setTimeout(()=>n.close(),6000);
    }catch(e){console.warn('[PulseNotify]',e);}
  }

  function injectBell(){
    if(document.getElementById('pn-header-bell'))return;
    const hdr=document.querySelector('header .flex.items-center.gap-4.ml-4')||document.querySelector('header .flex.items-center.gap-4');
    if(!hdr)return;
    const btn=document.createElement('button');
    btn.id='pn-header-bell';
    btn.innerHTML='<svg id="pn-bsvg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.2" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
    btn.onclick=async()=>{
      if(ok()){show('\uD83D\uDD14 Nayaruvi Pulse','Notifications are working!',{tag:'pn-test'});showToast('Notifications are ON \u2713');}
      else if(no()){showToast('Blocked! Click the lock icon in your address bar \u2192 Notifications \u2192 Allow');}
      else{await ask();}
    };
    hdr.insertBefore(btn,hdr.lastElementChild);
    updateBell();
  }

  function updateBell(){
    const btn=document.getElementById('pn-header-bell');
    const svg=document.getElementById('pn-bsvg');
    if(!btn||!svg)return;
    btn.classList.remove('pn-active','pn-blocked');
    if(ok()){btn.classList.add('pn-active');svg.setAttribute('stroke','#818cf8');btn.title='Notifications ON \u2014 click to test';}
    else if(no()){btn.classList.add('pn-blocked');svg.setAttribute('stroke','#f87171');btn.title='Notifications blocked in browser';}
    else{svg.setAttribute('stroke','#64748b');btn.title='Click to enable browser notifications';}
  }

  function patchApp(){
    if(typeof App==='undefined'||typeof state==='undefined'){setTimeout(patchApp,400);return;}
    let lc=0;
    const _n=App.createNotification.bind(App);
    App.createNotification=async function(uid,title,msg){
      if(ok()&&state.currentUser&&(uid==='all'||uid===state.currentUser.id))
        show('\uD83D\uDD14 '+(title||'Nayaruvi Pulse'),msg||'',{tag:'pn-n-'+Date.now()});
      return _n(uid,title,msg);
    };
    const _b=App.createBroadcastNotification.bind(App);
    App.createBroadcastNotification=async function(title,msg){
      if(ok())show('\uD83D\uDCE2 '+(title||'Nayaruvi Pulse'),msg||'',{tag:'pn-bc-'+Date.now()});
      return _b(title,msg);
    };
    const _u=App.updateUnreadBadges.bind(App);
    App.updateUnreadBadges=function(){
      _u();
      if(!ok()||!state.currentUser||!state.activeProjectId)return;
      const chats=state.chats.filter(c=>c.projectId===state.activeProjectId);
      if(chats.length>lc&&lc>0){
        const m=chats[chats.length-1];
        if(m&&m.userId!==state.currentUser.id)
          show('\uD83D\uDCAC '+(m.userName||'Team Chat'),m.message||'',{tag:'pn-chat-'+m.id});
      }
      lc=chats.length;
    };
    const _s=App.showApp.bind(App);
    App.showApp=function(){
      _s();
      setTimeout(()=>{injectBell();if(!ok()&&!no())showBanner();else updateBell();},1000);
    };
    console.log('[PulseNotify] ready');
  }
  return{init(){if(sup())patchApp();},show,ask,showBanner};
})();
document.addEventListener('DOMContentLoaded',()=>PulseNotify.init());
</script>
"""

# Read HTML file safely
with open(INPUT, 'r', encoding='utf-8', errors='surrogatepass') as f:
    html = f.read()

# ... all your existing patch code remains unchanged ...

html = html.replace(BODY_ANCHOR, JS_INSERT + "\n</body>", 1)
print("✓ JS patch applied")

# Fix surrogate pairs (emoji issue)
html = html.encode('utf-16', 'surrogatepass').decode('utf-16')

# Save the patched file
with open(INPUT, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"\n✅ Done! Patched file saved as {INPUT}")
print(f"   Backup saved as {BACKUP}")
print(f"   Open {INPUT} in Chrome to see the notification prompt after login.")