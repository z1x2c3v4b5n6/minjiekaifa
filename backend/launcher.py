import os
import sys
import threading
import time
import webbrowser
from pathlib import Path


def _resolve_data_dir() -> Path:
    appdata = os.getenv("APPDATA")
    if appdata:
        return Path(appdata) / "TimeGarden"
    return Path.home() / ".timegarden"


def main() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "timegarden.settings")
    data_dir = _resolve_data_dir()
    data_dir.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("TIMEGARDEN_DATA_DIR", str(data_dir))
    static_dir = Path(sys.executable).resolve().parent / "static"
    if not static_dir.exists():
        static_dir = Path(__file__).resolve().parent / "static"
    os.environ.setdefault("TIMEGARDEN_STATIC_DIR", str(static_dir))
    media_dir = data_dir / "media"
    media_dir.mkdir(parents=True, exist_ok=True)

    import django
    from django.core.management import call_command

    django.setup()

    call_command("migrate", interactive=False)

    def open_browser():
        time.sleep(1)
        webbrowser.open("http://127.0.0.1:8000")

    threading.Thread(target=open_browser, daemon=True).start()

    from waitress import serve
    from timegarden.wsgi import application

    serve(application, host="127.0.0.1", port=8000)


if __name__ == "__main__":
    main()
