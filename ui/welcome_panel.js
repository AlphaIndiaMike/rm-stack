/**
 * ui/welcome_panel.js
 *
 * Center-pane onboarding shown when no chapter is selected (fresh open,
 * after Reset, after Load). Two action paths: load existing project,
 * or pick a chapter from the outline. The Load button delegates to the
 * top-bar Load button (file-input wiring lives in main.js).
 *
 * Self-contained — no dependency on EditorView state beyond the doc.
 */

const WelcomePanel = {

    isDocumentEmpty(doc) {
        return doc.requirements.length === 0
            && doc.elements.length === 0
            && doc.itemFunctions.length === 0
            && doc.safetyGoals.length === 0
            && doc.modes.length === 0
            && doc.interfaces.length === 0
            && doc.assumptions.length === 0
            && Object.keys(doc.checklistState || {}).length === 0;
    },

    render(container, doc) {
        const fresh = this.isDocumentEmpty(doc);
        const wrapper = document.createElement('div');
        wrapper.className = 'welcome-panel';
        wrapper.innerHTML = `
            <p class="welcome-lead">
                Author safety-aware system requirements with grammar validation,
                completeness tracking, and integrity checks. Everything stays
                local — your project is a single <code>.rms</code> file.
            </p>

            <div class="welcome-steps">
                <div class="welcome-step">
                    <div class="welcome-step-num">1</div>
                    <div class="welcome-step-body">
                        <strong>Open an existing project</strong>
                        <p>Load a previously saved project file to pick up where you left off.</p>
                        <button id="welcomeLoadBtn" class="btn-welcome-load">Load Project…</button>
                    </div>
                </div>

                <div class="welcome-or">— or —</div>

                <div class="welcome-step">
                    <div class="welcome-step-num">2</div>
                    <div class="welcome-step-body">
                        <strong>Start a new project</strong>
                        <p>Confirm <em>Discipline</em> and <em>Class</em> in the top bar, then click any chapter
                        in the <em>Document Outline</em> on the left to begin authoring.</p>
                    </div>
                </div>
            </div>

            <div class="welcome-layout-hint">
                <div><span class="welcome-pane-tag">Left</span> outline &amp; per-chapter completeness</div>
                <div><span class="welcome-pane-tag">Center</span> chapter editor &amp; SMART requirement builder</div>
                <div><span class="welcome-pane-tag">Right</span> live model summary &amp; integrity flags</div>
            </div>

            ${fresh ? '' : `
                <p class="welcome-note">
                    Your current project already has content — pick a chapter on the left
                    to continue editing. Load and Save become available in the top bar
                    once a chapter is open.
                </p>
            `}
        `;
        container.appendChild(wrapper);

        const loadBtn = wrapper.querySelector('#welcomeLoadBtn');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                document.getElementById('loadJsonButton').click();
            });
        }
    }
};
