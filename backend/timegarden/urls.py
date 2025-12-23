from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path, re_path
from django.views.generic import TemplateView


def healthcheck(request):
    return JsonResponse({"message": "TimeGarden API is running"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    path("healthz/", healthcheck),
    re_path(
        r"^(?!api/|admin/|static/|media/).*",
        TemplateView.as_view(template_name="app/index.html"),
        name="spa",
    ),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
