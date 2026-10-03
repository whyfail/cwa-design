from pathlib import Path, PurePosixPath
import hashlib
import json
import tarfile
from datetime import datetime, timezone

out = Path('/tmp/cwa-design-online-8f394b8')
archive = out / 'cwa-design-skill-0.1.0-alpha.1.tar.gz'
digest = lambda b: 'sha256:' + hashlib.sha256(b).hexdigest()
expected = 'sha256:26fc17e480ae582f1defb1ec332034ee9e15e5e9a58f273468ea93ba1f678a48'
data = {}
with tarfile.open(archive, 'r:gz') as tar:
    for member in tar.getmembers():
        p = PurePosixPath(member.name)
        assert not p.is_absolute() and '..' not in p.parts
        assert p.parts[0] == 'cwa-design'
        assert member.isdir() or member.isfile(), 'No links or special files'
        if member.isfile():
            assert member.name not in data
            data[member.name] = tar.extractfile(member).read()

checks = []
roots = [
    ('cwa-design/references', '0.1.0-alpha.1'),
    ('cwa-design/references/versions/react/0.1.0-alpha.0/references', '0.1.0-alpha.0'),
    ('cwa-design/references/versions/react/0.1.0-alpha.1/references', '0.1.0-alpha.1'),
]
for root, version in roots:
    index = json.loads(data[root + '/index.json'])
    manifest = json.loads(data[root + '/manifest.json'])
    assert index['libraryVersion'] == manifest['libraryVersion'] == version
    assert index['registryDigest'] == manifest['registryDigest']
    unsigned = {**manifest, 'registryDigest': ''}
    serialized = json.dumps(unsigned, ensure_ascii=False, indent=2).encode()
    assert digest(serialized) == manifest['registryDigest']
    if version == '0.1.0-alpha.1':
        assert manifest['registryDigest'] == expected
        assert len(manifest['components']) == 30
        assert len(manifest['examples']) == 31
        assert len(manifest['recipes']) == 3
    else:
        assert manifest['registryDigest'] == 'sha256:095bda6190018ed0ee6882a7e74c7130692f227e0b4e5b108a950585e6a157ec'
        assert not manifest.get('artifacts')
    for entry in index['files']:
        p = PurePosixPath(entry['path'])
        assert not p.is_absolute() and '..' not in p.parts
        content = data[root + '/' + entry['path']]
        assert len(content) == entry['byteSize']
        assert digest(content) == entry['contentDigest']
    checks.append({'root': root, 'version': version, 'registryDigest': manifest['registryDigest'],
                   'filesVerified': len(index['files']), 'passed': True})
assert data['cwa-design/SKILL.md'].decode().startswith('---')
result = {'status': 'passed', 'generatedAt': datetime.now(timezone.utc).isoformat(),
          'archive': {'filename': archive.name, 'bytes': archive.stat().st_size,
                      'digest': digest(archive.read_bytes()), 'regularFiles': len(data)},
          'checks': checks}
(out / 'skill-results.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(result, ensure_ascii=False))
