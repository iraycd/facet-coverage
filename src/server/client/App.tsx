/** @jsxImportSource preact */
import { Router, Route } from 'preact-router';
import { useState, useEffect } from 'preact/hooks';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { DocumentPage } from './pages/DocumentPage';
import { StatusIndicator } from './components/StatusIndicator';
import type { CoverageReport } from '../../types';

export function App() {
  const [report, setReport] = useState<CoverageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'connected' | 'updating' | 'error' | null>(null);

  // Fetch initial coverage data
  useEffect(() => {
    fetchCoverage();
    connectWebSocket();
  }, []);

  async function fetchCoverage() {
    try {
      const res = await fetch('/api/coverage');
      const data = await res.json();
      setReport(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch coverage:', err);
      setLoading(false);
    }
  }

  function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      setStatus('connected');
      setTimeout(() => setStatus(null), 2000);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'file-change') {
        setStatus('updating');
      } else if (message.type === 'coverage-update') {
        fetchCoverage();
        setStatus('connected');
        setTimeout(() => setStatus(null), 2000);
      } else if (message.type === 'client-reload') {
        // Client source changed - reload the page to get new bundle
        console.log('Client bundle updated, reloading...');
        window.location.reload();
      }
    };

    ws.onclose = () => {
      setTimeout(connectWebSocket, 1000);
    };
  }

  if (loading) {
    return (
      <div class="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div class="text-center">
          <div class="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500 mx-auto"></div>
          <p class="text-slate-400">Loading coverage data...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div class="flex h-screen items-center justify-center bg-slate-900 text-white">
        <p class="text-red-400">Failed to load coverage data</p>
      </div>
    );
  }

  return (
    <div class="flex h-screen bg-slate-900 text-slate-100">
      <Sidebar report={report} />
      <main class="flex-1 overflow-hidden">
        <Router>
          <Route path="/" component={() => <Dashboard report={report} />} />
          <Route path="/doc/:feature/:file" component={({ feature, file }: { feature: string; file: string }) => (
            <DocumentPage
              report={report}
              feature={decodeURIComponent(feature)}
              file={decodeURIComponent(file)}
            />
          )} />
        </Router>
      </main>
      <StatusIndicator status={status} />
    </div>
  );
}
