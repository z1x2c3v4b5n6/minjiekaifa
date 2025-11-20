from django.urls import path
from .views import TaskListCreateView, FocusSessionListCreateView, TodayStatsView

urlpatterns = [
    path('tasks/', TaskListCreateView.as_view(), name='task-list-create'),
    path('sessions/', FocusSessionListCreateView.as_view(), name='session-list-create'),
    path('stats/today/', TodayStatsView.as_view(), name='today-stats'),
]
