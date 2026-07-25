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
  var eventsList = document.getElementById('eventsList');
  if (eventsList) {
    fetch('/data/events.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { renderEvents(d.events || []); })
      .catch(function () {
        if (window.upcomingEvents) renderEvents(window.upcomingEvents);
        else eventsList.innerHTML = '<p style="color:var(--gray);font-size:.9rem;">Unable to load events right now.</p>';
      });
  }
  function renderEvents(events) {
    if (!eventsList) return;
    if (!events || events.length === 0) {
      eventsList.innerHTML = '<p style="color:var(--gray);font-size:.9rem;padding:20px 0;">No upcoming events posted right now — check back soon.</p>';
      return;
    }
    eventsList.innerHTML = events.map(function (ev) {
      var statusClass = ev.status === 'confirmed' ? 'confirmed' : 'pending';
      var statusLabel = ev.status === 'confirmed' ? 'Confirmed' : 'Pending';
      return (
        '<div class="event-row">' +
          '<div class="event-date">' + ev.day + '<span class="mo">' + ev.month + '</span></div>' +
          '<div><div class="event-name">' + ev.title + '</div><div class="event-loc">' + ev.location + '</div></div>' +
          '<div class="status-pill ' + statusClass + '">' + statusLabel + '</div>' +
        '</div>'
      );
    }).join('');
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
