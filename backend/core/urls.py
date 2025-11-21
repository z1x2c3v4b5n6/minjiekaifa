from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    FocusSessionViewSet,
    GardenOverviewView,
    LoginView,
    LogoutView,
    MoodRecentView,
    MoodTodayView,
    OverviewStatsView,
    ProfileView,
    RegisterView,
    TaskViewSet,
    TodayStatsView,
)

router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"sessions", FocusSessionViewSet, basename="session")

urlpatterns = [
    path("auth/register/", RegisterView.as_view()),
    path("auth/login/", LoginView.as_view()),
    path("auth/logout/", LogoutView.as_view()),
    path("profile/", ProfileView.as_view()),
    path("stats/today/", TodayStatsView.as_view()),
    path("stats/overview/", OverviewStatsView.as_view()),
    path("moods/today/", MoodTodayView.as_view()),
    path("moods/recent/", MoodRecentView.as_view()),
    path("garden/overview/", GardenOverviewView.as_view()),
    path("", include(router.urls)),
]
