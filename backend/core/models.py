from django.db import models


class Task(models.Model):
    """简单任务模型"""

    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)
    estimated_pomodoros = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class FocusSession(models.Model):
    """番茄专注记录"""

    task = models.ForeignKey(Task, null=True, blank=True, on_delete=models.SET_NULL)
    duration_minutes = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Focus {self.duration_minutes} min"
