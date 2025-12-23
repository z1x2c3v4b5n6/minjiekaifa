from django.conf import settings
from django.contrib import admin
from django.http import FileResponse, Http404
from django.urls import include, path, re_path
from django.views.static import serve


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]


def spa_fallback(request):
    index_path = settings.STATIC_APP_DIR / "index.html"
    if not index_path.exists():
        raise Http404("SPA index not found")
    return FileResponse(open(index_path, "rb"), content_type="text/html")


urlpatterns += [
    re_path(r"^(?!api/|admin/|static/|media/).*$", spa_fallback),
]
