/**
 * disciplines/system/ch14_env.js
 *
 * System Chapter 11 (display) — Environmental and Operational Envelope.
 * Temperature, voltage, EMC, vibration, ingress. Subject = "the system".
 */

Chapters.register('system', {
    id: 'ch14_env',
    number: '10',
    title: 'Environmental and Operational Envelope',
    order: 150,
    intro: 'Temperature, voltage, EMC, vibration, ingress.',
    allowsRequirements: true,
    subjectMode: 'system',
    requirementBudget: { min: 0, max: 20 },
    checklist: [
        { id: 'c14a', text: 'Temperature range (operating, storage) specified.',
          help: 'Operating: temps where system performs to spec. Storage: non-powered survival range. Reference standard (LV124, ISO 16750-4).' },
        { id: 'c14b', text: 'Supply voltage range and transients specified.',
          help: 'Steady-state range plus transient profiles per LV124 / ISO 16750-2: load dump, jump start, cranking, reverse polarity, micro-interruption.' },
        { id: 'c14c', text: 'EMC class per standard clause.',
          help: 'CISPR 25, ISO 11452-x, ISO 10605.' },
        { id: 'c14d', text: 'Vibration and shock per standard clause.',
          help: 'ISO 16750-3, IEC 60068-2-x. Mounting location class (engine, body, wheel).' },
        { id: 'c14e', text: 'Ingress protection rating.',
          help: 'IP code per IEC 60529.' }
    ]
});
