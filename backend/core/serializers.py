from rest_framework import serializers
from .models import Task, FocusSession


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'title', 'category', 'estimated_pomodoros', 'created_at']


class FocusSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FocusSession
        fields = ['id', 'task', 'duration_minutes', 'created_at']
