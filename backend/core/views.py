from django.db import models
from django.utils import timezone
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Task, FocusSession
from .serializers import TaskSerializer, FocusSessionSerializer


class TaskListCreateView(generics.ListCreateAPIView):
    """列出和创建任务"""

    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer


class FocusSessionListCreateView(generics.ListCreateAPIView):
    """列出和创建专注记录"""

    queryset = FocusSession.objects.all().order_by('-created_at')
    serializer_class = FocusSessionSerializer


class TodayStatsView(APIView):
    """返回今日累计专注分钟数"""

    def get(self, request):
        now = timezone.now()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        total_minutes = FocusSession.objects.filter(created_at__gte=start_of_day).aggregate(
            total=models.Sum('duration_minutes')
        )['total'] or 0
        return Response({"today_minutes": total_minutes})
