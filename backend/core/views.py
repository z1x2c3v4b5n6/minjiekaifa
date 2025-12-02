from datetime import timedelta

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import models
from django.db.models import Count, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AmbientSound, Announcement, FocusSession, MoodRecord, Task, UserProfile
from .permissions import IsAdminUserRole
from .serializers import (
    AdminUserSerializer,
    AmbientSoundSerializer,
    AnnouncementSerializer,
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
        role = request.data.get("role", "user")
        if not username or not password:
            return Response({"detail": "用户名和密码必填"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({"detail": "用户名已存在"}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(username=username, password=password)
        UserProfile.objects.create(user=user, nickname=nickname, role=role)
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "user": {
                    "id": user.id,
                    "nickname": nickname or username,
                    "role": role,
                },
            }
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)
        if not user:
            return Response({"detail": "登录失败"}, status=status.HTTP_400_BAD_REQUEST)
        token, _ = Token.objects.get_or_create(user=user)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "user": {
                    "id": user.id,
                    "nickname": profile.nickname or user.username,
                    "role": profile.role,
                },
            }
        )


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
        filter_param = self.request.query_params.get("filter")

        if status_param:
            qs = qs.filter(status=status_param)
        if category:
            qs = qs.filter(category=category)
        if is_today:
            qs = qs.filter(is_today=is_today.lower() == "true")
        if filter_param == "today":
            qs = qs.filter(is_today=True)
        if filter_param == "important":
            qs = qs.filter(priority="important")
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

        # 计算连续专注天数
        session_dates = set(
            FocusSession.objects.filter(user=request.user)
            .dates("created_at", "day", order="DESC")
        )
        streak_days = 0
        current_day = now.date()
        while current_day in session_dates:
            streak_days += 1
            current_day -= timedelta(days=1)

        return Response(
            {
                "today_minutes": total_minutes,
                "today_sessions": total_pomos,
                "streak_days": streak_days,
            }
        )


class OverviewStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        days = int(request.query_params.get("days", 7))
        start_date = today - timedelta(days=days - 1)
        sessions = FocusSession.objects.filter(user=request.user, created_at__date__gte=start_date)

        daily_map = {start_date + timedelta(days=i): 0 for i in range(days)}
        daily = (
            sessions.annotate(day=models.functions.TruncDate("created_at"))
            .values("day")
            .annotate(total=Sum("duration_minutes"))
            .order_by("day")
        )
        for item in daily:
            daily_map[item["day"]] = item["total"]

        category_stats = (
            sessions.filter(task__isnull=False)
            .values("task__category")
            .annotate(total=Sum("duration_minutes"))
        )

        total_tasks = Task.objects.filter(user=request.user).count()
        completed_tasks = Task.objects.filter(user=request.user, status="done").count()
        completion_rate = completed_tasks / total_tasks if total_tasks else 0

        return Response(
            {
                "daily_minutes": [
                    {"date": day.strftime("%m-%d"), "minutes": daily_map[day]} for day in sorted(daily_map.keys())
                ],
                "category_stats": {item["task__category"] or "未分类": item["total"] for item in category_stats},
                "completion_rate": completion_rate,
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
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
        total_pomodoros = sessions.filter(is_completed=True).count()
        exp_per_pomodoro = 10
        current_exp = total_pomodoros * exp_per_pomodoro
        level = current_exp // 200 + 1
        next_level_exp = level * 200
        if level < 2:
            stage = "幼苗期"
        elif level < 4:
            stage = "成长期"
        elif level < 6:
            stage = "茂盛期"
        else:
            stage = "繁盛期"

        serializer = GardenViewSerializer(
            {
                "stage": stage,
                "level": level,
                "current_exp": current_exp,
                "next_level_exp": next_level_exp,
                "total_pomodoros": total_pomodoros,
            }
        )
        return Response(serializer.data)


class AdminOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        now = timezone.now()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_sessions = FocusSession.objects.filter(created_at__gte=start_of_day)
        total_focus_minutes = FocusSession.objects.aggregate(total=Sum("duration_minutes"))["total"] or 0
        top_scene = (
            UserProfile.objects.values("default_scene")
            .annotate(count=Count("id"))
            .order_by("-count")
            .first()
        )
        today_plan_users = (
            Task.objects.filter(is_today=True)
            .values("user_id")
            .annotate(count=Count("id"))
            .count()
        )
        return Response(
            {
                "total_users": User.objects.count(),
                "total_focus_minutes": total_focus_minutes,
                "today_focus_minutes": today_sessions.aggregate(total=Sum("duration_minutes"))["total"] or 0,
                "today_sessions": today_sessions.count(),
                "top_scene": top_scene["default_scene"] if top_scene else None,
                "today_plan_users": today_plan_users,
            }
        )


class AdminUserListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        return (
            User.objects.all()
            .annotate(
                total_focus_minutes=Coalesce(Sum("sessions__duration_minutes"), 0),
                total_sessions=Coalesce(Count("sessions"), 0),
            )
            .select_related("profile")
            .order_by("-date_joined")
        )


class AnnouncementViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]
    serializer_class = AnnouncementSerializer
    queryset = Announcement.objects.all()


class PublishedAnnouncementListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AnnouncementSerializer

    def get_queryset(self):
        return Announcement.objects.filter(is_published=True)


class AmbientSoundAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]
    serializer_class = AmbientSoundSerializer
    queryset = AmbientSound.objects.all()


class PublishedAmbientSoundViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AmbientSoundSerializer
    queryset = AmbientSound.objects.filter(is_published=True)
