"""Inspect exported PDF bytes. Uses the QA runtime's pypdf; no app dependency."""
import json
import re
from pathlib import Path
from pypdf import PdfReader

result = {}
for scope, expected in [('selected', 3), ('chapter', 20), ('complete', 220)]:
    reader = PdfReader(f'artifacts/production-audit-{scope}-proof.pdf')
    assert len(reader.pages) == expected, (scope, len(reader.pages), expected)
    for index, page in enumerate(reader.pages):
        lesson = {'selected': 180, 'chapter': 161, 'complete': 1}[scope] + index
        # SVG glyph positions can make extractors insert spaces inside a word/number.
        compact = re.sub(r'\s+', '', page.extract_text())
        assert f'Lesson{lesson}:' in compact, (scope, index, 'Missing heading')
        assert f'Thisisproductionauditpage{lesson}.' in compact, (scope, index, 'Missing reading content')
    fonts = []
    for reference in reader.pages[0]['/Resources']['/Font'].values():
        font = reference.get_object()
        for descendant in font.get('/DescendantFonts', [font]):
            descriptor = descendant.get_object().get('/FontDescriptor')
            if descriptor:
                descriptor = descriptor.get_object()
                # Chromium can subset SVG text into Type 3 glyph programs instead of a TTF stream.
                embedded = bool(font.get('/Subtype') == '/Type3' and font.get('/CharProcs')) or any(
                    key in descriptor for key in ['/FontFile', '/FontFile2', '/FontFile3'])
                fonts.append({'name': str(descriptor.get('/FontName')), 'type': str(font.get('/Subtype')),
                              'embedded': embedded, 'unicodeMap': '/ToUnicode' in font})
    assert fonts and all(font['embedded'] for font in fonts), fonts
    result[scope] = {'pages': len(reader.pages), 'fonts': fonts,
                     'pageSizePt': [float(number) for number in reader.pages[0].mediabox]}
Path('artifacts/production-pdf-audit.json').write_text(json.dumps(result, indent=2))
print(json.dumps(result))
