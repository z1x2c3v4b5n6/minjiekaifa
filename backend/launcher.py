import json
import os
import shutil
import sys
import webbrowser
from pathlib import Path

import django
from django.core.management import call_command
from django.utils.text import slugify


def get_base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def ensure_data_dirs(data_dir: Path) -> Path:
    data_dir.mkdir(parents=True, exist_ok=True)
    media_dir = data_dir / "media"
    sounds_dir = media_dir / "sounds"
    sounds_dir.mkdir(parents=True, exist_ok=True)
    return sounds_dir


def load_sound_manifest(base_dir: Path):
    manifest_path = base_dir / "bootstrap" / "sound_sources.json"
    if not manifest_path.exists():
        return []
    with manifest_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def sync_sounds(base_dir: Path, sounds_dir: Path, manifest):
    bootstrap_dir = base_dir / "bootstrap" / "sounds"
    for entry in manifest:
        filename = entry.get("filename")
        if not filename:
            continue
        source = bootstrap_dir / filename
        destination = sounds_dir / filename
        if source.exists() and not destination.exists():
            shutil.copy2(source, destination)


def ensure_ambient_sounds(manifest):
    from core.models import AmbientSound

    for entry in manifest:
        filename = entry.get("filename")
        name = entry.get("name") or filename
        if not filename:
            continue
        key = slugify(Path(filename).stem) or Path(filename).stem
        sound, created = AmbientSound.objects.get_or_create(
            key=key,
            defaults={
                "name": name,
                "file_url": f"/media/sounds/{filename}",
                "is_published": True,
            },
        )
        if not created and not sound.file_url:
            sound.file_url = f"/media/sounds/{filename}"
            sound.is_published = True
            sound.save(update_fields=["file_url", "is_published"])


def main():
    base_dir = get_base_dir()
    appdata_root = Path(os.environ.get("APPDATA", Path.home() / "AppData" / "Roaming"))
    data_dir = Path(os.environ.get("TIMEGARDEN_DATA_DIR", appdata_root / "TimeGarden"))
    os.environ.setdefault("TIMEGARDEN_DATA_DIR", str(data_dir))
    os.environ.setdefault("TIMEGARDEN_STATIC_DIR", str(base_dir / "static" / "app"))
    os.environ.setdefault("TIMEGARDEN_DEBUG", "false")
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "timegarden.settings")

    django.setup()

    sounds_dir = ensure_data_dirs(data_dir)
    call_command("migrate", interactive=False)

    manifest = load_sound_manifest(base_dir)
    sync_sounds(base_dir, sounds_dir, manifest)
    ensure_ambient_sounds(manifest)

    url = "http://127.0.0.1:8000"
    webbrowser.open(url)

    from timegarden.wsgi import application
    from waitress import serve

    serve(application, host="127.0.0.1", port=8000)


if __name__ == "__main__":
    main()
