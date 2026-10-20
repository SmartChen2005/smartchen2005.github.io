export function renderExperience(content) {
  const e = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const { example, steps, guide } = content;
  const fighter = (who, cls = '') => `<img class="process-fighter ${cls}" src="assets/${who.file}" width="${who.width}" height="${who.height}" alt="${e(who.name)} — existing project artwork" decoding="async">`;
  const impact = `<svg class="battle-impact" viewBox="0 0 200 200" aria-hidden="true"><path d="M100 2L112 67L166 22L135 80L198 100L134 113L173 177L115 136L99 199L83 137L24 174L67 115L2 98L66 82L23 24L84 65Z"/><path d="M53 143L138 50L105 103L154 77L62 160L91 111Z"/></svg>`;
  return `<section class="process wrap" id="experience" aria-labelledby="experience-title">
    <div class="process-heading"><div><p class="label">How it plays</p><p class="process-availability">Application currently unavailable.<a href="#user-guide">Read the user guide ↗</a></p></div><h2 id="experience-title">${e(content.title)}</h2></div>
    <div class="process-layout" data-battle-process data-stage="0">
      <div class="process-sticky">
        <div class="process-screen" aria-label="Illustrative game sequence" aria-describedby="experience-caption">
          <div class="screen-meta"><span>Multiverse / An illustrative encounter</span><span data-scene-label>01 — Describe</span></div>
          <div class="process-scene describe-scene is-active" data-process-scene="0" aria-hidden="false">
            <div class="prompt-heading"><span class="label">Your character</span><span class="prompt-corner" aria-hidden="true">↙</span></div>
            <div class="example-prompt"><span data-typed-prompt>${e(example.prompt)}</span><span class="prompt-caret" aria-hidden="true"></span></div>
            <div class="prompt-traits"><span>Appearance</span><span>Personality</span><span>Abilities</span></div>
            <p class="prompt-limit">A few words set the world in motion.</p>
          </div>
          <div class="process-scene generate-scene" data-process-scene="1" aria-hidden="true" inert>
            <div class="portrait-sheet">${fighter(example.player)}<span class="portrait-name">${e(example.player.name)}</span><span class="portrait-tick" aria-hidden="true">+</span></div>
            <div class="stat-sheet"><p class="label">Character generated</p><h3>${e(example.player.name)}</h3><div class="example-stats">${example.stats.map(([name,value])=>`<div><span>${name}</span><strong data-stat-value="${value}">${value}</strong><span class="stat-rule" aria-hidden="true"><i style="--stat-size:${Math.min(value/120,1)}"></i></span></div>`).join('')}</div><p class="skill-label">Skillset</p><p class="example-skill">${e(example.skill)}</p><p class="sample-label">Example attributes</p></div>
          </div>
          <div class="process-scene battle-scene" data-process-scene="2" aria-hidden="true" inert>
            <div class="comic-title"><span data-turn-label>01 / The opening move</span><span>Battle simulation</span></div>
            <div class="arena">
              <div class="combatant combatant-player"><p>${e(example.player.name)}</p><div class="hp-track" role="meter" aria-label="Example Guardian health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><span data-player-health></span></div>${fighter(example.player)}</div>
              <span class="versus" aria-hidden="true">VS</span>${impact}
              <div class="combatant combatant-opponent"><p>${e(example.opponent.name)}</p><div class="hp-track" role="meter" aria-label="Example Duelist health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><span data-opponent-health></span></div>${fighter(example.opponent)}</div>
            </div>
            <div class="comic-caption"><p data-turn-caption>${e(example.turns[0].caption)}</p><div class="comic-page-marks" aria-hidden="true"><span></span><span></span><span></span></div></div>
          </div>
          <div class="process-scene result-scene" data-process-scene="3" aria-hidden="true" inert>
            <div class="result-heading"><span class="label">The encounter ends</span><span class="label">Win / Loss / Draw</span></div>
            <div class="result-composition">${fighter(example.player)}<div class="result-type"><p class="result-word">${e(example.outcome)}</p><p class="result-winner">${e(example.player.name)}</p><p class="result-summary">${e(example.summary)}</p></div></div>
            <p class="result-end">Another description. Another possible battle.</p>
          </div>
        </div>
        <div class="process-progress" aria-hidden="true"><span></span></div><p class="process-current" id="process-current" aria-live="off">01 / Describe</p>
      </div>
      <div class="process-stops" role="group" aria-label="Explore the game process">${steps.map((step,i)=>`<div class="process-stop" data-process-stop><button type="button" disabled data-process-button="${i}" aria-pressed="${i===0}" aria-controls="process-current"><span>${String(i+1).padStart(2,'0')}</span><strong>${e(step.title)}</strong></button><p>${e(step.description)}</p></div>`).join('')}</div>
    </div>
    <p class="process-footnote" id="experience-caption">Illustrative sequence using existing project artwork. Stats, actions, and outcome are a scripted example.</p>
    <div class="user-guide" id="user-guide"><div><p class="label">Original user guide</p><p>Instructions preserved from the application's original release.</p></div><a href="files/${guide.file}" target="_blank" rel="noopener noreferrer"><span>User guide <span aria-hidden="true">↗</span></span><small>PDF · ${guide.pages} pages · opens in a new tab</small></a></div>
  </section>`;
}
