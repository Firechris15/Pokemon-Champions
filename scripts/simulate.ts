/**
 * Headless-Simulator: `npm run simulate -- --battles 1000 --format doubles-standard`
 * Lässt KI gegen KI kämpfen und gibt Balancing-Statistiken aus. Exit-Code 1 bei Fehlern.
 */
import { parseArgs } from 'node:util';
import { easyAgent } from '../src/ai/easy.ts';
import { simulateMany } from '../src/ai/simulate.ts';
import { STANDARD_DEX } from '../src/data/index.ts';

const { values } = parseArgs({
  options: {
    battles: { type: 'string', default: '1000' },
    format: { type: 'string', default: 'doubles-standard' },
    seed: { type: 'string', default: 'sim' },
    json: { type: 'boolean', default: false },
  },
});

const battles = Number.parseInt(values.battles, 10);
const started = performance.now();
const report = simulateMany({
  dex: STANDARD_DEX,
  formatId: values.format,
  battles,
  seedPrefix: values.seed,
  agents: [easyAgent, easyAgent],
});
const seconds = (performance.now() - started) / 1000;

if (values.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const pct = (n: number, d: number) => (d > 0 ? `${((100 * n) / d).toFixed(1)} %` : '–');
  console.log(
    `\n${report.battles}/${battles} Kämpfe (${values.format}) in ${seconds.toFixed(1)} s`,
  );
  console.log(
    `Siege: Seite A ${report.wins[0]} · Seite B ${report.wins[1]} · Unentschieden ${report.ties}`,
  );
  console.log(
    `Runden: min ${report.turns.min} · ⌀ ${report.turns.average.toFixed(1)} · max ${report.turns.max}`,
  );
  console.log('\nMonster (nach Siegrate):');
  const species = Object.entries(report.species).sort(
    ([, a], [, b]) => b.won / Math.max(1, b.played) - a.won / Math.max(1, a.played),
  );
  for (const [id, entry] of species) {
    console.log(
      `  ${STANDARD_DEX.species(id).name.padEnd(14)} Siegrate ${pct(entry.won, entry.played).padStart(7)}` +
        `  gespielt ${String(entry.played).padStart(5)}  mitgebracht ${String(entry.brought).padStart(5)}`,
    );
  }
  console.log('\nAttacken (Nutzung):');
  const totalMoves = Object.values(report.moves).reduce((a, b) => a + b, 0);
  for (const [id, count] of Object.entries(report.moves).sort(([, a], [, b]) => b - a)) {
    console.log(
      `  ${STANDARD_DEX.move(id).name.padEnd(18)} ${pct(count, totalMoves).padStart(7)}  (${count})`,
    );
  }
  if (report.errors.length > 0) {
    console.log(`\n${report.errors.length} Fehler:`);
    for (const error of report.errors.slice(0, 10))
      console.log(`  ${error.seed}: ${error.message}`);
  }
}
process.exitCode = report.errors.length > 0 ? 1 : 0;
