"""Audit the maintained homepage, excluding inert imported source archives.

The upstream auditor skips dist/ and .mjs. Stage an exact temporary copy of the
published homepage surface, using .js names only for static scanning.
"""
import hashlib
import json
import pathlib
import subprocess
import sys
import tempfile

root = pathlib.Path(__file__).resolve().parents[2]
auditor = pathlib.Path(sys.argv[1])
files = [root / 'dist' / name for name in ['index.html', 'home.css', 'home-business-card.css', 'gallery-entry.css']]
files += sorted((root / 'dist').glob('home*.mjs'))
with tempfile.TemporaryDirectory(prefix='.audit-', dir=pathlib.Path(__file__).parent.resolve()) as directory:
    stage = pathlib.Path(directory).resolve()
    assert stage.is_relative_to(root), 'The temporary audit and its cleanup must remain in this checkout.'
    (stage / 'DESIGN.md').write_bytes((root / 'DESIGN.md').read_bytes())
    for file in files:
        name = file.name if file.suffix != '.mjs' else file.stem + '.js'
        (stage / name).write_bytes(file.read_bytes())
    result = subprocess.run([sys.executable, str(auditor), str(stage), '--mode', 'strict', '--no-write'], capture_output=True, text=True)
    evidence = json.loads(result.stdout)
    evidence['scope'] = 'Exact homepage source copies; .mjs renamed .js for static parsing. Inert imported HTML archives are excluded.'
    evidence['sources'] = {str(file.relative_to(root)): hashlib.sha256(file.read_bytes()).hexdigest() for file in files}
    (pathlib.Path(__file__).parent / 'premium-audit.json').write_text(json.dumps(evidence, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(evidence['summary']))
    sys.exit(result.returncode)
