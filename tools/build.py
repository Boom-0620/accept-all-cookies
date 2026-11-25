"""Bundle the host app after editing cookie-quest JavaScript. Usage: python3 tools/build.py /path/to/esbuild"""
from pathlib import Path
import subprocess, sys, hashlib, re
root=Path(__file__).resolve().parents[1]
subprocess.run([sys.executable,str(root/'tools/build-module-pages.py')],check=True)
subprocess.run([sys.argv[1] if len(sys.argv)>1 else 'esbuild','cookie-quest/main.js','--bundle','--minify','--format=esm','--target=es2020','--outfile=cookie-quest/main.bundle.js'],cwd=root,check=True)
p=root/'cookie-quest/index.html'
hash=hashlib.sha256((root/'cookie-quest/main.bundle.js').read_bytes()).hexdigest()[:12]
p.write_text(re.sub(r'src="\./main(?:\.bundle)?\.js(?:\?[^\"]*)?"',f'src="./main.bundle.js?v={hash}"',p.read_text()))
