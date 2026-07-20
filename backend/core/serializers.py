from django.contrib.auth.models import User
from rest_framework import serializers

from .models import AmbientSound, Announcement, AnnouncementRead, DailyReview, FocusSession, GardenItem, MoodRecord, Task, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", required=False, allow_blank=True)

    class Meta:
        model = UserProfile
        fields = [
            "username",
            "nickname",
            "role",
            "avatar",
            "bio",
            "email",
            "default_focus_minutes",
            "default_short_break_minutes",
            "default_long_break_minutes",
            "default_scene",
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        if user_data:
            instance.user.email = user_data.get("email", instance.user.email)
            instance.user.save()
        return super().update(instance, validated_data)


class TaskSerializer(serializers.ModelSerializer):
    subtask_count = serializers.IntegerField(source="subtasks.count", read_only=True)
    completed_subtask_count = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    estimate_variance = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "parent",
            "title",
            "category",
            "status",
            "priority",
            "deadline",
            "is_today",
            "scheduled_date",
            "estimated_pomodoros",
            "completed_pomodoros",
            "actual_focus_minutes",
            "completed_at",
            "rollover_count",
            "subtask_count",
            "completed_subtask_count",
            "progress_percentage",
            "estimate_variance",
            "created_at",
        ]
        read_only_fields = ["id", "completed_pomodoros", "actual_focus_minutes", "completed_at", "rollover_count", "subtask_count", "completed_subtask_count", "progress_percentage", "estimate_variance", "created_at"]

    def get_completed_subtask_count(self, obj):
        return obj.subtasks.filter(status="done").count()

    def get_progress_percentage(self, obj):
        if not obj.estimated_pomodoros:
            return 100 if obj.status == "done" else 0
        return min(round(obj.completed_pomodoros / obj.estimated_pomodoros * 100), 100)

    def get_estimate_variance(self, obj):
        return obj.completed_pomodoros - obj.estimated_pomodoros if obj.estimated_pomodoros else None

    def validate_parent(self, value):
        request = self.context.get("request")
        if value and request and value.user_id != request.user.id:
            raise serializers.ValidationError("不能关联其他用户的父任务")
        if value and self.instance and value.pk == self.instance.pk:
            raise serializers.ValidationError("任务不能作为自己的父任务")
        return value

    def validate_estimated_pomodoros(self, value):
        if value is not None and value < 1:
            raise serializers.ValidationError("预计番茄数必须大于 0")
        return value


class FocusSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FocusSession
        fields = [
            "id",
            "task",
            "duration_minutes",
            "is_completed",
            "interrupted_reason",
            "interruption_type",
            "focus_quality",
            "pause_count",
            "client_session_id",
            "started_at",
            "ended_at",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_duration_minutes(self, value):
        if value <= 0 or value > 240:
            raise serializers.ValidationError("单次专注时长必须在 0 到 240 分钟之间")
        return value

    def validate_focus_quality(self, value):
        if value is not None and not 1 <= value <= 5:
            raise serializers.ValidationError("专注质量必须在 1 到 5 之间")
        return value

    def validate_task(self, value):
        request = self.context.get("request")
        if value and request and value.user_id != request.user.id:
            raise serializers.ValidationError("不能关联其他用户的任务")
        return value


class DailyReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyReview
        fields = ["id", "date", "achievement", "blocker", "reflection", "tomorrow_priority", "planned_pomodoros", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_planned_pomodoros(self, value):
        if value > 20:
            raise serializers.ValidationError("每日计划番茄数不能超过 20")
        return value


class MoodRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodRecord
        fields = ["id", "date", "mood", "note"]
        read_only_fields = ["id"]

    def validate_mood(self, value):
        if value is None:
            return value
        if not 1 <= int(value) <= 5:
            raise serializers.ValidationError("mood must be between 1 and 5")
        return value

    def create(self, validated_data):
        user = validated_data.pop("user", None) or self.context["request"].user
        return MoodRecord.objects.update_or_create(
            user=user, date=validated_data.get("date"), defaults=validated_data
        )[0]


class GardenViewSerializer(serializers.Serializer):
    total_sessions = serializers.IntegerField()
    completed_count = serializers.IntegerField()
    aborted_count = serializers.IntegerField()
    streak_days = serializers.IntegerField(required=False)
    today_focus_minutes = serializers.DecimalField(required=False, max_digits=8, decimal_places=2)


class GardenItemSerializer(serializers.ModelSerializer):
    session_id = serializers.IntegerField(source="session.id", read_only=True)
    task_title = serializers.CharField(source="session.task.title", read_only=True, default="自由专注")
    duration_minutes = serializers.DecimalField(source="session.duration_minutes", read_only=True, max_digits=6, decimal_places=2)
    focus_quality = serializers.IntegerField(source="session.focus_quality", read_only=True)
    growth_stage = serializers.SerializerMethodField()

    def get_growth_stage(self, obj):
        if obj.is_dead:
            return "seedling"
        minutes = float(obj.session.duration_minutes)
        if minutes >= 45:
            return "bloom"
        if minutes >= 25:
            return "growing"
        return "sprout"

    class Meta:
        model = GardenItem
        fields = [
            "id",
            "date",
            "category",
            "item_type",
            "is_dead",
            "session_id",
            "task_title",
            "duration_minutes",
            "focus_quality",
            "growth_stage",
            "created_at",
        ]


class AnnouncementSerializer(serializers.ModelSerializer):
    is_read = serializers.SerializerMethodField()
    read_count = serializers.IntegerField(source="read_records.count", read_only=True)

    class Meta:
        model = Announcement
        fields = ["id", "title", "content", "is_published", "is_important", "expires_at", "is_read", "read_count", "created_at"]
        read_only_fields = ["id", "is_read", "read_count", "created_at"]

    def get_is_read(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and AnnouncementRead.objects.filter(user=request.user, announcement=obj).exists())


class AdminUserSerializer(serializers.ModelSerializer):
    nickname = serializers.CharField(source="profile.nickname", read_only=True)
    role = serializers.CharField(source="profile.role", read_only=True)
    total_focus_minutes = serializers.DecimalField(read_only=True, max_digits=8, decimal_places=2)
    total_sessions = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "nickname", "role", "date_joined", "total_focus_minutes", "total_sessions"]


class AmbientSoundSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    scene = serializers.CharField(source="key", read_only=True)

    class Meta:
        model = AmbientSound
        fields = [
            "id",
            "name",
            "key",
            "scene",
            "url",
            "is_published",
            "created_at",
            "file",
            "file_url",
        ]
        read_only_fields = ["id", "key", "created_at"]
        extra_kwargs = {
            "file": {"write_only": True, "required": False, "allow_null": True},
            "file_url": {"required": False, "allow_blank": True},
        }

    def get_url(self, obj):
        request = self.context.get("request")
        if obj.file:
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return obj.file_url

    def validate(self, attrs):
        file = attrs.get("file") or getattr(self.instance, "file", None)
        file_url = attrs.get("file_url") or getattr(self.instance, "file_url", "")
        if not file and not file_url:
            raise serializers.ValidationError("请上传音频文件或提供外链地址")
        return attrs
