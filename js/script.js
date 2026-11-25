/* CountdownApp — vários eventos ao mesmo tempo, com o mais próximo em destaque */

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const banco = {
  ler(k, padrao) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? padrao; } catch { return padrao; } },
  salvar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem storage */ } }
};
const dois = (n) => String(n).padStart(2, '0');
const EMOJIS = ['🎉', '🎂', '✈️', '🎄', '🎆', '💍', '🎓', '🏖️', '📦', '🏁', '🎮', '🎬', '⚽', '💼', '❤️', '🚀'];
const CORES = ['#7c5cff', '#ff5c8a', '#22c3a6', '#ffb020', '#3b9bff', '#ff6b3d', '#b35cff', '#46d160'];

/* Datas guardadas como texto local "AAAA-MM-DDTHH:MM" */
const local = (d) => `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}T${dois(d.getHours())}:${dois(d.getMinutes())}`;
const daqui = (dias, h = 0, m = 0) => { const d = new Date(); d.setDate(d.getDate() + dias); d.setHours(h, m, 0, 0); return local(d); };
function exemplos() {
  const ano = new Date().getFullYear();
  return [
    { id: 1, nome: 'Natal', quando: `${ano}-12-25T00:00`, anual: true, emoji: '🎄', cor: '#46d160', criado: Date.now() - 864e5 * 30, fixo: false },
    { id: 2, nome: 'Ano Novo', quando: `${ano + 1}-01-01T00:00`, anual: true, emoji: '🎆', cor: '#ffb020', criado: Date.now() - 864e5 * 30, fixo: false },
    { id: 3, nome: 'Entrega do projeto', quando: daqui(9, 18), anual: false, emoji: '💼', cor: '#3b9bff', criado: Date.now() - 864e5 * 12, fixo: false },
    { id: 4, nome: 'Viagem para a praia', quando: daqui(48, 7, 30), anual: false, emoji: '🏖️', cor: '#22c3a6', criado: Date.now() - 864e5 * 20, fixo: false },
    { id: 5, nome: 'Show no sábado', quando: daqui(-3, 21), anual: false, emoji: '🎸', cor: '#ff5c8a', criado: Date.now() - 864e5 * 40, fixo: false }
  ];
}
let eventos = banco.ler('cd_eventos', null) ?? exemplos();
const salvar = () => banco.salvar('cd_eventos', eventos);
let filtro = 'proximos';

