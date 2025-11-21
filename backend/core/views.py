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

from .models import Announcement, FocusSession, MoodRecord, Task, UserProfile
from .permissions import IsAdminUserRole
from .serializers import (
    AdminUserSerializer,
    AnnouncementSerializer,
    FocusSessionSerializer,
    GardenViewSerializer,
    MoodRecordSerializer,
    TaskSerializer,
    UserProfileSerializer,
)


# ---------------------
# Mock content datasets
# ---------------------
WELLNESS_HOME_DATA = {
    "greetings": [
        {"label": "清晨", "range": (5, 11), "headline": "新的一天，从稳定心绪开始"},
        {"label": "午后", "range": (11, 18), "headline": "补充能量，保持心流"},
        {"label": "夜深了", "range": (18, 24), "headline": "放松入睡，让大脑休息"},
        {"label": "深夜", "range": (0, 5), "headline": "安静片刻，温柔收尾"},
    ],
    "quick_actions": [
        {"title": "心流专注", "action": "focus", "badge": "25min", "icon": "sparkles"},
        {"title": "睡眠监测", "action": "sleep-track", "badge": "分析", "icon": "moon"},
        {"title": "小憩一下", "action": "nap", "badge": "10-20min", "icon": "sun"},
        {"title": "呼吸法", "action": "breath", "badge": "4-7-8", "icon": "wind"},
    ],
    "sections": [
        {
            "title": "助眠冥想",
            "items": [
                {
                    "id": 101,
                    "title": "海浪入睡引导",
                    "duration": "12:30",
                    "cover": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
                },
                {
                    "id": 102,
                    "title": "松弛扫描",
                    "duration": "8:20",
                    "cover": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
                },
            ],
        },
        {
            "title": "平复情绪",
            "items": [
                {
                    "id": 201,
                    "title": "情绪调频",
                    "duration": "6:45",
                    "cover": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
                },
                {
                    "id": 202,
                    "title": "舒展拉伸",
                    "duration": "9:10",
                    "cover": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
                },
            ],
        },
    ],
}

