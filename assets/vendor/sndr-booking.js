// Hólmur adaptation: Icelandic date/guest picker and direct Godo handoff.
// SNDR booking sheet, prototype edition. Shared by Mountain Villa and Himri (identical file in both repos).
//
// The family's range calendar (Akureyri Lodge 14 Oct 2026, Hotel Laugar): two months from 768px, one on a phone,
// hover preview of the range, arrow and page keys between days, a guests stepper, the one action in a bar that never
// scrolls away. The prototype flow mirrors SNDR Bókun's request model: dates and guests, then the guest's details,
// then a request the host confirms and sends a secure pay link for. Nothing here invents availability, a rate or a
// confirmation: every future night shows as open, the summary counts nights only, and the final state says plainly
// that this is the preview. The production layer swaps `submitRequest` for the real engine and `openNights` for the
// synced calendar.
function mountBooking(root, { min = 1, max = 10, guests = 2, months = 18, onStep = () => {}, taken = () => false } = {}) {
  let maxN = max, takenFn = taken;   // Mountain Villas: both change with the chosen house
  const $ = (s, c = root) => c.querySelector(s);
  const $$ = (s, c = root) => [...c.querySelectorAll(s)];
  const form = $('form'), monthsBox = $('.bk-months'), from = $('[data-from]'), to = $('[data-to]');
  const minus = $('.bk-minus'), plus = $('.bk-plus'), gshow = $('.bk-n'), gnote = $('.bk-gnote');
  const sum = $('.bk-sum'), note = $('.bk-note'), action = $('.bk-action'), actionLabel = $('.bk-action > span');
  // Hólmur: dates and guests only; Godo owns availability and checkout.
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const at = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const addMonth = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate()));
  const monthOf = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const firstDay = iso(addDays(today, 1)), todayK = iso(today);
  const lastDay = iso(addMonth(today, months));
  const firstMonth = monthOf(today), lastMonth = monthOf(at(lastDay));
  // Hólmur: hand-written Icelandic names; engines without is-IS ICU data fall back to English through Intl.
  const isMon = ['janúar','febrúar','mars','apríl','maí','júní','júlí','ágúst','september','október','nóvember','desember'];
  const isDay = ['sunnudagur','mánudagur','þriðjudagur','miðvikudagur','fimmtudagur','föstudagur','laugardagur'];
  const isDayS = ['sun.','mán.','þri.','mið.','fim.','fös.','lau.'];
  const fShort = { format: (d) => `${isDayS[d.getDay()]} ${d.getDate()}. ${isMon[d.getMonth()].slice(0, 3)}.` };
  const fLong = { format: (d) => `${isDay[d.getDay()]} ${d.getDate()}. ${isMon[d.getMonth()]} ${d.getFullYear()}` };
  const fMonth = { format: (d) => `${isMon[d.getMonth()][0].toUpperCase()}${isMon[d.getMonth()].slice(1)} ${d.getFullYear()}` };
  const wide = matchMedia('(min-width: 768px)'), still = matchMedia('(prefers-reduced-motion: reduce)');
  const st = { start: '', end: '', hover: '', focus: '', view: firstMonth, guests, drawn: false, step: 'dates' };
  const say = (t) => { note.textContent = t; };
  const plural = (n, w) => `${n} ${w === 'night' ? (n === 1 ? 'nótt' : 'nætur') : (n === 1 ? 'gestur' : 'gestir')}`;
  const nights = () => Math.round((at(st.end) - at(st.start)) / 864e5);
  // the production layer replaces this with the synced calendar
  const openNight = (k) => k >= firstDay && k <= lastDay && !takenFn(k);
  const days$ = () => $$('.bk-d');
  // Mountain Villas: the first booked night after the arrival. A stay may end on that morning (the next
  // guests arrive that afternoon) but never runs through it.
  const blockAfter = (k) => { for (let d = addDays(at(k), 1), e = at(lastDay); d <= e; d = addDays(d, 1)) { const x = iso(d); if (takenFn(x)) return x; } return ''; };

  function paint() {
    const block = st.start && !st.end ? blockAfter(st.start) : '';
    const days = days$(); let b = st.end || (st.hover > st.start ? st.hover : ''); if (block && b > block) b = '';
    let tab = days.find((d) => d.dataset.d === st.focus && !d.disabled);
    if (!tab) tab = days.find((d) => d.dataset.d === st.start) || days.find((d) => !d.disabled);
    days.forEach((d) => {
      const k = d.dataset.d, on = k === st.start || k === st.end;
      if (d.classList.contains('bk-taken')) {
        const out = (block && k === block) || k === st.end;
        d.disabled = !out;
        d.setAttribute('aria-label', `${fLong.format(at(k))}, ${k === st.end ? 'brottför' : out ? 'aðeins brottför' : 'frátekið'}`);
      }
      d.classList.toggle('bk-out', !!block && k === block);
      d.classList.toggle('beyond', !!block && k > block);
      d.classList.toggle('start', k === st.start); d.classList.toggle('end', !!st.end && k === st.end);
      d.classList.toggle('in', !!st.start && !!st.end && k > st.start && k < st.end);
      d.classList.toggle('pv', !st.end && !!b && k > st.start && k < b);
      d.classList.toggle('pv-end', !st.end && !!b && k === b && !(st.start && k < iso(addDays(at(st.start), min))));
      d.classList.toggle('today', k === todayK);
      // the nights too close to the arrival for the minimum stay
      d.classList.toggle('short', !!st.start && !st.end && k > st.start && k < iso(addDays(at(st.start), min)));
      d.setAttribute('aria-pressed', String(on)); d.tabIndex = d === tab ? 0 : -1;
    });
  }
  function labels() {
    from.textContent = st.start ? fShort.format(at(st.start)) : 'Koma';
    to.textContent = st.end ? fShort.format(at(st.end)) : 'Brottför';
    from.classList.toggle('is-set', !!st.start); to.classList.toggle('is-set', !!st.end);
    sum.textContent = st.start && st.end
      ? `${fShort.format(at(st.start))} · ${fShort.format(at(st.end))} · ${plural(nights(), 'night')} · ${plural(st.guests, 'guest')}`
      : st.start ? 'Veldu brottfarardag.' : 'Veldu komu og brottför.';
    actionLabel.textContent = 'SJÁ LAUS HERBERGI';
  }
  function render() {
    const n = wide.matches ? 2 : 1;
    const prevOk = st.view > firstMonth, nextOk = new Date(st.view.getFullYear(), st.view.getMonth() + n - 1, 1) < lastMonth;
    const arrows = `<span class="bk-nav"><button class="bk-prev" type="button" aria-label="Fyrri mánuður"${prevOk ? '' : ' disabled'}><svg class="bk-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><button class="bk-next" type="button" aria-label="Næsti mánuður"${nextOk ? '' : ' disabled'}><svg class="bk-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></span>`;
    let html = '';
    for (let i = 0; i < n; i++) {
      const m = new Date(st.view.getFullYear(), st.view.getMonth() + i, 1), lead = (m.getDay() + 6) % 7, count = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      html += `<div class="bk-m" role="group" aria-label="${fMonth.format(m)}"><div class="bk-m-h"><p class="bk-m-t">${fMonth.format(m)}</p>${i === n - 1 ? arrows : ''}</div><div class="bk-dow" aria-hidden="true">${['M', 'Þ', 'M', 'F', 'F', 'L', 'S'].map((d) => `<span>${d}</span>`).join('')}</div><div class="bk-days">${'<span></span>'.repeat(lead)}`;
      for (let d = 1; d <= count; d++) { const dt = new Date(m.getFullYear(), m.getMonth(), d), k = iso(dt); html += `<button type="button" class="bk-d${k >= firstDay && k <= lastDay && takenFn(k) ? ' bk-taken' : ''}" data-d="${k}" aria-label="${fLong.format(dt)}${k >= firstDay && k <= lastDay && takenFn(k) ? ', frátekið' : ''}" aria-pressed="false" tabindex="-1"${openNight(k) ? '' : ' disabled'}>${d}</button>`; }
      html += '</div></div>';
    }
    monthsBox.innerHTML = html; st.drawn = true;
    paint();
  }
  let slide = [];
  function page(step) {
    const v = new Date(st.view.getFullYear(), st.view.getMonth() + step, 1);
    if (v < firstMonth || v > lastMonth) return;
    st.view = v; render();
    const same = $(step > 0 ? '.bk-next' : '.bk-prev', monthsBox);
    (same && !same.disabled ? same : $('.bk-prev:not(:disabled), .bk-next:not(:disabled)', monthsBox))?.focus({ preventScroll: true });
    slide.forEach((a) => a.cancel());
    if (!still.matches) slide = $$('.bk-dow, .bk-days', monthsBox).map((el) => el.animate([{ opacity: 0, transform: `translateX(${step * 14}px)` }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.23, 1, .32, 1)' }));
  }
  function sync() { paint(); labels(); }
  function pick(k) {
    const block = st.start && !st.end ? blockAfter(st.start) : '';
    if (block && k > block) {
      st.start = k; st.end = ''; st.hover = ''; st.focus = k; sync();
      say(`Veldu brottför eftir ${fShort.format(at(k))}.`); return;
    }
    if (!st.start || st.end || k <= st.start) { st.start = k; st.end = ''; }
    else if (k < iso(addDays(at(st.start), min))) { say(`Veldu að minnsta kosti ${plural(min, 'night')}.`); st.focus = k; paint(); return; }
    else st.end = k;
    st.hover = ''; st.focus = k; say(''); sync();
  }
  function goto(k) {
    const d = at(k), shown = wide.matches ? 2 : 1, first = st.view, last = new Date(first.getFullYear(), first.getMonth() + shown, 0);
    if (d < first || d > last) {
      let v = d > last ? new Date(d.getFullYear(), d.getMonth() - (shown - 1), 1) : monthOf(d);
      st.view = v < firstMonth ? firstMonth : v > lastMonth ? lastMonth : v; render();
    }
    st.focus = k; paint();
    let el = $(`.bk-d[data-d="${k}"]`);
    if (el && el.disabled) {
      const all = days$(), i = all.indexOf(el), dir = k < (document.activeElement?.dataset?.d || k) ? -1 : 1;
      for (let j = i + dir; j >= 0 && j < all.length; j += dir) if (!all[j].disabled) { el = all[j]; st.focus = el.dataset.d; paint(); break; }
    }
    if (el && !el.disabled) el.focus();
  }
  function fit() {
    st.guests = Math.min(Math.max(st.guests, 1), maxN);
    gshow.textContent = plural(st.guests, 'guest'); minus.disabled = st.guests <= 1; plus.disabled = st.guests >= maxN;
    gnote.textContent = '';
    labels();
  }
  monthsBox.addEventListener('click', (e) => {
    const b = e.target.closest('.bk-d'); if (b && !b.disabled) { pick(b.dataset.d); return; }
    const a = e.target.closest('.bk-prev, .bk-next'); if (a && !a.disabled) page(a.classList.contains('bk-next') ? 1 : -1);
  });
  monthsBox.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse' || !st.start || st.end) return;
    const b = e.target.closest('.bk-d'), k = b && !b.disabled ? b.dataset.d : '';
    if (k !== st.hover) { st.hover = k; paint(); }
  });
  monthsBox.addEventListener('pointerleave', () => { if (st.hover) { st.hover = ''; paint(); } });
  monthsBox.addEventListener('keydown', (e) => {
    const b = e.target.closest('.bk-d'); if (!b) return;
    const d = at(b.dataset.d), col = (d.getDay() + 6) % 7;
    const nd = { ArrowLeft: addDays(d, -1), ArrowRight: addDays(d, 1), ArrowUp: addDays(d, -7), ArrowDown: addDays(d, 7), Home: addDays(d, -col), End: addDays(d, 6 - col), PageUp: addMonth(d, -1), PageDown: addMonth(d, 1) }[e.key];
    if (!nd) return;
    e.preventDefault(); let k = iso(nd); if (k < firstDay) k = firstDay; if (k > lastDay) k = lastDay; goto(k);
  });
  minus.addEventListener('click', () => { st.guests -= 1; fit(); });
  plus.addEventListener('click', () => { st.guests += 1; fit(); });
  wide.addEventListener('change', () => { if (st.drawn) render(); });
  still.addEventListener('change', () => { if (still.matches) slide.forEach(a => a.cancel()); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!st.start || !st.end) { say(st.start ? 'Veldu brottfarardag.' : 'Veldu komu og brottför.'); $('.bk-d[tabindex="0"]')?.focus(); return; }
    const url = new URL('https://property.godo.is/booking2.php');
    url.search = new URLSearchParams({propid:'94361',checkin:st.start,numnight:String(nights()),numadult1:String(st.guests)});
    const link = document.createElement('a'); link.href = url.href; link.target = '_blank'; link.rel = 'noopener';
    document.body.append(link); link.click(); link.remove();
    say('Bókunarvél Hólms opnast í nýjum flipa.');
  });
  return {
    prepare() { if (!st.drawn) { render(); fit(); } },
    firstDay() { return $('.bk-d[tabindex="0"]'); },
    reset() { st.start = st.end = st.hover = st.focus = ''; form.reset(); st.guests = guests; fit(); if (st.drawn) paint(); say(''); },
    get step() { return st.step; }
  };
}

window.mountBooking = mountBooking;
