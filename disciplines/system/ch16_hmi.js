/**
 * disciplines/system/ch16_hmi.js
 *
 * System Chapter 13 (display) — Human Factors / HMI and Warning
 * Concept. Driver warnings, takeover requests, degradation
 * notifications.
 */

Chapters.register('system', {
    id: 'ch16_hmi',
    number: '13',
    title: 'Human Factors / HMI and Warning Concept',
    order: 170,
    intro: 'Driver warnings, takeover requests, degradation notifications.',
    allowsRequirements: true,
    subjectMode: 'system',
    requirementBudget: { min: 0, max: 20 },
    checklist: [
        { id: 'c16a', text: 'Driver/operator warnings enumerated with trigger, modality, timing.',
          help: 'Each warning: what triggers it, how it is presented (visual/auditory/haptic), latency budget.' },
        { id: 'c16b', text: 'Takeover requests specified with lead time (if L3+).',
          help: 'SAE Level 3+. Typical regulatory floor 10 s (UN R157). Below L3, mark N/A.' },
        { id: 'c16c', text: 'Degradation notifications specified.',
          help: 'When the system enters a degraded mode, the end-user must be informed unambiguously.' },
        { id: 'c16d', text: 'Regulatory references (UN R79, R157, etc.) present or N/A.' }
    ]
});
