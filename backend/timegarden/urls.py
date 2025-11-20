from django.contrib import admin
from django.http import JsonResponse, HttpResponse
from django.urls import path, include

# 根路径测试接口

def healthcheck(request):
    return JsonResponse({"message": "TimeGarden API is running"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    path('', healthcheck),
]
