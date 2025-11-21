from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminOverviewView,
    AdminUserListView,
    AnnouncementViewSet,
    FocusSessionViewSet,
    GardenOverviewView,
    LoginView,
    LogoutView,
    MeditationOverviewView,
    MoodRecentView,
    MoodTodayView,
    OverviewStatsView,
    PublishedAnnouncementListView,
    ProfileView,
    SleepContentDetailView,
    SleepContentListView,
    SoundMixPresetView,
    SoundSceneListView,
    RegisterView,
    TaskViewSet,
    TodayStatsView,
    WellnessHomeView,
)

router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"sessions", FocusSessionViewSet, basename="session")
router.register(r"admin/announcements", AnnouncementViewSet, basename="admin-announcement")

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
    path("wellness/home/", WellnessHomeView.as_view()),
    path("sleep/stories/", SleepContentListView.as_view()),
    path("sleep/stories/<int:pk>/", SleepContentDetailView.as_view()),
    path("sounds/scenes/", SoundSceneListView.as_view()),
    path("sounds/mixes/", SoundMixPresetView.as_view()),
    path("meditations/overview/", MeditationOverviewView.as_view()),
    path("admin/overview/", AdminOverviewView.as_view()),
    path("admin/users/", AdminUserListView.as_view()),
    path("announcements/", PublishedAnnouncementListView.as_view()),
    path("", include(router.urls)),
]
