/** @jsxImportSource preact */
import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import type { CoverageReport, TestLink, FacetCoverage } from '../../../types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface DocumentPageProps {
  report: CoverageReport;
  feature: string;
  file: string;
}

export function DocumentPage({ report, feature, file }: DocumentPageProps) {
  const [markdown, setMarkdown] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedFacetId, setSelectedFacetId] = useState<string | null>(null);
  const [selectedTests, setSelectedTests] = useState<TestLink[]>([]);
  const [testSource, setTestSource] = useState<{ code: string; startLine: number } | null>(null);

  // Find the feature data
  const featureData = report.features.find(f => f.feature === feature);
  const featurePath = featureData?.path || `features/${feature}`;

  // Calculate sourceFile path (relative to feature)
  const sourceFile = `facets/${file}`;

  // Get facets for this file
  const fileFacets = featureData?.facets.filter(
    fc => fc.facet.source.file === sourceFile
  ) || [];

  // Calculate file coverage
  const coveredCount = fileFacets.filter(fc => fc.covered).length;
  const totalCount = fileFacets.length;
  const coveragePercent = totalCount > 0 ? Math.round((coveredCount / totalCount) * 100) : 0;

  // Fetch markdown content
  useEffect(() => {
    setLoading(true);
    // Use relative path (features/checkout/facets/business.md) not absolute
    const relativePath = `features/${feature}/${sourceFile}`;
    fetch(`/api/markdown?path=${encodeURIComponent(relativePath)}`)
      .then(res => res.json())
      .then(data => {
        if (data.content) {
          setMarkdown(data.content);
        } else {
          setMarkdown(`# Error\n\nCould not load ${file}`);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch markdown:', err);
        setMarkdown(`# Error\n\nFailed to load document: ${err.message}`);
        setLoading(false);
      });
  }, [feature, file, sourceFile]);

  // Fetch test source when a test is selected
  useEffect(() => {
    if (selectedTests.length > 0) {
      const test = selectedTests[0];
      fetch(`/api/test-source?file=${encodeURIComponent(test.file)}&line=${test.line || 1}`)
        .then(res => res.json())
        .then(data => {
          if (data.code) {
            setTestSource({ code: data.code, startLine: data.startLine || 1 });
          }
        })
        .catch(err => console.error('Failed to fetch test source:', err));
    } else {
      setTestSource(null);
    }
  }, [selectedTests]);

  const handleFacetClick = (facetId: string, tests: TestLink[]) => {
    setSelectedFacetId(facetId);
    setSelectedTests(tests);
  };

  if (loading) {
    return (
      <div class="flex h-full items-center justify-center">
        <div class="text-slate-400">Loading document...</div>
      </div>
    );
  }

  return (
    <div class="flex h-full">
      {/* Document Panel */}
      <div class="flex-1 overflow-y-auto p-6 border-r border-slate-700">
        {/* Header */}
        <div class="mb-6 pb-4 border-b border-slate-700">
          <div class="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <button
              onClick={() => route('/')}
              class="hover:text-slate-200 transition-colors"
            >
              Dashboard
            </button>
            <span>/</span>
            <span>{feature}</span>
            <span>/</span>
            <span class="text-slate-200">{file}</span>
          </div>
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold">{file.replace('.md', '')}</h1>
            <div class="flex items-center gap-3">
              <span class="text-sm text-slate-400">
                {coveredCount}/{totalCount} facets covered
              </span>
              <CoverageBadge percentage={coveragePercent} />
            </div>
          </div>
        </div>

        {/* Markdown content with inline badges */}
        <MarkdownRenderer
          markdown={markdown}
          report={report}
          featurePath={featurePath}
          sourceFile={sourceFile}
          onFacetClick={handleFacetClick}
          selectedFacetId={selectedFacetId || undefined}
        />

        {/* Facet chip styles */}
        <style>{`
          .facet-chip {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.125rem 0.5rem;
            margin: 0 0.25rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s;
            vertical-align: middle;
          }
          .facet-chip.covered {
            background: rgba(34, 197, 94, 0.2);
            color: rgb(74, 222, 128);
            border: 1px solid rgba(34, 197, 94, 0.3);
          }
          .facet-chip.covered:hover {
            background: rgba(34, 197, 94, 0.3);
          }
          .facet-chip.uncovered {
            background: rgba(239, 68, 68, 0.2);
            color: rgb(248, 113, 113);
            border: 1px solid rgba(239, 68, 68, 0.3);
          }
          .facet-chip.uncovered:hover {
            background: rgba(239, 68, 68, 0.3);
          }
          .facet-chip.unknown {
            background: rgba(148, 163, 184, 0.2);
            color: rgb(148, 163, 184);
            border: 1px solid rgba(148, 163, 184, 0.3);
          }
          .facet-chip.selected {
            ring: 2px;
            ring-offset: 2px;
            box-shadow: 0 0 0 2px rgb(59, 130, 246);
          }
          .markdown-content h1 { font-size: 1.875rem; font-weight: 700; margin: 1.5rem 0 1rem; }
          .markdown-content h2 { font-size: 1.5rem; font-weight: 600; margin: 1.25rem 0 0.75rem; border-bottom: 1px solid rgb(51, 65, 85); padding-bottom: 0.5rem; }
          .markdown-content h3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; }
          .markdown-content h4 { font-size: 1.125rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
          .markdown-content p { margin: 0.75rem 0; line-height: 1.625; }
          .markdown-content ul, .markdown-content ol { margin: 0.5rem 0; padding-left: 1.5rem; }
          .markdown-content li { margin: 0.25rem 0; }
          .markdown-content code { background: rgba(30, 41, 59, 0.8); padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875em; }
          .markdown-content pre { background: rgb(15, 23, 42); padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; }
          .markdown-content pre code { background: transparent; padding: 0; }
          .markdown-content strong { font-weight: 600; }
          .markdown-content a:not(.facet-chip) { color: rgb(96, 165, 250); text-decoration: underline; }
          .markdown-content hr { border-color: rgb(51, 65, 85); margin: 1.5rem 0; }
        `}</style>
      </div>

      {/* Test Panel */}
      <div class="w-96 flex-shrink-0 bg-slate-800/50 overflow-y-auto">
        {selectedFacetId ? (
          <div class="p-4">
            <div class="mb-4">
              <h2 class="text-lg font-semibold mb-1">Tests</h2>
              <p class="text-sm text-slate-400">
                {selectedTests.length} test{selectedTests.length !== 1 ? 's' : ''} covering this facet
              </p>
            </div>

            {selectedTests.length === 0 ? (
              <div class="text-center py-8 text-slate-500">
                <div class="text-4xl mb-2">🧪</div>
                <p>No tests cover this facet</p>
                <p class="text-sm mt-1">Add tests to improve coverage</p>
              </div>
            ) : (
              <div class="space-y-3">
                {selectedTests.map((test, i) => (
                  <div key={i} class="bg-slate-900 rounded-lg overflow-hidden">
                    <div class="p-3 border-b border-slate-700">
                      <div class="font-medium text-sm">{test.title}</div>
                      <div class="text-xs text-slate-400 mt-1">
                        {test.file}:{test.line}
                      </div>
                    </div>
                    {testSource && i === 0 && (
                      <pre class="p-3 text-xs overflow-x-auto bg-slate-950">
                        <code>{testSource.code}</code>
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div class="p-4">
            <h2 class="text-lg font-semibold mb-4">Document Coverage</h2>
            <div class="space-y-2">
              {fileFacets.map(fc => (
                <button
                  key={fc.facet.id}
                  onClick={() => handleFacetClick(fc.facet.id, fc.coveredBy)}
                  class={`w-full text-left p-3 rounded-lg transition-colors ${
                    fc.covered
                      ? 'bg-green-500/10 hover:bg-green-500/20 border border-green-500/20'
                      : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20'
                  }`}
                >
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">
                      {fc.facet.title || fc.facet.id.split(':').pop()}
                    </span>
                    <span class={`text-xs ${fc.covered ? 'text-green-400' : 'text-red-400'}`}>
                      {fc.covered ? `✓ ${fc.coveredBy.length}` : '✗ 0'}
                    </span>
                  </div>
                  {fc.facet.isSubFacet && (
                    <div class="text-xs text-slate-500 mt-1">Sub-facet</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CoverageBadge({ percentage }: { percentage: number }) {
  const colorClass = percentage >= 80
    ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : percentage >= 50
    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    : 'bg-red-500/20 text-red-400 border-red-500/30';

  return (
    <span class={`${colorClass} text-sm px-2 py-1 rounded border font-medium`}>
      {percentage}%
    </span>
  );
}
