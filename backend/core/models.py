from uuid import uuid4

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


class AmbientSound(models.Model):
    """可供前端播放的环境音资源"""

    name = models.CharField(max_length=200)
    key = models.SlugField(max_length=120, unique=True, blank=True)
    file = models.FileField(upload_to="sounds/", blank=True, null=True)
    file_url = models.URLField(blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = f"sound-{uuid4().hex[:8]}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class GardenItem(models.Model):
    """花园可视化元素"""

    ITEM_TYPES = (
        ("tree", "树"),
        ("flower", "花"),
        ("grass", "草"),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="garden_items")
    date = models.DateField()
    category = models.CharField(max_length=100, blank=True)
    item_type = models.CharField(max_length=20, choices=ITEM_TYPES, default="tree")
    is_dead = models.BooleanField(default=False)
    session = models.ForeignKey(
        FocusSession,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="garden_items",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        status = "dead" if self.is_dead else "alive"
        return f"{self.user.username} {self.item_type} {status}"
