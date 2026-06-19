/* Maktab AI — AI chat client */
(function () {
  const msgs    = document.getElementById('msgs');
  const tinput  = document.getElementById('tinput');
  const selFan  = document.getElementById('sel-fan');
  const selSinf = document.getElementById('sel-sinf');

  /* restore saved state */
  const savedGrade = localStorage.getItem('student_grade') || '7';
  if (selSinf) selSinf.value = savedGrade;

  const urlFan = new URLSearchParams(location.search).get('fan');
  if (urlFan && selFan) selFan.value = urlFan;

  updateContext();
  addWelcome();

  /* ── exposed globals ── */
  window.updateContext = function () {
    const fan  = selFan?.value  || 'Umumiy';
    const sinf = selSinf?.value || '7';
    const title = document.getElementById('hdr-title');
    const sub   = document.getElementById('hdr-sub');
    if (title) title.textContent = `${fan} — AI Repetitor`;
    if (sub)   sub.textContent   = `${sinf}-sinf · O'zbekiston maktab dasturi`;
    localStorage.setItem('student_grade', sinf);
  };

  window.newChat = function () {
    msgs.innerHTML = '';
    addWelcome();
    if (tinput) { tinput.value = ''; tinput.style.height = ''; }
    const chips = document.getElementById('chips-row');
    if (chips) chips.style.display = 'flex';
  };

  window.autoResize = function (ta) {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  window.onKey = function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
  };

  window.sendChip = function (text) {
    const chips = document.getElementById('chips-row');
    if (chips) chips.style.display = 'none';
    /* strip leading emoji if any */
    sendMessage(text.replace(/^[\p{Emoji}\s]+/u, '').trim() || text);
  };

  window.doSend = function () {
    const text = tinput?.value?.trim();
    if (!text) return;
    const chips = document.getElementById('chips-row');
    if (chips) chips.style.display = 'none';
    tinput.value = '';
    if (tinput) tinput.style.height = '';
    sendMessage(text);
  };

  /* ── core ── */
  function addWelcome() {
    const fan  = selFan?.value  || 'Matematika';
    const sinf = selSinf?.value || '7';
    appendAI(
      `Assalomu alaykum! 👋 Men **Maktab AI** repetitoriman.\n\n` +
      `Siz hozir **${sinf}-sinf ${fan}** bo'yicha dars boshlayapsiz.\n` +
      `Menga istalgan savol bering — men qadam-baqadam tushuntirib beraman! 📚`
    );
  }

  async function sendMessage(text) {
    appendMe(text);
    const typing = appendTyping();

    const fan  = selFan?.value  || 'Umumiy';
    const sinf = selSinf?.value || '7';

    try {
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ grade: sinf, subject: fan, message: text })
      });
      const data = await res.json();
      typing.remove();
      appendAI(data.reply || 'Kechirasiz, javob kelmadi.');
    } catch {
      typing.remove();
      appendAI('Kechirasiz, xato yuz berdi. Internet aloqangizni tekshiring va qayta urinib ko\'ring. 🔄');
    }
  }

  /* ── DOM builders ── */
  function appendMe(text) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="msg-label-me">Siz</div>
      <div class="msg-row-me msg-in">
        <div class="bub-me">${esc(text)}</div>
      </div>`;
    msgs.appendChild(wrap);
    scrollBottom();
  }

  function appendAI(text) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="msg-label">AI Repetitor</div>
      <div class="msg-row-ai msg-in">
        <div class="ai-avatar"><span class="ms">smart_toy</span></div>
        <div class="bub-ai">${md(esc(text))}</div>
      </div>`;
    msgs.appendChild(wrap);
    scrollBottom();
    return wrap;
  }

  function appendTyping() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="msg-label">AI Repetitor</div>
      <div class="msg-row-ai msg-in">
        <div class="ai-avatar"><span class="ms">smart_toy</span></div>
        <div class="typing-bub">
          <div class="dot"></div><div class="dot"></div><div class="dot"></div>
        </div>
      </div>`;
    msgs.appendChild(wrap);
    scrollBottom();
    return wrap;
  }

  function scrollBottom() { msgs.scrollTop = msgs.scrollHeight; }

  function esc(s) {
    return s
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }

  function md(s) {
    return s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background:#f0eeff;padding:2px 6px;border-radius:4px;font-size:13px;color:#4b3bff;font-family:monospace">$1</code>');
  }
})();
