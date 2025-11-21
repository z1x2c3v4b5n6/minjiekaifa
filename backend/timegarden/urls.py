from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def healthcheck(request):
    return JsonResponse({"message": "TimeGarden API is running"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    path("", healthcheck),
]
