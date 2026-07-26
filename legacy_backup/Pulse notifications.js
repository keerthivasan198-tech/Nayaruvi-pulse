// ============================================================
// Nayaruvi Pulse — Chrome Browser Notification Module
// Include this BEFORE the closing </body> tag in index.html:
//   <script src="pulse-notifications.js"></script>
// Also place sw-notifications.js in the SAME folder as index.html
// ============================================================

const PulseNotify = (() => {
  let _swReg = null;
  let _permission = Notification.permission; // 'default' | 'granted' | 'denied'
  const ICON = 'https://img.icons8.com/color/96/lightning-bolt.png'; // fallback icon

  // ── 1. Register Service Worker ───────────────────────────
  async function registerSW() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register('./sw-notifications.js', { scope: './' });
      await navigator.serviceWorker.ready;
      _swReg = reg;
      console.log('[PulseNotify] Service Worker registered');
      return reg;
    } catch (e) {
      console.warn('[PulseNotify] SW registration failed:', e.message);
      return null;
    }
  }

  // ── 2. Request Permission ────────────────────────────────
  async function requestPermission() {
    if (!('Notification' in window)) {
      console.warn('[PulseNotify] Notifications not supported');
      return false;
    }
    if (_permission === 'granted') return true;
    if (_permission === 'denied') {
      console.warn('[PulseNotify] Permission denied by user');
      return false;
    }
    try {
      const result = await Notification.requestPermission();
      _permission = result;
      return result === 'granted';
    } catch (e) {
      console.warn('[PulseNotify] Permission request error:', e.message);
      return false;
    }
  }

  // ── 3. Show a Browser Notification ──────────────────────
  async function show(title, body = '', options = {}) {
    _permission = Notification.permission;
    if (_permission !== 'granted') return;

    const notifOptions = {
      body,
      icon: options.icon || ICON,
      badge: options.badge || ICON,
      tag: options.tag || ('nayaruvi-' + Date.now()),
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      ...options,
    };

    // Prefer SW notification (shows even when tab is in background)
    if (_swReg) {
      try {
        await _swReg.showNotification(title, notifOptions);
        return;
      } catch (e) {
        console.warn('[PulseNotify] SW showNotification failed, falling back:', e.message);
      }
    }

    // Fallback: direct Notification API
    try {
      new Notification(title, notifOptions);
    } catch (e) {
      console.warn('[PulseNotify] Notification API failed:', e.message);
    }
  }

  // ── 4. Init — call once on page load ────────────────────
  async function init() {
    if (!('Notification' in window)) return;

    await registerSW();

    // If already granted, no need to prompt again
    if (Notification.permission === 'granted') {
      _permission = 'granted';
      console.log('[PulseNotify] Notifications already granted');
      return;
    }

    // Show a non-intrusive prompt banner after 3 seconds
    // (only if not already decided)
    if (Notification.permission === 'default') {
      setTimeout(() => showPermissionBanner(), 3000);
    }
  }

  // ── 5. Permission Banner ─────────────────────────────────
  function showPermissionBanner() {
    if (document.getElementById('pulse-notif-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'pulse-notif-banner';
    banner.style.cssText = `
      position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
      z-index: 9999; background: rgba(15,23,42,0.97);
      border: 1px solid rgba(99,102,241,0.4);
      border-radius: 20px; padding: 16px 20px;
      display: flex; align-items: center; gap: 14px;
      box-shadow: 0 8px 32px rgba(99,102,241,0.2);
      backdrop-filter: blur(12px);
      max-width: 90vw; width: 420px;
      animation: slideUpBanner 0.35s cubic-bezier(0.34,1.56,0.64,1);
    `;
    banner.innerHTML = `
      <style>
        @keyframes slideUpBanner {
          from { opacity:0; transform: translateX(-50%) translateY(30px); }
          to   { opacity:1; transform: translateX(-50%) translateY(0); }
        }
      </style>
      <div style="width:36px;height:36px;border-radius:10px;background:rgba(99,102,241,0.2);
           display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </div>
      <div style="flex:1;min-width:0;">
        <p style="font-size:13px;font-weight:700;color:#f1f5f9;margin:0 0 3px;">
          Enable Notifications
        </p>
        <p style="font-size:11px;color:#94a3b8;margin:0;">
          Get alerts for tasks, meetings &amp; chat messages
        </p>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button id="pulse-notif-allow" style="
          background:#6366f1;color:white;border:none;
          padding:8px 16px;border-radius:10px;
          font-size:12px;font-weight:700;cursor:pointer;">
          Allow
        </button>
        <button id="pulse-notif-dismiss" style="
          background:transparent;color:#64748b;border:1px solid rgba(255,255,255,0.1);
          padding:8px 12px;border-radius:10px;
          font-size:12px;font-weight:600;cursor:pointer;">
          Later
        </button>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('pulse-notif-allow').onclick = async () => {
      banner.remove();
      const granted = await requestPermission();
      if (granted) {
        show('Nayaruvi Pulse', 'Notifications enabled! You\'ll be alerted for tasks, meetings & messages.', {
          tag: 'nayaruvi-welcome',
          icon: ICON,
        });
      }
    };
    document.getElementById('pulse-notif-dismiss').onclick = () => banner.remove();

    // Auto-dismiss after 12 seconds
    setTimeout(() => { if (document.getElementById('pulse-notif-banner')) banner.remove(); }, 12000);
  }

  return { init, show, requestPermission, get permission() { return _permission; } };
})();

// ── Auto-init when DOM is ready ──────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PulseNotify.init());
} else {
  PulseNotify.init();
}

// ── Patch the App object to trigger browser notifications ───
// This runs after App is defined (we wait for DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
  // Wait a tick to ensure App is defined
  setTimeout(() => {
    if (typeof App === 'undefined') return;

    // ── Patch: createNotification ────────────────────────
    const _origCreateNotification = App.createNotification.bind(App);
    App.createNotification = async function(userId, title, message) {
      // Show browser notification if it's for current user or broadcast
      if (
        Notification.permission === 'granted' &&
        (userId === 'all' || (state.currentUser && userId === state.currentUser.id))
      ) {
        PulseNotify.show(
          '🔔 ' + (title || 'Nayaruvi Pulse'),
          message || '',
          { tag: 'nayaruvi-notif-' + Date.now() }
        );
      }
      return _origCreateNotification(userId, title, message);
    };

    // ── Patch: createBroadcastNotification ───────────────
    const _origBroadcast = App.createBroadcastNotification.bind(App);
    App.createBroadcastNotification = async function(title, message) {
      if (Notification.permission === 'granted') {
        PulseNotify.show(
          '📢 ' + (title || 'Nayaruvi Pulse'),
          message || '',
          { tag: 'nayaruvi-broadcast-' + Date.now() }
        );
      }
      return _origBroadcast(title, message);
    };

    // ── Patch: Realtime chat listener ────────────────────
    // Intercept when new chat messages arrive via Firestore snapshot
    // We detect new messages by watching state.chats length changes
    let _lastChatCount = 0;
    const _origUpdateUnread = App.updateUnreadBadges.bind(App);
    App.updateUnreadBadges = function() {
      _origUpdateUnread();
      const projectChats = state.chats.filter(c => c.projectId === state.activeProjectId);
      if (
        Notification.permission === 'granted' &&
        projectChats.length > _lastChatCount &&
        _lastChatCount > 0 // don't fire on initial load
      ) {
        const newest = projectChats[projectChats.length - 1];
        if (newest && newest.userId !== state.currentUser?.id) {
          PulseNotify.show(
            '💬 ' + (newest.userName || 'Team Chat'),
            newest.message || '',
            { tag: 'nayaruvi-chat-' + newest.id }
          );
        }
      }
      _lastChatCount = projectChats.length;
    };

    // ── Add "Notifications" button in header ─────────────
    // Adds a bell icon in the header to manually enable/test
    const header = document.querySelector('header .flex.items-center.gap-4');
    if (header && !document.getElementById('pulse-notif-toggle')) {
      const btn = document.createElement('button');
      btn.id = 'pulse-notif-toggle';
      btn.title = 'Browser notifications';
      btn.style.cssText = `
        width:38px;height:38px;border-radius:10px;
        background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);
        display:flex;align-items:center;justify-content:center;
        cursor:pointer;transition:all 0.2s;flex-shrink:0;
      `;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>`;
      btn.onclick = async () => {
        if (Notification.permission === 'granted') {
          // Test notification
          PulseNotify.show('✅ Nayaruvi Pulse', 'Browser notifications are active!', { tag: 'nayaruvi-test' });
          showToast('Browser notifications are ON ✓');
        } else if (Notification.permission === 'denied') {
          showToast('Notifications blocked. Please allow in browser settings.');
        } else {
          const granted = await PulseNotify.requestPermission();
          if (granted) {
            PulseNotify.show('✅ Nayaruvi Pulse', 'Notifications enabled!', { tag: 'nayaruvi-test' });
            showToast('Browser notifications enabled!');
          }
        }
        updateBellColor();
      };
      // Insert before the user avatar (last item)
      header.insertBefore(btn, header.lastElementChild);
    }

    function updateBellColor() {
      const btn = document.getElementById('pulse-notif-toggle');
      if (!btn) return;
      const svg = btn.querySelector('svg');
      if (!svg) return;
      if (Notification.permission === 'granted') {
        svg.style.stroke = '#818cf8';
        btn.style.background = 'rgba(99,102,241,0.18)';
        btn.style.borderColor = 'rgba(99,102,241,0.45)';
        btn.title = 'Notifications ON — Click to test';
      } else if (Notification.permission === 'denied') {
        svg.style.stroke = '#f87171';
        btn.style.background = 'rgba(239,68,68,0.1)';
        btn.style.borderColor = 'rgba(239,68,68,0.3)';
        btn.title = 'Notifications blocked in browser settings';
      } else {
        svg.style.stroke = '#94a3b8';
        btn.style.background = 'rgba(148,163,184,0.07)';
        btn.style.borderColor = 'rgba(148,163,184,0.15)';
        btn.title = 'Click to enable browser notifications';
      }
    }

    // Initial color update
    updateBellColor();

    // Update bell color whenever permission changes
    setInterval(updateBellColor, 2000);

    console.log('[PulseNotify] App patched successfully');
  }, 500);
});