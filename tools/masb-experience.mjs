import {lineFighter} from './masb-fighters.mjs';

export function renderExperience(content) {
  const e = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const { example, steps } = content;
  const fighter = who => lineFighter(who.drawing,who.name);
  const impact = `<svg class="battle-impact" viewBox="0 0 200 200" aria-hidden="true"><path d="M100 2L112 67L166 22L135 80L198 100L134 113L173 177L115 136L99 199L83 137L24 174L67 115L2 98L66 82L23 24L84 65Z"/><path d="M53 143L138 50L105 103L154 77L62 160L91 111Z"/></svg>`;
  return `<section class="process wrap" id="experience" aria-labelledby="experience-title">
    <div class="process-heading"><div><p class="label">How it plays</p><p class="process-availability">Application currently unavailable.<a href="#user-guide">Read the user guide ↗</a></p></div><h2 id="experience-title">${e(content.title)}</h2></div>
    <div class="process-layout" data-battle-process data-stage="0">
      <div class="process-sticky">
        <div class="process-screen" aria-label="Illustrative game sequence" aria-describedby="experience-caption">
          <div class="screen-meta"><span>Multiverse / An illustrative encounter</span><span data-scene-label>01 — Describe</span></div>
          <div class="process-scene describe-scene is-active" data-process-scene="0" aria-hidden="false">
            <div class="prompt-heading"><span class="label">Your character</span><span class="label prompt-count">Character description</span></div>
            <div class="example-prompt"><span data-typed-prompt>${e(example.prompt)}</span><span class="prompt-caret" aria-hidden="true"></span></div>
            <div class="prompt-traits"><span>Appearance</span><span>Personality</span><span>Abilities</span></div>
          </div>
          <div class="process-scene generate-scene" data-process-scene="1" aria-hidden="true" inert>
            <div class="portrait-sheet">${fighter(example.player)}<span class="portrait-name">${e(example.player.name)}</span><span class="portrait-scan" aria-hidden="true"></span></div>
            <div class="stat-sheet"><p class="label">Character generated</p><h3>${e(example.player.name)}</h3><div class="example-stats">${example.stats.map(([name,value])=>`<div><span>${name}</span><strong data-stat-value="${value}">${value}</strong><span class="stat-rule" aria-hidden="true"><i style="--stat-size:${Math.min(value/120,1)}"></i></span></div>`).join('')}</div><p class="skill-label">Skillset</p><p class="example-skill">${e(example.skill)}</p><p class="sample-label">Example attributes</p></div>
          </div>
          <div class="process-scene battle-scene" data-process-scene="2" aria-hidden="true" inert>
            <div class="comic-title"><span data-turn-label>01 / Read the opponent</span><span>Turn-based encounter</span></div>
            <div class="arena">
              <svg class="arena-lines" viewBox="0 0 800 450" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0L330 190M800 0L470 190M0 450L330 260M800 450L470 260M0 110L300 205M800 110L500 205M0 340L300 245M800 340L500 245M400 0V150M400 450V300"/></svg>
              <div class="arena-floor" aria-hidden="true"></div>
              <div class="combatant combatant-player"><p>${e(example.player.name)}</p><div class="hp-track" role="meter" aria-label="Example Guardian health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><span data-player-health></span></div>${fighter(example.player)}</div>
              <span class="versus" aria-hidden="true">VS</span>${impact}
              <svg class="battle-strokes" viewBox="0 0 800 450" preserveAspectRatio="none" aria-hidden="true"><g class="slash-strokes"><path d="M180 330Q460 340 650 85"/><path d="M170 345Q470 360 660 80"/><path d="M620 350Q370 310 190 100"/></g><g class="shield-strokes"><ellipse cx="325" cy="245" rx="65" ry="105"/><ellipse cx="325" cy="245" rx="82" ry="125"/></g><g class="spark-strokes"><path d="M400 225L440 120M400 225L530 185M400 225L480 310M400 225L330 330M400 225L270 210M400 225L340 115"/></g></svg>
              <span class="battle-sound" data-battle-sound aria-hidden="true">READY</span>
              <span class="damage damage-player" data-player-damage aria-hidden="true"></span><span class="damage damage-opponent" data-opponent-damage aria-hidden="true"></span>
              <div class="combatant combatant-opponent"><p>${e(example.opponent.name)}</p><div class="hp-track" role="meter" aria-label="Example Duelist health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><span data-opponent-health></span></div>${fighter(example.opponent)}</div>
            </div>
            <div class="comic-caption"><p data-turn-caption>${e(example.turns[0].caption)}</p><div class="comic-page-marks" aria-hidden="true">${example.turns.map(()=>'<span></span>').join('')}</div></div>
          </div>
          <div class="process-scene result-scene" data-process-scene="3" aria-hidden="true" inert>
            <div class="result-heading"><span class="label">The encounter ends</span><span class="label">Win / Loss / Draw</span></div>
            <div class="result-composition"><svg class="result-rays" viewBox="0 0 600 400" aria-hidden="true"><path d="M0 0L210 140M100 0L240 120M300 0V100M500 0L360 120M600 0L390 140M0 400L210 260M100 400L240 280M300 400V300M500 400L360 280M600 400L390 260"/></svg>${fighter(example.player)}<div class="result-type"><p class="result-word">${e(example.outcome)}</p><p class="result-winner">${e(example.player.name)}</p><p class="result-summary">${e(example.summary)}</p></div></div>
            <p class="result-end">Another description. Another possible battle.</p>
          </div>
        </div>
        <div class="process-progress" aria-hidden="true"><span></span></div><p class="process-current" id="process-current" aria-live="off">01 / Describe</p>
      </div>
      <div class="process-stops" role="group" aria-label="Explore the game process">${steps.map((step,i)=>`<div class="process-stop" data-process-stop><button type="button" disabled data-process-button="${i}" aria-pressed="${i===0}" aria-controls="process-current"><span>${String(i+1).padStart(2,'0')}</span><strong>${e(step.title)}</strong></button><p>${e(step.description)}</p>${i===2?`<div class="battle-beats" role="group" aria-label="Battle exchanges">${example.turns.map((turn,j)=>`<div class="battle-beat" data-battle-beat><button type="button" disabled data-beat-button="${j}" aria-pressed="false" aria-controls="process-current"><span>${String(j+1).padStart(2,'0')}</span><strong>${e(turn.title)}</strong></button><p>${e(turn.description)}</p></div>`).join('')}</div>`:''}</div>`).join('')}</div>
    </div>
    <p class="process-footnote" id="experience-caption">Line-drawn illustration of the game flow. Stats, actions, and outcome are a scripted example.</p>
  </section>`;
}
