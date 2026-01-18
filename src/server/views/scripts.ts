/**
 * Client-side JavaScript for hot reload and interactivity
 */
export function getScripts(): string {
  return `
    (function() {
      // WebSocket connection for hot reload
      let ws = null;
      let reconnectAttempts = 0;
      const maxReconnectAttempts = 10;
      const reconnectDelay = 1000;

      const statusIndicator = document.getElementById('status-indicator');
      const statusText = document.getElementById('status-text');

      function showStatus(message, type) {
        if (!statusIndicator) return;
        statusIndicator.className = 'status-indicator visible ' + type;
        if (statusText) statusText.textContent = message;
      }

      function hideStatus() {
        if (statusIndicator) statusIndicator.className = 'status-indicator';
      }

      function connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(protocol + '//' + window.location.host + '/ws');

        ws.onopen = function() {
          console.log('[Facet] WebSocket connected');
          reconnectAttempts = 0;
          showStatus('Connected', 'connected');
          setTimeout(hideStatus, 2000);
        };

        ws.onclose = function() {
          console.log('[Facet] WebSocket disconnected');
          ws = null;

          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = reconnectDelay * Math.min(reconnectAttempts, 5);
            console.log('[Facet] Reconnecting in ' + delay + 'ms...');
            setTimeout(connect, delay);
          }
        };

        ws.onerror = function(error) {
          console.error('[Facet] WebSocket error:', error);
        };

        ws.onmessage = function(event) {
          try {
            const message = JSON.parse(event.data);
            handleMessage(message);
          } catch (e) {
            console.error('[Facet] Failed to parse message:', e);
          }
        };
      }

      function handleMessage(message) {
        switch (message.type) {
          case 'connected':
            console.log('[Facet] Server acknowledged connection');
            break;

          case 'file-change':
            showStatus('File changed: ' + message.data.path, 'updating');
            break;

          case 'coverage-update':
            console.log('[Facet] Coverage updated:', message.data.summary);
            showStatus('Refreshing...', 'updating');
            // Reload the page to show new coverage
            setTimeout(function() {
              window.location.reload();
            }, 300);
            break;

          case 'error':
            console.error('[Facet] Server error:', message.data.message);
            showStatus('Error: ' + message.data.message, 'error');
            break;
        }
      }

      // Start WebSocket connection
      connect();

      // Search functionality
      const searchInput = document.getElementById('sidebar-search');
      if (searchInput) {
        searchInput.addEventListener('input', function(e) {
          const query = e.target.value.toLowerCase();
          const items = document.querySelectorAll('.nav-item');

          items.forEach(function(item) {
            const text = item.textContent.toLowerCase();
            const section = item.closest('.nav-section');

            if (query === '' || text.includes(query)) {
              item.style.display = '';
            } else {
              item.style.display = 'none';
            }
          });

          // Show/hide sections based on visible items
          document.querySelectorAll('.nav-section').forEach(function(section) {
            const visibleItems = section.querySelectorAll('.nav-item:not([style*="display: none"])');
            section.style.display = visibleItems.length > 0 || query === '' ? '' : 'none';
          });
        });
      }

      // Test panel - load test source on click
      document.querySelectorAll('.test-item').forEach(function(item) {
        item.addEventListener('click', function() {
          const file = item.dataset.file;
          const line = item.dataset.line;

          if (!file) return;

          // Mark as active
          document.querySelectorAll('.test-item').forEach(function(i) {
            i.classList.remove('active');
          });
          item.classList.add('active');

          // Load test source
          loadTestSource(file, line);
        });
      });

      async function loadTestSource(file, line) {
        const codeContainer = document.getElementById('test-code');
        if (!codeContainer) return;

        codeContainer.innerHTML = '<div class="empty-state">Loading...</div>';

        try {
          const response = await fetch('/api/test-source?file=' + encodeURIComponent(file) + (line ? '&line=' + line : ''));
          const data = await response.json();

          if (data.error) {
            codeContainer.innerHTML = '<div class="empty-state">' + data.error + '</div>';
            return;
          }

          const lines = data.content.split('\\n');
          let html = '<div class="code-block">';
          html += '<div class="code-header"><span>' + data.file + '</span>';
          html += '<button class="copy-btn" onclick="copyToClipboard(\\'bun test ' + data.file + '\\')">Copy run command</button>';
          html += '</div>';
          html += '<div class="code-content">';

          lines.forEach(function(lineContent, index) {
            const lineNum = data.startLine + index;
            const isHighlight = lineNum === data.highlightLine;
            html += '<div class="code-line' + (isHighlight ? ' highlight' : '') + '">';
            html += '<span class="code-line-number">' + lineNum + '</span>';
            html += '<span class="code-line-content">' + escapeHtml(lineContent) + '</span>';
            html += '</div>';
          });

          html += '</div></div>';
          codeContainer.innerHTML = html;
        } catch (e) {
          codeContainer.innerHTML = '<div class="empty-state">Failed to load source</div>';
        }
      }

      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      // Copy to clipboard helper
      window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(function() {
          // Could show a toast here
          console.log('[Facet] Copied to clipboard');
        });
      };

      // Keyboard shortcuts
      document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          if (searchInput) searchInput.focus();
        }
      });
    })();
  `;
}
