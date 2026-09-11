// Browser-side JS for playbook search/filter
// This file is read by render-playbook.mjs and inlined into the HTML.
// No template-literal escaping needed!

(function () {
  // --- DOM refs ---
  const headings = document.querySelectorAll('.content h1, .content h2, .content h3');
  const tocLinks = document.querySelectorAll('.toc a');
  const tocItems = document.querySelectorAll('.toc li');
  const searchInput = document.getElementById('search');
  const searchClear = document.getElementById('search-clear');
  const searchCount = document.getElementById('search-count');
  const searchBox = document.querySelector('.search-box');
  const contentEl = document.querySelector('.content');

  // --- Scroll-spy: highlight active TOC item ---
  function updateActive() {
    let current = '';
    headings.forEach(function (h) {
      if (h.getBoundingClientRect().top <= 100) current = h.id;
    });
    tocLinks.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }
  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive();

  // --- Smooth scroll on TOC click ---
  tocLinks.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.getElementById(a.getAttribute('href').slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', a.getAttribute('href'));
      }
    });
  });

  // --- Search: filter TOC + highlight content ---
  var originalHTML = contentEl.innerHTML;

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Walk text nodes and wrap matches in <mark>, skip <pre>, <code>, <script>, <style>, <mark>
  function highlightText(root, regex) {
    var SKIP = { PRE: 1, CODE: 1, SCRIPT: 1, STYLE: 1, MARK: 1 };
    var count = 0;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        return SKIP[node.parentElement.tagName] ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (var i = 0; i < nodes.length; i++) {
      var textNode = nodes[i];
      var text = textNode.textContent;
      if (!regex.test(text)) continue;
      regex.lastIndex = 0;
      var frag = document.createDocumentFragment();
      var lastIdx = 0;
      var m;
      while ((m = regex.exec(text)) !== null) {
        if (m.index > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)));
        var mark = document.createElement('mark');
        mark.className = 'search-hl';
        mark.textContent = m[0];
        frag.appendChild(mark);
        count++;
        lastIdx = regex.lastIndex;
      }
      if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      textNode.parentNode.replaceChild(frag, textNode);
    }
    return count;
  }

  function clearHighlights() {
    contentEl.innerHTML = originalHTML;
  }

  function filterToc(query) {
    var q = query.toLowerCase();
    var visibleCount = 0;
    tocItems.forEach(function (li) {
      var text = li.textContent.toLowerCase();
      var match = !q || text.includes(q);
      li.classList.toggle('toc-hidden', !match);
      li.classList.toggle('toc-match', match && !!q);
      if (match) visibleCount++;
    });
    return visibleCount;
  }

  var debounceTimer;
  searchInput.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      var query = searchInput.value.trim();
      searchBox.classList.toggle('has-query', !!query);

      // Reset content to original before re-highlighting
      clearHighlights();

      if (!query) {
        filterToc('');
        searchCount.textContent = '';
        return;
      }

      // Filter TOC
      var tocVisible = filterToc(query);

      // Highlight content
      var regex = new RegExp(escapeRegExp(query), 'gi');
      var matchCount = highlightText(contentEl, regex);

      // Update count
      if (matchCount > 0) {
        searchCount.textContent = matchCount + ' match' + (matchCount !== 1 ? 'es' : '') + ' \u00b7 ' + tocVisible + ' sections';
      } else {
        searchCount.textContent = 'No matches \u00b7 ' + tocVisible + ' sections';
      }

      // Scroll to first match
      var firstMark = contentEl.querySelector('mark.search-hl');
      if (firstMark) {
        firstMark.classList.add('current');
        firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  });

  // Clear button
  searchClear.addEventListener('click', function () {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
    searchInput.focus();
  });

  // Keyboard: Ctrl/Cmd+K to focus search, Escape to clear
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    if (e.key === 'Escape' && document.activeElement === searchInput) {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      searchInput.blur();
    }
  });
})();
