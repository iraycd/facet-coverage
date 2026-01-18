/** @jsxImportSource preact */
import { route } from 'preact-router';
import type { CoverageReport } from '../../../types';

interface DashboardProps {
  report: CoverageReport;
}

export function Dashboard({ report }: DashboardProps) {
  const { summary, byType, features, uncovered } = report;
  const coverageColor = getCoverageColor(summary.percentage);

  return (
    <div class="h-full overflow-y-auto p-6">
      {/* Summary Cards */}
      <div class="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Coverage"
          value={`${summary.percentage}%`}
          colorClass={coverageColor}
          showBar
          barValue={summary.percentage}
        />
        <StatCard label="Total Facets" value={summary.totalFacets} />
        <StatCard label="Covered" value={summary.coveredFacets} colorClass="text-green-400" />
        <StatCard label="Uncovered" value={summary.uncoveredFacets} colorClass="text-red-400" />
      </div>

      {/* Coverage by Type */}
      {byType.length > 0 && (
        <div class="bg-slate-800 rounded-xl p-5 mb-6 border border-slate-700">
          <h2 class="text-lg font-semibold mb-4">Coverage by Type</h2>
          <div class="grid grid-cols-3 gap-4">
            {byType.map(type => (
              <TypeCard key={type.type} type={type} />
            ))}
          </div>
        </div>
      )}

      {/* Features */}
      <div class="bg-slate-800 rounded-xl p-5 mb-6 border border-slate-700">
        <h2 class="text-lg font-semibold mb-4">Features</h2>
        <div class="grid grid-cols-2 gap-4">
          {features.map(feature => (
            <FeatureCard key={feature.feature} feature={feature} />
          ))}
        </div>
      </div>

      {/* Uncovered Facets */}
      {uncovered.length > 0 && (
        <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h2 class="text-lg font-semibold mb-4">
            Uncovered Facets
            {uncovered.length > 10 && (
              <span class="text-sm font-normal text-slate-400 ml-2">
                (showing 10 of {uncovered.length})
              </span>
            )}
          </h2>
          <div class="space-y-2">
            {uncovered.slice(0, 10).map(facet => (
              <div
                key={facet.id}
                onClick={() => route(`/facet/${encodeURIComponent(facet.id)}`)}
                class="p-3 bg-slate-900 rounded-lg border-l-2 border-red-500 hover:bg-slate-700 cursor-pointer"
              >
                <div class="flex items-center justify-between">
                  <code class="text-sm font-medium">{facet.id}</code>
                  <span class="text-xs px-2 py-0.5 bg-slate-700 rounded capitalize">{facet.type}</span>
                </div>
                <div class="text-xs text-slate-400 mt-1">
                  {facet.source.file}#{facet.source.section}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  colorClass?: string;
  showBar?: boolean;
  barValue?: number;
}

function StatCard({ label, value, colorClass = 'text-white', showBar, barValue }: StatCardProps) {
  return (
    <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div class={`text-3xl font-bold ${colorClass}`}>{value}</div>
      <div class="text-sm text-slate-400 mt-1">{label}</div>
      {showBar && barValue !== undefined && (
        <div class="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            class={`h-full ${getCoverageBarColor(barValue)} transition-all`}
            style={{ width: `${barValue}%` }}
          />
        </div>
      )}
    </div>
  );
}

function TypeCard({ type }: { type: { type: string; total: number; covered: number; percentage: number } }) {
  const colorClass = getCoverageColor(type.percentage);
  const barColor = getCoverageBarColor(type.percentage);

  return (
    <div class="bg-slate-900 rounded-lg p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="font-medium capitalize">{type.type}</span>
        <span class={`text-sm font-bold ${colorClass}`}>{type.percentage}%</span>
      </div>
      <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
        <div class={`h-full ${barColor}`} style={{ width: `${type.percentage}%` }} />
      </div>
      <div class="text-xs text-slate-400">{type.covered} / {type.total} covered</div>
    </div>
  );
}

function FeatureCard({ feature }: { feature: { feature: string; percentage: number; coveredFacets: number; totalFacets: number } }) {
  const colorClass = getCoverageColor(feature.percentage);
  const barColor = getCoverageBarColor(feature.percentage);

  return (
    <div
      onClick={() => route(`/feature/${encodeURIComponent(feature.feature)}`)}
      class="bg-slate-900 rounded-lg p-4 hover:bg-slate-700 cursor-pointer transition-colors border border-transparent hover:border-blue-500"
    >
      <div class="font-medium mb-2">{feature.feature}</div>
      <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
        <div class={`h-full ${barColor}`} style={{ width: `${feature.percentage}%` }} />
      </div>
      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-400">{feature.coveredFacets}/{feature.totalFacets} facets</span>
        <span class={`text-sm font-bold ${colorClass}`}>{feature.percentage}%</span>
      </div>
    </div>
  );
}

function getCoverageColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-400';
  if (percentage >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

function getCoverageBarColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}
