import { MAP } from './map-data.js';
import { PHASES } from './journey-phases.js';

const READY_PHASES = [
  { node: 'conversa', title: 'Conversa', text: 'Você me conta o que procura e eu confirmo quais modelos estão disponíveis para pronta entrega.' },
  PHASES[1],
  PHASES[2],
  PHASES[5],
  { node: 'envio', title: 'Envio', text: 'Com o produto preparado, combinamos a entrega para o seu CEP. Frete segurado e rastreio pelo WhatsApp; o prazo é confirmado antes do pagamento.' },
  PHASES[6],
];

export const JOURNEYS = {
  encomenda: {
    phases: PHASES,
    intro: 'Da compra nos EUA à sua casa: encomendas em 2 a 14 dias úteis após o pagamento.',
    message: 'Quero fazer uma encomenda. Pode me ajudar a escolher e confirmar o prazo?',
    cta: 'Começar minha encomenda',
  },
  pronta: {
    phases: READY_PHASES,
    intro: 'Já disponível com a gente: confirme o modelo e a entrega para o seu CEP antes do pagamento.',
    message: 'Quero consultar os produtos à pronta entrega e o prazo para o meu CEP.',
    cta: 'Consultar pronta entrega',
  },
};

export function journeyMap(mode, portrait) {
  const base = portrait ? MAP.mobile : MAP.desktop;
  if (mode === 'encomenda') return base;
  // A pronta entrega segue pela ilha local, sem a compra e a viagem internacional.
  const nodes = portrait
    ? { conversa: [40, 290], contrato: [26, 240], pagamento: [62, 212], mavibag: [92, 225], envio: [128, 240], casa: [114, 280] }
    : { conversa: [26, 102], contrato: [66, 92], pagamento: [108, 98], mavibag: [163, 124], envio: [226, 126], casa: [282, 122] };
  const segments = READY_PHASES.slice(1).map((phase, i) => ({
    from: READY_PHASES[i].node, to: phase.node, type: 'land',
    points: [nodes[READY_PHASES[i].node], nodes[phase.node]],
  }));
  if (!portrait) {
    segments[2].points = [nodes.pagamento, [118, 120], [135, 126], nodes.mavibag];
    segments[3].points = [nodes.mavibag, [195, 128], nodes.envio];
  }
  return { ...base, nodes, segments };
}
