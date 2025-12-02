from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def healthcheck(request):
    return JsonResponse({"message": "TimeGarden API is running"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    path("", healthcheck),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
