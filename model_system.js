/**
 * model_system.js
 *
 * System-discipline specializations over model_base. For V1 this is
 * essentially a passthrough — the base model is designed around the
 * SyRS use case. This module exists as the extension point for V2
 * (Item, Software) and V3 (Hardware) disciplines, which will provide
 * their own model_*.js with different predicate sets, different
 * required attributes, and different outline/checklist bindings.
 */

const SYSTEM_DISCIPLINE = {
    id: 'system',
    label: 'System Requirements',
    outlineKey: 'system',

    // Predicates available in this discipline (subset or full set from grammar.js)
    availablePredicates: ['process', 'provide', 'detect', 'transition', 'exhibit', 'conform', 'prohibit'],

    // Attributes considered mandatory at the discipline level
    mandatoryAttributes: ['rationale', 'verification', 'asil'],

    // Safety-relevant: if ASIL != QM, also mandatory
    safetyMandatoryAttributes: ['parentSG', 'ftti']
};
