/* ============================================================
   Allen Mock Trial — shared site script
   Loaded on every page. Handles nav, dropdowns, reveal animation,
   back-to-top, and rendering for the events list / announcement
   banner when those data blocks are present on the page.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  // ---- Mobile nav ----
  var menuBtn = document.getElementById('menuBtn');
  var mobileNav = document.getElementById('mobileNav');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { mobileNav.classList.remove('open'); });
    });
  }

  // ---- Dropdown nav: click the arrow/label to open, click again to close ----
  document.querySelectorAll('.nav-drop-toggle').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var item = btn.closest('.nav-item');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.nav-item.open').forEach(function (i) {
        if (i !== item) { i.classList.remove('open'); i.querySelector('.nav-drop-toggle').setAttribute('aria-expanded', 'false'); }
      });
      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  // ---- Scroll reveal ----
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  // ---- Back to top ----
  var btt = document.getElementById('bttBtn');
  if (btt) {
    window.addEventListener('scroll', function () { btt.classList.toggle('show', window.scrollY > 600); });
    btt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  // ---- Announcement banner (homepage only) ----
  // Content lives in /data/announcement.json, which is what the admin
  // dashboard (/admin/) edits when you log in and update the banner.
  var bannerEl = document.getElementById('announceBanner');
  if (bannerEl) {
    fetch('/data/announcement.json')
      .then(function (r) { return r.json(); })
      .then(function (a) { renderBanner(a); })
      .catch(function () {
        // Fallback for local testing without a server, or if the fetch fails
        if (window.homeAnnouncement) renderBanner(window.homeAnnouncement);
      });
  }
  function renderBanner(a) {
    if (!a || !a.show || !bannerEl) return;
    var linkHtml = a.linkText && a.linkHref
      ? '<a class="ab-link" href="' + a.linkHref + '">' + a.linkText + '</a>' : '';
    bannerEl.innerHTML =
      '<div class="announce-banner-inner">' +
        '<div class="ab-left">' +
          '<span class="ab-label">' + (a.label || 'Announcement') + '</span>' +
          '<span class="ab-text"><strong>' + a.title + '</strong>' + (a.message ? ' — ' + a.message : '') + '</span>' +
        '</div>' +
        linkHtml +
      '</div>';
    bannerEl.classList.add('show');
  }

  // ---- Upcoming events (schedule page only) ----
  // Content lives in /data/events.json, edited via the admin dashboard.
  // Automatically shows only the 3 soonest events from today's date —
  // no need to manually reorder or delete past ones (though deleting
  // old entries keeps the admin list tidy).
  var eventsList = document.getElementById('eventsList');
  if (eventsList) {
    fetch('/data/events.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { renderEvents(d.events || []); })
      .catch(function () {
        eventsList.innerHTML = '<p style="color:var(--gray);font-size:.9rem;">Unable to load events right now.</p>';
      });
  }
  var MONTH_ABBR = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  function renderEvents(events) {
    if (!eventsList) return;
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var upcoming = (events || [])
      .filter(function (ev) { return ev.date; })
      .map(function (ev) {
        var parts = ev.date.split('-').map(Number);
        var d = new Date(parts[0], parts[1] - 1, parts[2]);
        return Object.assign({}, ev, { _d: d });
      })
      .filter(function (ev) { return ev._d >= today; })
      .sort(function (a, b) { return a._d - b._d; })
      .slice(0, 3);

    if (upcoming.length === 0) {
      eventsList.innerHTML = '<p style="color:var(--gray);font-size:.9rem;padding:20px 0;">No upcoming events posted right now — check back soon.</p>';
      return;
    }
    eventsList.innerHTML = upcoming.map(function (ev) {
      var statusClass = ev.status === 'confirmed' ? 'confirmed' : 'pending';
      var statusLabel = ev.status === 'confirmed' ? 'Confirmed' : 'Pending';
      var day = ev._d.getDate();
      var month = MONTH_ABBR[ev._d.getMonth()];
      return (
        '<div class="event-row">' +
          '<div class="event-date">' + day + '<span class="mo">' + month + '</span></div>' +
          '<div><div class="event-name">' + ev.title + '</div><div class="event-loc">' + ev.location + '</div></div>' +
          '<div class="status-pill ' + statusClass + '">' + statusLabel + '</div>' +
        '</div>'
      );
    }).join('');
  }

  // ---- Full calendar PDF download (schedule page only) ----
  var calendarSlot = document.getElementById('calendarDownload');
  if (calendarSlot) {
    fetch('/data/calendar.json')
      .then(function (r) { return r.json(); })
      .then(function (c) {
        if (!c || !c.file) { calendarSlot.style.display = 'none'; return; }
        calendarSlot.innerHTML =
          '<a class="btn btn-outline" href="' + c.file + '" target="_blank" rel="noopener">' +
            '<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:1.8;"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/></svg> ' +
            (c.label || 'Full Calendar') +
          '</a>';
      })
      .catch(function () { calendarSlot.style.display = 'none'; });
  }

  // ---- Homepage flyer (uploaded via admin panel) ----
  // Content lives in /data/flyer.json. If show=true and a file is set,
  // it replaces the default illustration in the dark box on the homepage.
  var courthouseBox = document.getElementById('courthouseBox');
  if (courthouseBox) {
    fetch('/data/flyer.json')
      .then(function (r) { return r.json(); })
      .then(function (f) { renderFlyer(f); })
      .catch(function () { /* fall back silently to default illustration */ });
  }
  function renderFlyer(f) {
    if (!courthouseBox || !f || !f.show || !f.file) return;
    var isPdf = /\.pdf($|\?)/i.test(f.file);
    var captionHtml = f.caption ? esc(f.caption) : '';
    if (isPdf) {
      courthouseBox.innerHTML =
        '<div class="flyer-pdf-card">' +
          '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>' +
          '<div class="fp-title">' + (captionHtml || 'Flyer') + '</div>' +
          (captionHtml ? '' : '<div class="fp-caption">Tap below to view the full flyer.</div>') +
          '<a class="btn btn-outline" style="border-color:#fff;color:#fff;" href="' + f.file + '" target="_blank" rel="noopener">View PDF</a>' +
        '</div>';
    } else {
      courthouseBox.innerHTML =
        '<img class="flyer-image" src="' + f.file + '" alt="' + (captionHtml || 'Club flyer') + '">' +
        (captionHtml ? '<div class="flyer-caption">' + captionHtml + '</div>' : '');
    }
  }
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ---- Join form validation (only runs if #joinForm exists on the page) ----
  var joinForm = document.getElementById('joinForm');
  if (joinForm) {
    var formError = document.getElementById('formError');
    var formMsg = document.getElementById('formMsg');
    var submitBtn = document.getElementById('submitBtn');
    joinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      formError.style.display = 'none';
      var name = document.getElementById('fname').value.trim();
      var email = document.getElementById('email').value.trim();
      if (!name) { formError.textContent = 'Please enter your full name.'; formError.style.display = 'block'; return; }
      if (!email || email.indexOf('@') === -1) { formError.textContent = 'Please enter a valid email address.'; formError.style.display = 'block'; return; }
      formMsg.classList.add('show');
      submitBtn.textContent = 'Submitted';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '.6';
      submitBtn.style.cursor = 'default';
    });
  }

});
