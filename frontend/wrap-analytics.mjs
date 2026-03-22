import fs from 'fs';

let content = fs.readFileSync('src/components/AnalyticsReport.jsx', 'utf8');

if (!content.includes("import { useTranslation }")) {
  content = content.replace("import { useAuth }", "import { useTranslation } from 'react-i18next';\nimport { useAuth }");
}
if (!content.includes("const { t } = useTranslation()")) {
  content = content.replace("const { user } = useAuth();", "const { t } = useTranslation();\n  const { user } = useAuth();");
}

const replaces = [
  ['Downloadable Analytics Report', '{t("Downloadable Analytics Report")}'],
  ['Generate professional insights across selected telemetry windows.', '{t("Generate professional insights across selected telemetry windows.")}'],
  ["{range === '1h' ? 'Last 1 Hour' : range === '1d' ? 'Last 1 Day' : range === '7d' ? 'Last 7 Days' : 'Custom'}", "{range === '1h' ? t('Last 1 Hour') : range === '1d' ? t('Last 1 Day') : range === '7d' ? t('Last 7 Days') : t('Custom')}"],
  ["{isGenerating ? 'Generating...' : 'Download PDF'}", "{isGenerating ? t('Generating...') : t('Download PDF')}"],
  ["> CSV\n", "> {t('CSV')}\n"],
  ['<p className="text-nature-500 dark:text-white font-medium">Querying selected range...</p>', '<p className="text-nature-500 dark:text-white font-medium">{t("Querying selected range...")}</p>'],
  ['<p className="text-nature-900 dark:text-white font-bold">No data available for selected range</p>', '<p className="text-nature-900 dark:text-white font-bold">{t("No data available for selected range")}</p>'],
  ['<p className="text-nature-500 dark:text-white text-sm">Try widening your time window or selecting a different date.</p>', '<p className="text-nature-500 dark:text-white text-sm">{t("Try widening your time window or selecting a different date.")}</p>'],
  ['<h2 className="text-xl font-bold text-nature-900 dark:text-white">Farm Analytics Report</h2>', '<h2 className="text-xl font-bold text-nature-900 dark:text-white">{t("Farm Analytics Report")}</h2>'],
  ['Generated: ', '{t("Generated:")} '],
  ['<p className="text-xs text-nature-500 dark:text-white uppercase font-bold tracking-wider mb-1">Account Holder</p>', '<p className="text-xs text-nature-500 dark:text-white uppercase font-bold tracking-wider mb-1">{t("Account Holder")}</p>'],
  ['<p className="text-xs text-nature-500 dark:text-white uppercase font-bold tracking-wider mb-1">Assigned Telemetry Array</p>', '<p className="text-xs text-nature-500 dark:text-white uppercase font-bold tracking-wider mb-1">{t("Assigned Telemetry Array")}</p>'],
  ['<p className="text-xs text-blue-600 uppercase font-bold mb-1">Avg Moisture</p>', '<p className="text-xs text-blue-600 uppercase font-bold mb-1">{t("Avg Moisture")}</p>'],
  ['<p className="text-xs text-red-600 uppercase font-bold mb-1">Avg Temperature</p>', '<p className="text-xs text-red-600 uppercase font-bold mb-1">{t("Avg Temperature")}</p>'],
  ['<p className="text-xs text-cyan-600 uppercase font-bold mb-1">Avg Tank Level</p>', '<p className="text-xs text-cyan-600 uppercase font-bold mb-1">{t("Avg Tank Level")}</p>'],
  ['<p className="text-xs text-green-600 uppercase font-bold mb-1">Irrigation Events</p>', '<p className="text-xs text-green-600 uppercase font-bold mb-1">{t("Irrigation Events")}</p>'],
  ['<p className="text-xs text-green-600 font-medium mt-1">Detected Spikes</p>', '<p className="text-xs text-green-600 font-medium mt-1">{t("Detected Spikes")}</p>'],
  ['<p className="text-xs text-green-100 uppercase font-bold tracking-wider mb-0.5">Algorithmic Insight</p>', '<p className="text-xs text-green-100 uppercase font-bold tracking-wider mb-0.5">{t("Algorithmic Insight")}</p>'],
  ['<h3 className="font-bold text-nature-900 dark:text-white border-b pb-2 mb-4">Moisture vs Time</h3>', '<h3 className="font-bold text-nature-900 dark:text-white border-b pb-2 mb-4">{t("Moisture vs Time")}</h3>'],
  ['<h3 className="font-bold text-nature-900 dark:text-white border-b pb-2 mb-4">Temperature vs Time</h3>', '<h3 className="font-bold text-nature-900 dark:text-white border-b pb-2 mb-4">{t("Temperature vs Time")}</h3>'],
  ['Raw Telemetry Snippet (Latest 6 Rows)', '{t("Raw Telemetry Snippet (Latest 6 Rows)")}'],
  ['<th className="px-4 py-3">Timestamp</th>', '<th className="px-4 py-3">{t("Timestamp")}</th>'],
  ['<th className="px-4 py-3">Moisture (%)</th>', '<th className="px-4 py-3">{t("Moisture (%)")}</th>'],
  ['<th className="px-4 py-3">Temperature (°C)</th>', '<th className="px-4 py-3">{t("Temperature (°C)")}</th>'],
  ['<th className="px-4 py-3">Water Level (%)</th>', '<th className="px-4 py-3">{t("Water Level (%)")}</th>'],
];

replaces.forEach(([search, replace]) => {
  content = content.replace(search, replace);
});

// A regex approach for the last part to be super safe:
content = content.replace(/\* Displaying latest 6 rows for PDF stability\. Please download CSV to view all/, '{t("* Displaying latest 6 rows for PDF stability. Please download CSV to view all")}');

fs.writeFileSync('src/components/AnalyticsReport.jsx', content);
console.log('AnalyticsReport wrapped with t()');
