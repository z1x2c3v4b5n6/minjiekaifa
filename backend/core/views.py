from datetime import timedelta

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import models
from django.db.models import Sum
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FocusSession, MoodRecord, Task, UserProfile
from .serializers import (
    FocusSessionSerializer,
    GardenViewSerializer,
    MoodRecordSerializer,
    TaskSerializer,
    UserProfileSerializer,
)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        nickname = request.data.get("nickname", "")
        if not username or not password:
            return Response({"detail": "用户名和密码必填"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({"detail": "用户名已存在"}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(username=username, password=password)
        UserProfile.objects.create(user=user, nickname=nickname)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key})


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)
        if not user:
            return Response({"detail": "登录失败"}, status=status.HTTP_400_BAD_REQUEST)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key})


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({"detail": "退出成功"})


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        return profile


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Task.objects.filter(user=self.request.user).order_by("-created_at")
        status_param = self.request.query_params.get("status")
        category = self.request.query_params.get("category")
        is_today = self.request.query_params.get("is_today")
        if status_param:
            qs = qs.filter(status=status_param)
        if category:
            qs = qs.filter(category=category)
        if is_today:
            qs = qs.filter(is_today=is_today.lower() == "true")
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def set_today(self, request, pk=None):
        task = self.get_object()
        task.is_today = not task.is_today
        task.save()
        return Response({"id": task.id, "is_today": task.is_today})


class FocusSessionViewSet(viewsets.ModelViewSet):
    serializer_class = FocusSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FocusSession.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TodayStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_sessions = FocusSession.objects.filter(user=request.user, created_at__gte=start_of_day)
        total_minutes = today_sessions.aggregate(total=Sum("duration_minutes"))["total"] or 0
        total_pomos = today_sessions.count()
        return Response({"today_minutes": total_minutes, "today_pomodoros": total_pomos})


class OverviewStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        start_date = today - timedelta(days=6)
        sessions = FocusSession.objects.filter(user=request.user, created_at__date__gte=start_date)
        daily = (
            sessions.annotate(day=models.functions.TruncDate("created_at"))
            .values("day")
            .annotate(total=Sum("duration_minutes"))
            .order_by("day")
        )
        category_stats = (
            sessions.filter(task__isnull=False)
            .values("task__category")
            .annotate(total=Sum("duration_minutes"))
        )
        return Response(
            {
                "daily": list(daily),
                "category_stats": {item["task__category"] or "未分类": item["total"] for item in category_stats},
            }
        )


class MoodTodayView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        record = MoodRecord.objects.filter(user=request.user, date=today).first()
        if not record:
            return Response({"mood": None, "note": ""})
        return Response(MoodRecordSerializer(record).data)

    def post(self, request):
        today = timezone.now().date()
        serializer = MoodRecordSerializer(data={
            "date": today,
            "mood": request.data.get("mood", "3"),
            "note": request.data.get("note", ""),
        })
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data)


class MoodRecentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 7))
        today = timezone.now().date()
        start = today - timedelta(days=days - 1)
        records = MoodRecord.objects.filter(user=request.user, date__gte=start).order_by("-date")
        return Response(MoodRecordSerializer(records, many=True).data)


class GardenOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = FocusSession.objects.filter(user=request.user)
        total_pomodoros = sessions.count()
        today = timezone.now().date()
        start_week = today - timedelta(days=6)
        weekly_pomodoros = sessions.filter(created_at__date__gte=start_week).count()
        category_stats = (
            sessions.filter(task__isnull=False)
            .values("task__category")
            .annotate(total=Sum("duration_minutes"))
        )
        total_minutes = sessions.aggregate(total=Sum("duration_minutes"))["total"] or 0
        level = "种子" if total_minutes < 100 else "嫩芽" if total_minutes < 300 else "小树"
        serializer = GardenViewSerializer(
            {
                "total_pomodoros": total_pomodoros,
                "weekly_pomodoros": weekly_pomodoros,
                "category_stats": {c["task__category"] or "未分类": c["total"] for c in category_stats},
                "level": level,
            }
        )
        return Response(serializer.data)
