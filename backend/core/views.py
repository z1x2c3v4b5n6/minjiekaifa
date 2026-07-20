import csv
from datetime import timedelta
from pathlib import Path

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import models, transaction
from django.db.models import Count, Sum
from django.db.models.functions import Coalesce
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import AmbientSound, Announcement, AnnouncementRead, DailyReview, FocusSession, GardenItem, MoodRecord, Task, UserProfile
from .permissions import IsAdminUserRole
from .serializers import (
    AdminUserSerializer,
    AmbientSoundSerializer,
    AnnouncementSerializer,
    DailyReviewSerializer,
    FocusSessionSerializer,
    GardenItemSerializer,
    GardenViewSerializer,
    MoodRecordSerializer,
    TaskSerializer,
    UserProfileSerializer,
)


def map_item_type(category: str, is_dead: bool) -> str:
    mapping = {
        "study": "tree",
        "学习": "tree",
        "work": "flower",
        "工作": "flower",
        "life": "stone",
        "生活": "stone",
    }
    base = mapping.get((category or "").strip().lower(), "tree")
    if is_dead:
        return f"dead_{base}"
    return base


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        nickname = request.data.get("nickname", "")
        if not username or not password:
            return Response({"detail": "用户名和密码必填"}, status=status.HTTP_400_BAD_REQUEST)
        if len(password) < 8:
            return Response({"detail": "密码至少需要 8 位"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({"detail": "用户名已存在"}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(username=username, password=password)
        UserProfile.objects.create(user=user, nickname=nickname, role="user")
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "user": {
                    "id": user.id,
                    "nickname": nickname or username,
                    "role": "user",
                },
            }
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

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
            qs = qs.filter(scheduled_date=timezone.localdate())
        if filter_param == "important":
            qs = qs.filter(priority="important")
        return qs

    def perform_create(self, serializer):
        task = serializer.save(user=self.request.user)
        if task.is_today and not task.scheduled_date:
            task.scheduled_date = timezone.localdate()
            task.save(update_fields=["scheduled_date"])

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        task = serializer.save()
        if task.status == "done" and old_status != "done":
            task.completed_at = timezone.now()
            task.is_today = False
            task.save(update_fields=["completed_at", "is_today"])
        elif task.status != "done" and old_status == "done":
            task.completed_at = None
            task.save(update_fields=["completed_at"])

    @action(detail=True, methods=["post"])
    def set_today(self, request, pk=None):
        task = self.get_object()
        currently_today = task.scheduled_date == timezone.localdate()
        task.is_today = not currently_today
        task.scheduled_date = None if currently_today else timezone.localdate()
        task.save(update_fields=["is_today", "scheduled_date"])
        return Response({"id": task.id, "is_today": task.is_today})

    @action(detail=True, methods=["post"])
    def move_tomorrow(self, request, pk=None):
        task = self.get_object()
        if task.status == "done":
            return Response({"detail": "已完成任务无需迁移"}, status=status.HTTP_400_BAD_REQUEST)
        task.scheduled_date = timezone.localdate() + timedelta(days=1)
        task.is_today = False
        task.rollover_count += 1
        task.save(update_fields=["scheduled_date", "is_today", "rollover_count"])
        return Response(TaskSerializer(task, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        task = self.get_object()
        open_subtasks = task.subtasks.exclude(status="done")
        if open_subtasks.exists() and not request.data.get("force"):
            return Response({"detail": "仍有未完成子任务", "open_subtasks": open_subtasks.count()}, status=status.HTTP_409_CONFLICT)
        if request.data.get("complete_subtasks"):
            open_subtasks.update(status="done", completed_at=timezone.now(), is_today=False)
        task.status = "done"
        task.completed_at = timezone.now()
        task.is_today = False
        task.save(update_fields=["status", "completed_at", "is_today"])
        return Response(TaskSerializer(task, context={"request": request}).data)


class FocusSessionViewSet(viewsets.ModelViewSet):
    serializer_class = FocusSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FocusSession.objects.filter(user=self.request.user).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        client_session_id = request.data.get("client_session_id", "")
        if client_session_id:
            existing = self.get_queryset().filter(client_session_id=client_session_id).first()
            if existing:
                return Response(self.get_serializer(existing).data, status=status.HTTP_200_OK)
        response = super().create(request, *args, **kwargs)
        task_id = request.data.get("task")
        if task_id and response.status_code == status.HTTP_201_CREATED:
            task = Task.objects.filter(user=request.user, pk=task_id).first()
            if task:
                task.refresh_from_db()
                response.data["task_progress"] = TaskSerializer(task, context={"request": request}).data
                response.data["goal_reached"] = bool(task.estimated_pomodoros and task.completed_pomodoros >= task.estimated_pomodoros)
        return response

    @transaction.atomic
    def perform_create(self, serializer):
        session = serializer.save(user=self.request.user)
        task = session.task
        category = task.category if task else ""
        GardenItem.objects.create(
            session=session,
            user=self.request.user,
            date=timezone.localdate(session.ended_at or session.created_at),
            category=category,
            item_type=map_item_type(category, not session.is_completed),
            is_dead=not session.is_completed,
        )
        if task:
            task.actual_focus_minutes = models.F("actual_focus_minutes") + session.duration_minutes
            if session.is_completed:
                task.completed_pomodoros = models.F("completed_pomodoros") + 1
                if task.status == "todo":
                    task.status = "doing"
            task.save(update_fields=["actual_focus_minutes", "completed_pomodoros", "status"])


class TodayStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_sessions = FocusSession.objects.filter(user=request.user, created_at__gte=start_of_day)
        completed_sessions = today_sessions.filter(is_completed=True)
        total_minutes = completed_sessions.aggregate(total=Sum("duration_minutes"))["total"] or 0
        interrupted_minutes = today_sessions.filter(is_completed=False).aggregate(total=Sum("duration_minutes"))["total"] or 0
        total_pomos = completed_sessions.count()

        # 计算连续专注天数
        session_dates = set(
            FocusSession.objects.filter(user=request.user, is_completed=True)
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
                "interrupted_sessions": today_sessions.filter(is_completed=False).count(),
                "interrupted_minutes": interrupted_minutes,
                "streak_days": streak_days,
            }
        )


class OverviewStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        days = int(request.query_params.get("days", 7))
        start_date = today - timedelta(days=days - 1)
        all_sessions = FocusSession.objects.filter(user=request.user, created_at__date__gte=start_date)
        sessions = all_sessions.filter(is_completed=True)

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
                "interrupted_minutes": all_sessions.filter(is_completed=False).aggregate(total=Sum("duration_minutes"))["total"] or 0,
                "interrupted_sessions": all_sessions.filter(is_completed=False).count(),
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


class DailyReviewTodayView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        review = DailyReview.objects.filter(user=request.user, date=timezone.localdate()).first()
        return Response(DailyReviewSerializer(review).data if review else None)

    def put(self, request):
        review, _ = DailyReview.objects.get_or_create(user=request.user, date=timezone.localdate())
        serializer = DailyReviewSerializer(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, date=timezone.localdate())
        return Response(serializer.data)


class DailyPlanContextView(APIView):
    """把最近一次复盘中的次日计划带回首页，完成反馈闭环。"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        source = DailyReview.objects.filter(user=request.user, date=today - timedelta(days=1)).first()
        today_tasks = Task.objects.filter(user=request.user, is_today=True).exclude(status="done")
        completed_today = FocusSession.objects.filter(
            user=request.user, is_completed=True, created_at__date=today
        ).count()
        target = source.planned_pomodoros if source else 0
        return Response({
            "source_date": source.date if source else None,
            "priority": source.tomorrow_priority if source else "",
            "planned_pomodoros": target,
            "completed_pomodoros": completed_today,
            "remaining_pomodoros": max(target - completed_today, 0),
            "today_task_count": today_tasks.count(),
            "has_review_context": bool(source and (source.tomorrow_priority or target)),
        })


class ProductivityInsightsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        days = min(max(int(request.query_params.get("days", 7)), 1), 90)
        start = timezone.localdate() - timedelta(days=days - 1)
        sessions = FocusSession.objects.filter(user=request.user, created_at__date__gte=start)
        total = sessions.count()
        completed = sessions.filter(is_completed=True).count()
        quality = sessions.filter(focus_quality__isnull=False).aggregate(avg=models.Avg("focus_quality"))["avg"]
        interruption = (
            sessions.filter(is_completed=False)
            .exclude(interruption_type="")
            .values("interruption_type")
            .annotate(count=Count("id"))
            .order_by("-count")
            .first()
        )
        average_interruption_minute = sessions.filter(is_completed=False).aggregate(avg=models.Avg("duration_minutes"))["avg"]
        tasks = Task.objects.filter(user=request.user)
        planned = tasks.aggregate(total=Coalesce(Sum("estimated_pomodoros"), 0))["total"]
        actual = tasks.aggregate(total=Coalesce(Sum("completed_pomodoros"), 0))["total"]
        completed_sessions = sessions.filter(is_completed=True)
        hourly = (
            completed_sessions.filter(started_at__isnull=False)
            .annotate(hour=models.functions.ExtractHour("started_at"))
            .values("hour")
            .annotate(minutes=Sum("duration_minutes"), sessions=Count("id"))
            .order_by("hour")
        )
        interruption_breakdown = list(
            sessions.filter(is_completed=False).exclude(interruption_type="")
            .values("interruption_type").annotate(count=Count("id")).order_by("-count")
        )
        mood_values = MoodRecord.objects.filter(user=request.user, date__gte=start).values_list("date", "mood")
        mood_map = dict(mood_values)
        quality_by_mood = {}
        for session in sessions.filter(focus_quality__isnull=False):
            mood = mood_map.get(timezone.localdate(session.created_at))
            if mood:
                quality_by_mood.setdefault(str(mood), []).append(session.focus_quality)
        quality_by_mood = {key: round(sum(values) / len(values), 2) for key, values in quality_by_mood.items()}
        suggestions = []
        completion_rate = completed / total if total else 0
        if total == 0:
            suggestions.append("先从一个 25 分钟专注开始，建立可持续的节奏。")
        elif completion_rate < 0.6:
            suggestions.append("完整专注率偏低，建议缩短单次时长或进一步拆分任务。")
        else:
            suggestions.append("本周期专注完成率稳定，可以逐步提高每日目标。")
        if interruption:
            suggestions.append(f"最常见中断来源是“{interruption['interruption_type']}”，明天可优先减少这一干扰。")
        return Response({
            "days": days,
            "completion_rate": round(completion_rate, 4),
            "average_quality": round(quality, 2) if quality is not None else None,
            "top_interruption": interruption,
            "average_interruption_minute": round(average_interruption_minute, 2) if average_interruption_minute is not None else None,
            "planned_pomodoros": planned,
            "completed_pomodoros": actual,
            "estimate_variance": actual - planned,
            "hourly_productivity": list(hourly),
            "interruption_breakdown": interruption_breakdown,
            "quality_by_mood": quality_by_mood,
            "suggestions": suggestions,
        })


class FocusSessionExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="timegarden-focus-sessions.csv"'
        response.write("\ufeff")
        writer = csv.writer(response)
        writer.writerow(["日期", "任务", "分类", "专注分钟", "是否完成", "专注质量", "中断原因", "开始时间", "结束时间"])
        sessions = FocusSession.objects.filter(user=request.user).select_related("task").order_by("-created_at")
        for session in sessions:
            writer.writerow([
                timezone.localdate(session.created_at),
                session.task.title if session.task else "自由专注",
                session.task.category if session.task else "",
                session.duration_minutes,
                "是" if session.is_completed else "否",
                session.focus_quality or "",
                session.interruption_type or session.interrupted_reason,
                timezone.localtime(session.started_at).strftime("%Y-%m-%d %H:%M:%S") if session.started_at else "",
                timezone.localtime(session.ended_at).strftime("%Y-%m-%d %H:%M:%S") if session.ended_at else "",
            ])
        return response


class GardenOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = FocusSession.objects.filter(user=request.user)
        completed_count = sessions.filter(is_completed=True).count()
        aborted_count = sessions.filter(is_completed=False).count()
        total_sessions = sessions.count()

        now = timezone.now()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_focus_minutes = sessions.filter(created_at__gte=start_of_day, is_completed=True).aggregate(
            total=Sum("duration_minutes")
        )["total"] or 0

        session_dates = set(sessions.filter(is_completed=True).dates("created_at", "day", order="DESC"))
        streak_days = 0
        current_day = now.date()
        while current_day in session_dates:
            streak_days += 1
            current_day -= timedelta(days=1)

        serializer = GardenViewSerializer(
            {
                "total_sessions": total_sessions,
                "completed_count": completed_count,
                "aborted_count": aborted_count,
                "streak_days": streak_days,
                "today_focus_minutes": today_focus_minutes,
            }
        )
        return Response(serializer.data)


class GardenItemListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        range_param = request.query_params.get("range", "day")
        date_param = request.query_params.get("date")
        target_date = parse_date(date_param) if date_param else timezone.localdate()
        if not target_date:
            return Response({"detail": "无效日期格式"}, status=status.HTTP_400_BAD_REQUEST)

        if range_param == "day":
            start_date = end_date = target_date
        elif range_param == "week":
            start_date = target_date - timedelta(days=target_date.isoweekday() - 1)
            end_date = start_date + timedelta(days=6)
        elif range_param == "month":
            start_date = target_date.replace(day=1)
            next_month = (start_date.replace(day=28) + timedelta(days=4)).replace(day=1)
            end_date = next_month - timedelta(days=1)
        else:
            return Response({"detail": "range 仅支持 day/week/month"}, status=status.HTTP_400_BAD_REQUEST)

        items = GardenItem.objects.filter(
            user=request.user, date__gte=start_date, date__lte=end_date
        ).order_by("-created_at")
        serializer = GardenItemSerializer(items, many=True)
        return Response(serializer.data)


class GardenItemSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        range_param = request.query_params.get("range", "week")
        date_param = request.query_params.get("date")
        target_date = parse_date(date_param) if date_param else timezone.localdate()
        if not target_date:
            return Response({"detail": "无效日期格式"}, status=status.HTTP_400_BAD_REQUEST)

        if range_param == "week":
            start_date = target_date - timedelta(days=target_date.isoweekday() - 1)
            end_date = start_date + timedelta(days=6)
        elif range_param == "month":
            start_date = target_date.replace(day=1)
            next_month = (start_date.replace(day=28) + timedelta(days=4)).replace(day=1)
            end_date = next_month - timedelta(days=1)
        else:
            return Response({"detail": "range 仅支持 week/month"}, status=status.HTTP_400_BAD_REQUEST)

        items = (
            GardenItem.objects.filter(user=request.user, date__gte=start_date, date__lte=end_date)
            .values("date")
            .annotate(
                total=Count("id"),
                completed=Count("id", filter=models.Q(is_dead=False)),
                aborted=Count("id", filter=models.Q(is_dead=True)),
            )
            .order_by("date")
        )
        category_breakdown = (
            GardenItem.objects.filter(user=request.user, date__gte=start_date, date__lte=end_date)
            .values("date", "category")
            .annotate(
                total=Count("id"),
                completed=Count("id", filter=models.Q(is_dead=False)),
                aborted=Count("id", filter=models.Q(is_dead=True)),
            )
            .order_by("date")
        )
        summary_map = {entry["date"]: dict(entry, by_category={}) for entry in items}
        for entry in category_breakdown:
            date_key = entry["date"]
            summary = summary_map.setdefault(
                date_key,
                {
                    "date": date_key,
                    "total": 0,
                    "completed": 0,
                    "aborted": 0,
                    "by_category": {},
                },
            )
            category_name = entry["category"] or "未分类"
            summary["by_category"][category_name] = {
                "total": entry["total"],
                "completed": entry["completed"],
                "aborted": entry["aborted"],
            }
        return Response([summary_map[key] for key in sorted(summary_map.keys())])


class AdminOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        now = timezone.now()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_sessions = FocusSession.objects.filter(created_at__gte=start_of_day, is_completed=True)
        completed_sessions = FocusSession.objects.filter(is_completed=True)
        interrupted_today = FocusSession.objects.filter(created_at__gte=start_of_day, is_completed=False).count()
        total_focus_minutes = completed_sessions.aggregate(total=Sum("duration_minutes"))["total"] or 0
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
                "today_interrupted_sessions": interrupted_today,
                "today_active_users": today_sessions.values("user_id").distinct().count(),
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
        now = timezone.now()
        return Announcement.objects.filter(is_published=True).filter(models.Q(expires_at__isnull=True) | models.Q(expires_at__gt=now)).order_by("-is_important", "-created_at")


class AnnouncementMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        announcement = PublishedAnnouncementListView().get_queryset().filter(pk=pk).first()
        if not announcement:
            return Response({"detail": "公告不存在或已失效"}, status=status.HTTP_404_NOT_FOUND)
        AnnouncementRead.objects.get_or_create(user=request.user, announcement=announcement)
        return Response({"id": announcement.id, "is_read": True})


class AmbientSoundAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]
    serializer_class = AmbientSoundSerializer
    queryset = AmbientSound.objects.all()


class PublishedAmbientSoundViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AmbientSoundSerializer

    def get_queryset(self):
        return AmbientSound.objects.filter(is_published=True)

    def list(self, request, *args, **kwargs):
        media_root = Path(settings.MEDIA_ROOT)
        media_url = settings.MEDIA_URL or "/media/"
        sounds = []
        for sound in self.get_queryset():
            if sound.key == "none":
                sounds.append(sound)
                continue
            if sound.file and Path(sound.file.path).exists():
                sounds.append(sound)
                continue
            if sound.file_url and sound.file_url.startswith(media_url):
                relative_path = sound.file_url.replace(media_url, "").lstrip("/")
                if (media_root / relative_path).exists():
                    sounds.append(sound)
        serializer = self.get_serializer(sounds, many=True)
        return Response(serializer.data)