/* Próxima ocorrência (eventos anuais pulam para o ano seguinte) */
function alvo(e) {
  const d = new Date(e.quando);
  if (!e.anual) return d;
  const agora = new Date();
  const p = new Date(d); p.setFullYear(agora.getFullYear());
  // mantém "é hoje" durante o dia do evento
  if (p.getTime() + 864e5 < agora.getTime()) p.setFullYear(agora.getFullYear() + 1);
  return p;
}
function partes(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
const passou = (e) => alvo(e).getTime() <= Date.now();
const ehHoje = (e) => { const a = alvo(e), h = new Date(); return a.toDateString() === h.toDateString(); };
const fmtData = (d) => {
  const t = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const hora = d.getHours() || d.getMinutes() ? ` às ${dois(d.getHours())}:${dois(d.getMinutes())}` : '';
  return t.charAt(0).toUpperCase() + t.slice(1) + hora;
};
function tempoDesde(ms) {
  const p = partes(ms);
  if (p.d >= 1) return `há ${p.d} ${p.d === 1 ? 'dia' : 'dias'}`;
  if (p.h >= 1) return `há ${p.h} ${p.h === 1 ? 'hora' : 'horas'}`;
  return `há ${Math.max(1, p.m)} min`;
}

const ICO = {
  fixar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>',
  editar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/></svg>'
};

function escolherDestaque() {
  const futuros = eventos.filter((e) => !passou(e) || ehHoje(e));
  return eventos.find((e) => e.fixo) || futuros.sort((a, b) => alvo(a) - alvo(b))[0] || null;
}

function desenhar() {
  const dest = escolherDestaque();
  const box = $('#destaque');
  if (dest) {
    box.style.setProperty('--cor', dest.cor);
    document.documentElement.style.setProperty('--cor', dest.cor);
    box.innerHTML = `<span class="destaque__emoji" aria-hidden="true">${dest.emoji}</span>
      <p class="destaque__rotulo">${dest.fixo ? 'Evento fixado' : 'Próximo evento'}</p>
      <h1>${escapar(dest.nome)}</h1>
      <p class="destaque__data">${fmtData(alvo(dest))}</p>
      <div class="relogio" data-relogio="${dest.id}" role="timer" aria-label="Tempo restante">
        ${['d', 'h', 'm', 's'].map((k) => `<div class="unidade"><strong data-k="${k}">00</strong><span>${{ d: 'dias', h: 'horas', m: 'minutos', s: 'segundos' }[k]}</span></div>`).join('')}
      </div>
      <p class="chegou" hidden>🎉 Chegou o grande dia!</p>
      <div class="progresso"><div class="progresso__barra"><i data-prog></i></div><small><span>criado em ${new Date(dest.criado).toLocaleDateString('pt-BR')}</span><span data-prog-txt></span></small></div>`;
  } else {
    box.style.removeProperty('--cor');
    box.innerHTML = '<p class="destaque__rotulo">Nenhum evento futuro</p><h1>Crie uma contagem regressiva</h1><p class="destaque__data">Aniversários, viagens, lançamentos, prazos…</p>';
  }

  const lista = eventos.filter((e) => (filtro === 'passados' ? passou(e) && !ehHoje(e) : !passou(e) || ehHoje(e)))
    .sort((a, b) => (filtro === 'passados' ? alvo(b) - alvo(a) : alvo(a) - alvo(b)));
  $('#eventos').innerHTML = lista.length ? lista.map((e) => `<li class="evento ${dest?.id === e.id ? 'ativo' : ''}" style="--c:${e.cor}">
      <div class="evento__topo">
        <span class="evento__emoji" aria-hidden="true">${e.emoji}</span>
        <div><h3>${escapar(e.nome)}${e.anual ? '<span class="anual">todo ano</span>' : ''}</h3><span class="evento__data">${fmtData(alvo(e))}</span></div>
        <div class="evento__menu">
          <button data-fixar="${e.id}" aria-pressed="${!!e.fixo}" aria-label="${e.fixo ? 'Desafixar do destaque' : 'Fixar no destaque'}" title="${e.fixo ? 'Desafixar' : 'Fixar no destaque'}">${ICO.fixar}</button>
          <button data-editar="${e.id}" aria-label="Editar ${escapar(e.nome)}" title="Editar">${ICO.editar}</button>
        </div>
      </div>
      ${passou(e) && !ehHoje(e) ? `<p class="passou">Aconteceu <strong data-desde="${e.id}">${tempoDesde(Date.now() - alvo(e))}</strong></p>`
        : `<div class="mini" data-relogio="${e.id}">${['d', 'h', 'm', 's'].map((k) => `<div><strong data-k="${k}">00</strong><span>${{ d: 'dias', h: 'hrs', m: 'min', s: 'seg' }[k]}</span></div>`).join('')}</div>`}
    </li>`).join('')
    : `<li class="vazio">${filtro === 'passados' ? 'Nenhum evento passado.' : 'Nenhum evento futuro. Crie um!'}</li>`;
  tique(true);
}

/* Atualiza só os números a cada segundo */
let ultimo = {};
function tique(forcar = false) {
  const agora = Date.now();
  $$('[data-relogio]').forEach((r) => {
    const e = eventos.find((x) => x.id === +r.dataset.relogio);
    if (!e) return;
    const ms = alvo(e).getTime() - agora;
    const p = partes(ms);
    r.querySelectorAll('[data-k]').forEach((el) => {
      const v = p[el.dataset.k], txt = el.dataset.k === 'd' ? String(v) : dois(v);
      if (el.textContent !== txt) {
        el.textContent = txt;
        if (!forcar && r.classList.contains('relogio')) { el.classList.remove('tique'); void el.offsetWidth; el.classList.add('tique'); }
      }
    });
    if (r.classList.contains('relogio')) {
      const chegou = ms <= 0;
      r.hidden = chegou;
      r.parentElement.querySelector('.chegou').hidden = !chegou;
      const total = alvo(e).getTime() - e.criado, feito = Math.min(1, Math.max(0, (agora - e.criado) / (total || 1)));
      const bar = r.parentElement.querySelector('[data-prog]');
      if (bar) bar.style.width = `${feito * 100}%`;
      const txt = r.parentElement.querySelector('[data-prog-txt]');
      if (txt) txt.textContent = `${Math.floor(feito * 100)}% do caminho`;
      const titulo = chegou ? `🎉 ${e.nome}` : `${p.d}d ${dois(p.h)}:${dois(p.m)}:${dois(p.s)} · ${e.nome}`;
      if (document.title !== titulo) document.title = titulo;
    }
  });
  // um evento acabou de chegar ou passar: redesenha
  const estado = eventos.map((e) => `${e.id}:${passou(e)}:${ehHoje(e)}`).join();
  if (!forcar && ultimo.estado && ultimo.estado !== estado) { ultimo.estado = estado; desenhar(); return; }
  ultimo.estado = estado;
}
setInterval(() => tique(), 1000);

/* Formulário */
const dlg = $('#dlg');
let editando = null;
$('#f-emojis').innerHTML = EMOJIS.map((e, i) => `<label><input type="radio" name="emoji" value="${e}" ${i === 0 ? 'checked' : ''}><span>${e}</span></label>`).join('');
$('#f-cores').innerHTML = CORES.map((c, i) => `<label><input type="radio" name="cor" value="${c}" ${i === 0 ? 'checked' : ''} aria-label="Cor ${i + 1}"><span class="cor" style="--c:${c}"></span></label>`).join('');
function abrir(e = null) {
  editando = e;
  $('#dlg-titulo').textContent = e ? 'Editar evento' : 'Novo evento';
  const q = e?.quando || daqui(7, 0);
  $('#f-nome').value = e?.nome || ''; $('#f-data').value = q.slice(0, 10); $('#f-hora').value = q.slice(11, 16);
  $('#f-anual').checked = !!e?.anual;
  (document.querySelector(`[name=emoji][value="${e?.emoji || EMOJIS[0]}"]`) || document.querySelector('[name=emoji]')).checked = true;
  (document.querySelector(`[name=cor][value="${e?.cor || CORES[eventos.length % CORES.length]}"]`) || document.querySelector('[name=cor]')).checked = true;
  $('#f-excluir').hidden = !e; $('#f-excluir').textContent = 'Excluir'; confirmar = false;
  dlg.showModal();
}
$('#novo').addEventListener('click', () => abrir());
dlg.addEventListener('close', () => {
  if (dlg.returnValue !== 'salvar') return;
  const dados = {
    nome: $('#f-nome').value.trim(), quando: `${$('#f-data').value}T${$('#f-hora').value || '00:00'}`, anual: $('#f-anual').checked,
    emoji: document.querySelector('[name=emoji]:checked').value, cor: document.querySelector('[name=cor]:checked').value
  };
  if (!dados.nome || !$('#f-data').value) return;
  if (editando) Object.assign(editando, dados);
  else eventos.push({ id: Date.now(), criado: Date.now(), fixo: false, ...dados });
  salvar();
  const e = editando || eventos.at(-1);
  filtro = passou(e) && !ehHoje(e) ? 'passados' : 'proximos';
  $$('[data-filtro]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.filtro === filtro));
  desenhar();
  toast(passou(e) && !ehHoje(e) ? 'Essa data já passou. Ele está em “Já aconteceram”.' : 'Contagem criada!');
});
let confirmar = false;
$('#f-excluir').addEventListener('click', (ev) => {
  if (!confirmar) { confirmar = true; ev.target.textContent = 'Confirmar exclusão'; return; }
  eventos = eventos.filter((x) => x !== editando);
  salvar(); dlg.close(); desenhar(); toast('Evento excluído');
});
dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

$('#eventos').addEventListener('click', (ev) => {
  const f = ev.target.closest('[data-fixar]');
  if (f) {
    const e = eventos.find((x) => x.id === +f.dataset.fixar), novo = !e.fixo;
    eventos.forEach((x) => { x.fixo = false; });
    e.fixo = novo; salvar(); desenhar(); scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const ed = ev.target.closest('[data-editar]');
  if (ed) abrir(eventos.find((x) => x.id === +ed.dataset.editar));
});
$$('[data-filtro]').forEach((b) => b.addEventListener('click', () => {
  filtro = b.dataset.filtro;
  $$('[data-filtro]').forEach((x) => x.setAttribute('aria-pressed', x === b));
  desenhar();
}));

let timerToast;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(timerToast); timerToast = setTimeout(() => { t.hidden = true; }, 2800); }

desenhar();
