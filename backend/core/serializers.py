from django.contrib.auth.models import User
from rest_framework import serializers

from .models import AmbientSound, Announcement, FocusSession, MoodRecord, Task, UserProfile


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
    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "category",
            "status",
            "priority",
            "deadline",
            "is_today",
            "estimated_pomodoros",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class FocusSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FocusSession
        fields = [
            "id",
            "task",
            "duration_minutes",
            "is_completed",
            "interrupted_reason",
            "started_at",
            "ended_at",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


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
    stage = serializers.CharField()
    level = serializers.IntegerField()
    current_exp = serializers.IntegerField()
    next_level_exp = serializers.IntegerField()
    total_pomodoros = serializers.IntegerField()


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ["id", "title", "content", "is_published", "created_at"]
        read_only_fields = ["id", "created_at"]


class AdminUserSerializer(serializers.ModelSerializer):
    nickname = serializers.CharField(source="profile.nickname", read_only=True)
    role = serializers.CharField(source="profile.role", read_only=True)
    total_focus_minutes = serializers.IntegerField(read_only=True)
    total_sessions = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "nickname", "role", "date_joined", "total_focus_minutes", "total_sessions"]


class AmbientSoundSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = AmbientSound
        fields = [
            "id",
            "name",
            "key",
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
