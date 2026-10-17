from pathlib import Path
import json

def finish_manifest(root,paths,manifest):
 root=Path(root).resolve();current={str(Path(p).resolve().relative_to(root)).replace('\\','/') for p in paths}
 previous=set(json.loads(manifest.read_text(encoding='utf-8')).get('files',[])) if manifest.exists() else set()
 for relative in previous-current:
  target=(root/relative).resolve()
  if not target.is_relative_to(root):raise ValueError('交付路径越界')
  if target.is_file():target.unlink()
 manifest.parent.mkdir(parents=True,exist_ok=True)
 manifest.write_text(json.dumps({'files':sorted(current)},ensure_ascii=False,indent=2),encoding='utf-8')
