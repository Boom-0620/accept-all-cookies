"""Create smaller delivery images without changing dimensions; retain source files.
Run with Pillow installed. No resizing: sprite atlas coordinates remain valid.
"""
from pathlib import Path
from PIL import Image
import io, re, base64, json
root=Path(__file__).resolve().parents[1]
texts=[p for p in root.rglob('*') if p.suffix in ('.js','.html','.css','.json') and '.git' not in p.parts and 'mediapipe' not in p.parts and p.name!='GENERATED-PROMPTS.json']
contents={p:p.read_text() for p in texts}
report_path=root/'tools/asset-optimization.json'
report=[r for r in json.loads(report_path.read_text()) if r['asset']=='thai-flower inline reference'] if report_path.exists() else []
for p in sorted(root.rglob('*.png')):
 if '.git' in p.parts or p.stat().st_size<80000: continue
 # Rewrite only literal references; dynamic filenames continue using original PNG.
 refs=[t for t,s in contents.items() if p.name in s or p.with_suffix('.webp').name in s]
 if not refs: continue
 im=Image.open(p)
 lossless=any(k in p.name.lower() for k in ('atlas','sprite','reference','characters','incense','wafer'))
 out=p.with_suffix('.webp'); b=io.BytesIO()
 im.save(b,format='WEBP',lossless=lossless,quality=90,method=4,exact=True)
 if len(b.getvalue())>=p.stat().st_size*.9:continue
 out.write_bytes(b.getvalue())
 # Decode check, including exact pixels for keyed atlases.
 decoded=Image.open(out);assert decoded.size==im.size
 if lossless: assert decoded.convert('RGBA').tobytes()==im.convert('RGBA').tobytes()
 for t in refs:contents[t]=contents[t].replace(p.name,out.name)
 report.append({'asset':str(p.relative_to(root)),'original':p.stat().st_size,'optimized':out.stat().st_size,'lossless':lossless})
p=root/'modules/thai-flower/index.html';s=contents[p]
def extract(m):
 im=Image.open(io.BytesIO(base64.b64decode(m[2])))
 out=p.parent/'assets/reference-inline.webp';im.save(out,'WEBP',quality=90,method=4)
 report.append({'asset':'thai-flower inline reference','original':len(m[0]),'optimized':out.stat().st_size,'lossless':False})
 return './assets/reference-inline.webp'
s=re.sub(r'data:image/([\w+.-]+);base64,([A-Za-z0-9+/=]+)',extract,s);contents[p]=s
for p,s in contents.items():
 if s!=p.read_text():p.write_text(s)
(root/'tools/asset-optimization.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'assets':len(report),'before':sum(r['original'] for r in report),'after':sum(r['optimized'] for r in report)}))
