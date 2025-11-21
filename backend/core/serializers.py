from django.contrib.auth.models import User
from rest_framework import serializers

from .models import FocusSession, MoodRecord, Task, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", required=False, allow_blank=True)

    class Meta:
        model = UserProfile
        fields = [
            "username",
            "nickname",
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
            "is_today",
            "estimated_pomodoros",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        return Task.objects.create(user=user, **validated_data)


class FocusSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FocusSession
        fields = [
            "id",
            "task",
            "duration_minutes",
            "is_completed",
            "interrupted_reason",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        return FocusSession.objects.create(user=user, **validated_data)


class MoodRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodRecord
        fields = ["id", "date", "mood", "note"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        user = self.context["request"].user
        return MoodRecord.objects.update_or_create(
            user=user, date=validated_data.get("date"), defaults=validated_data
        )[0]


class GardenViewSerializer(serializers.Serializer):
    total_pomodoros = serializers.IntegerField()
    weekly_pomodoros = serializers.IntegerField()
    category_stats = serializers.DictField(child=serializers.IntegerField())
    level = serializers.CharField()
