import test from 'node:test';
import assert from 'node:assert/strict';
import { JOURNEYS, journeyMap } from '../src/js/journey-modes.js';

test('todas as fases têm paradas conectadas na ordem do percurso em cada layout', () => {
  for (const mode of Object.keys(JOURNEYS)) {
    for (const portrait of [false, true]) {
      const map = journeyMap(mode, portrait);
      const points = map.segments.flatMap(segment => segment.points);
      let previous = -1;
      for (const phase of JOURNEYS[mode].phases) {
        const [x, y] = map.nodes[phase.node];
        assert.ok(x >= 0 && x <= map.w && y >= 0 && y <= map.h);
        const index = points.findIndex(point => point[0] === x && point[1] === y);
        assert.ok(index > previous, `${mode}: parada ${phase.node} fora da ordem`);
        previous = index;
      }
      map.segments.slice(1).forEach((segment, i) => {
        assert.deepEqual(map.segments[i].points.at(-1), segment.points[0]);
      });
    }
  }
});

test('pronta entrega não promete prazo de encomenda nem inclui viagem internacional', () => {
  const ready = JOURNEYS.pronta;
  assert.ok(!ready.phases.some(p => ['compra', 'viagem'].includes(p.node)));
  assert.ok(ready.phases.findIndex(p => p.node === 'mavibag') < ready.phases.findIndex(p => p.node === 'envio'));
  assert.doesNotMatch([ready.intro, ...ready.phases.map(p => p.text)].join(' '), /2 a 14|compra nos EUA/i);
  for (const portrait of [false, true]) assert.ok(journeyMap('pronta', portrait).segments.every(s => s.type === 'land'));
  assert.match(JOURNEYS.encomenda.intro, /2 a 14 dias úteis após o pagamento/);
});
