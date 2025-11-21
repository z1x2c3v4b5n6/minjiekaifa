from django.conf import settings
from django.db import models
from django.utils import timezone


class UserProfile(models.Model):
    """用户资料与偏好设置"""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    nickname = models.CharField(max_length=100, blank=True)
    role = models.CharField(
        max_length=20,
        choices=(
            ("user", "普通用户"),
            ("admin", "管理员"),
        ),
        default="user",
    )
    avatar = models.URLField(blank=True)
    bio = models.TextField(blank=True)
    default_focus_minutes = models.IntegerField(default=25)
    default_short_break_minutes = models.IntegerField(default=5)
    default_long_break_minutes = models.IntegerField(default=15)
    default_scene = models.CharField(max_length=50, default="rain")

    def __str__(self):
        return self.nickname or self.user.username


class Task(models.Model):
    """任务模型"""

    STATUS_CHOICES = [
        ("todo", "待办"),
        ("doing", "进行中"),
        ("done", "已完成"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="todo")
    priority = models.CharField(
        max_length=20,
        choices=(
            ("normal", "普通"),
            ("important", "重要"),
        ),
        default="normal",
    )
    deadline = models.DateField(null=True, blank=True)
    is_today = models.BooleanField(default=False)
    estimated_pomodoros = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class FocusSession(models.Model):
    """番茄专注记录"""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sessions")
    task = models.ForeignKey(Task, null=True, blank=True, on_delete=models.SET_NULL, related_name="sessions")
    duration_minutes = models.IntegerField()
    is_completed = models.BooleanField(default=True)
    interrupted_reason = models.CharField(max_length=200, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.duration_minutes}m"


class MoodRecord(models.Model):
    """情绪/日记记录"""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="moods")
    date = models.DateField(default=timezone.now)
    mood = models.IntegerField()
    note = models.TextField(blank=True)

    class Meta:
        unique_together = ("user", "date")

    def __str__(self):
        return f"{self.user.username} {self.date} {self.mood}"


class Announcement(models.Model):
    """系统公告，仅管理员可管理"""

    title = models.CharField(max_length=200)
    content = models.TextField()
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
