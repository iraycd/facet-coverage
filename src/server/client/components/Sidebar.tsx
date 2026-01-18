/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import { route } from 'preact-router';
import type { CoverageReport } from '../../../types';

interface SidebarProps {
  report: CoverageReport;
}

export function Sidebar({ report }: SidebarProps) {
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(
    new Set(report.features.map(f => f.feature))
  );

  const toggleFeature = (feature: string) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(feature)) {
      newExpanded.delete(feature);
    } else {
      newExpanded.add(feature);
    }
    setExpandedFeatures(newExpanded);
  };

  // Group facets by file for each feature
  const featureFiles = report.features.map(feature => {
    const fileMap = new Map<string, { covered: number; total: number }>();

    for (const fc of feature.facets) {
      const file = fc.facet.source.file;
      if (!fileMap.has(file)) {
        fileMap.set(file, { covered: 0, total: 0 });
      }
      const stats = fileMap.get(file)!;
      stats.total++;
      if (fc.covered) stats.covered++;
    }

    return {
      feature: feature.feature,
      path: feature.path,
      percentage: feature.percentage,
      files: Array.from(fileMap.entries()).map(([file, stats]) => ({
        file,
        fileName: file.split('/').pop() || file,
        covered: stats.covered,
        total: stats.total,
        percentage: stats.total > 0 ? Math.round((stats.covered / stats.total) * 100) : 0,
      })),
    };
  });

  return (
    <aside class="w-72 flex-shrink-0 border-r border-slate-700 bg-slate-800 flex flex-col">
      {/* Header */}
      <div class="p-4 border-b border-slate-700">
        <h1 class="text-lg font-semibold flex items-center gap-2">
          <span class="text-blue-400">💎</span>
          Facet Docs
        </h1>
      </div>

      {/* Navigation */}
      <nav class="flex-1 overflow-y-auto p-2">
        {/* Dashboard link */}
        <a
          href="/"
          onClick={(e) => { e.preventDefault(); route('/'); }}
          class="flex items-center justify-between px-3 py-2 rounded-md hover:bg-slate-700 cursor-pointer mb-3"
        >
          <div class="flex items-center gap-2">
            <span class="text-slate-400">📊</span>
            <span class="font-medium">Dashboard</span>
          </div>
          <CoverageBadge percentage={report.summary.percentage} />
        </a>

        <div class="text-xs text-slate-500 uppercase tracking-wider px-3 mb-2">
          Features
        </div>

        {/* Feature trees */}
        {featureFiles.map(feature => (
          <div key={feature.feature} class="mb-1">
            {/* Feature header */}
            <div
              onClick={() => toggleFeature(feature.feature)}
              class="flex items-center justify-between px-3 py-2 rounded-md hover:bg-slate-700 cursor-pointer"
            >
              <div class="flex items-center gap-2">
                <span class={`text-xs transition-transform ${expandedFeatures.has(feature.feature) ? 'rotate-90' : ''}`}>
                  ▶
                </span>
                <span class="text-slate-400">📁</span>
                <span class="font-medium text-sm">{feature.feature}</span>
              </div>
              <CoverageBadge percentage={feature.percentage} small />
            </div>

            {/* Files */}
            {expandedFeatures.has(feature.feature) && (
              <div class="ml-4 border-l border-slate-700">
                {feature.files.map(file => (
                  <a
                    key={file.file}
                    href={`/doc/${feature.feature}/${file.fileName}`}
                    onClick={(e) => {
                      e.preventDefault();
                      route(`/doc/${feature.feature}/${file.fileName}`);
                    }}
                    class="flex items-center justify-between px-3 py-1.5 rounded hover:bg-slate-700/50 cursor-pointer group"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-slate-500 group-hover:text-slate-400">📄</span>
                      <span class="text-sm text-slate-300 group-hover:text-slate-100">
                        {file.fileName}
                      </span>
                    </div>
                    <span class="text-xs text-slate-500">
                      {file.covered}/{file.total}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div class="p-3 border-t border-slate-700 text-xs text-slate-500">
        <div class="flex justify-between">
          <span>Total Coverage</span>
          <span>{report.summary.percentage}%</span>
        </div>
        <div class="flex justify-between mt-1">
          <span>Facets</span>
          <span>{report.summary.coveredFacets}/{report.summary.totalFacets}</span>
        </div>
      </div>
    </aside>
  );
}

interface CoverageBadgeProps {
  percentage: number;
  small?: boolean;
}

function CoverageBadge({ percentage, small }: CoverageBadgeProps) {
  const colorClass = percentage >= 80
    ? 'bg-green-500/20 text-green-400'
    : percentage >= 50
    ? 'bg-yellow-500/20 text-yellow-400'
    : 'bg-red-500/20 text-red-400';

  return (
    <span class={`${colorClass} ${small ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'} rounded font-medium`}>
      {percentage}%
    </span>
  );
}