SLEEP_LIBRARY = [
    {
        "id": 1,
        "title": "星空下的鲸歌",
        "category": "sleep-story",
        "tags": ["睡眠故事", "自然"],
        "duration": "18:40",
        "cover": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
        "description": "跟随温柔的旁白，沉入平静海面，伴随鲸落入眠。",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    {
        "id": 2,
        "title": "森林萤火晚安曲",
        "category": "sleep-sound",
        "tags": ["助眠冥想", "自然"],
        "duration": "14:15",
        "cover": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80",
        "description": "慢慢数着萤火虫的光点，让思绪沉淀。",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    },
    {
        "id": 3,
        "title": "城市暮色小夜曲",
        "category": "sleep-tool",
        "tags": ["睡眠声音", "都市"],
        "duration": "20:00",
        "cover": "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=800&q=80",
        "description": "落日余晖里的城市声景，带你慢慢放松。",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    },
    {
        "id": 4,
        "title": "温柔雨夜",
        "category": "sleep-story",
        "tags": ["睡眠故事", "免费"],
        "duration": "16:00",
        "cover": "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80",
        "description": "雨滴声与低语故事，帮助快速入睡。",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    },
]

SOUND_SCENES = [
    {
        "id": "rain-soft",
        "title": "窗边雨声",
        "category": "自然",
        "tags": ["全部", "自然", "免费"],
        "duration": "loop",
        "cover": "https://images.unsplash.com/photo-1503437313881-503a91226402?auto=format&fit=crop&w=800&q=80",
        "preview": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    },
    {
        "id": "metro-night",
        "title": "城市夜行",
        "category": "都市",
        "tags": ["全部", "都市"],
        "duration": "loop",
        "cover": "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80",
        "preview": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    },
    {
        "id": "piano-flow",
        "title": "旋律·轻钢琴",
        "category": "旋律",
        "tags": ["全部", "旋律"],
        "duration": "loop",
        "cover": "https://images.unsplash.com/photo-1485561983318-8ebc5a467605?auto=format&fit=crop&w=800&q=80",
        "preview": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    },
]

MEDITATION_PROGRAMS = {
    "goals": [
        {"title": "新手入门", "description": "5 分钟感受呼吸", "duration": "5-7min"},
        {"title": "睡个好觉", "description": "夜间身体扫描", "duration": "10-15min"},
        {"title": "减压放松", "description": "情绪缓释与放松", "duration": "8-12min"},
        {"title": "情绪调节", "description": "稳定心绪的正念练习", "duration": "6-10min"},
    ],
    "tools": [
        {
            "type": "breath",
            "title": "呼吸法",
            "pattern": "4-7-8",
            "description": "跟随节奏吸气、停留、呼气，快速放松神经。",
        },
        {
            "type": "free",
            "title": "自由练习",
            "description": "自定义时长与环境音，开始一段沉浸式冥想。",
        },
    ],
    "recent": [
        {"title": "情绪调频", "duration": "8:20", "date": "昨天"},
        {"title": "海浪入睡引导", "duration": "12:30", "date": "2 天前"},
    ],
}


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


class WellnessHomeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.localtime()
        hour = now.hour
        greeting = WELLNESS_HOME_DATA["greetings"][0]
        for item in WELLNESS_HOME_DATA["greetings"]:
            start, end = item["range"]
            if start <= hour < end:
                greeting = item
                break
        return Response(
            {
                "greeting": greeting,
                "quick_actions": WELLNESS_HOME_DATA["quick_actions"],
                "sections": WELLNESS_HOME_DATA["sections"],
                "timestamp": now.isoformat(),
            }
        )


class SleepContentListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tag = request.query_params.get("tag")
        category = request.query_params.get("category")
        items = SLEEP_LIBRARY
        if tag:
            items = [item for item in items if tag in item.get("tags", [])]
        if category:
            items = [item for item in items if item.get("category") == category]
        return Response(
            {
                "items": items,
                "tags": ["推荐", "睡眠故事", "助眠冥想", "睡眠声音", "免费"],
                "categories": ["recommend", "sleep-story", "sleep-sound", "sleep-tool"],
                "recent": items[:2],
            }
        )


class SleepContentDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            content = next(item for item in SLEEP_LIBRARY if str(item["id"]) == str(pk))
        except StopIteration:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(content)


class SoundSceneListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tag = request.query_params.get("tag")
        scenes = SOUND_SCENES
        if tag and tag != "全部":
            scenes = [scene for scene in scenes if tag in scene.get("tags", []) or tag == scene.get("category")]
        return Response(
            {
                "items": scenes,
                "tags": ["全部", "自然", "都市", "旋律", "免费", "混音"],
                "new": scenes[:2],
                "explore": ["我的混音", "声音漫游"],
                "recent": scenes[:1],
            }
        )


class SoundMixPresetView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "presets": [
                    {
                        "id": "mix-1",
                        "name": "海边微风",
                        "layers": ["雨声", "海浪", "轻钢琴"],
                        "duration": "loop",
                    },
                    {
                        "id": "mix-2",
                        "name": "城市夜路",
                        "layers": ["路灯底噪", "电车", "lofi"],
                        "duration": "loop",
                    },
                ]
            }
        )

    def post(self, request):
        data = request.data
        name = data.get("name") or "我的混音"
        layers = data.get("layers", [])
        return Response(
            {
                "id": f"mix-{timezone.now().timestamp():.0f}",
                "name": name,
                "layers": layers,
                "message": "已保存到个人预设（演示数据，未持久化）",
            },
            status=status.HTTP_201_CREATED,
        )


class MeditationOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "goals": MEDITATION_PROGRAMS["goals"],
                "tools": MEDITATION_PROGRAMS["tools"],
                "recent": MEDITATION_PROGRAMS["recent"],
                "breath_patterns": ["4-7-8", "box 4-4-4", "6-2-6"],
            }
        )
