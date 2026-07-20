from datetime import timedelta

from django.contrib.auth.models import User
from django.core.management import call_command
from django.utils import timezone
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import DailyReview, GardenItem, Task


class FocusLoopTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("candidate", password="StrongPass123")
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.task = Task.objects.create(user=self.user, title="准备面试", estimated_pomodoros=2, is_today=True)

    def test_completed_session_updates_task_and_garden(self):
        response = self.client.post("/api/sessions/", {
            "task": self.task.id,
            "duration_minutes": "25.00",
            "is_completed": True,
            "focus_quality": 4,
            "client_session_id": "session-1",
        })
        self.assertEqual(response.status_code, 201)
        self.task.refresh_from_db()
        self.assertEqual(self.task.completed_pomodoros, 1)
        self.assertEqual(self.task.actual_focus_minutes, 25)
        self.assertEqual(self.task.status, "doing")
        self.assertEqual(GardenItem.objects.filter(user=self.user).count(), 1)

    def test_session_submission_is_idempotent(self):
        payload = {"task": self.task.id, "duration_minutes": "25", "is_completed": True, "client_session_id": "same-id"}
        self.assertEqual(self.client.post("/api/sessions/", payload).status_code, 201)
        self.assertEqual(self.client.post("/api/sessions/", payload).status_code, 200)
        self.task.refresh_from_db()
        self.assertEqual(self.task.completed_pomodoros, 1)

    def test_cannot_use_another_users_task(self):
        other = User.objects.create_user("other")
        task = Task.objects.create(user=other, title="private")
        response = self.client.post("/api/sessions/", {"task": task.id, "duration_minutes": 25})
        self.assertEqual(response.status_code, 400)

    def test_daily_review_upsert(self):
        response = self.client.put("/api/reviews/today/", {"achievement": "完成两轮", "planned_pomodoros": 4})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(DailyReview.objects.filter(user=self.user).count(), 1)
        self.assertEqual(self.client.get("/api/reviews/today/").data["achievement"], "完成两轮")

    def test_invalid_focus_duration_is_rejected(self):
        response = self.client.post("/api/sessions/", {"duration_minutes": 999})
        self.assertEqual(response.status_code, 400)

    def test_insights_returns_actionable_summary(self):
        self.client.post("/api/sessions/", {
            "task": self.task.id, "duration_minutes": 25, "is_completed": True,
            "focus_quality": 5, "client_session_id": "insight-session",
        })
        response = self.client.get("/api/stats/insights/?days=7")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["completion_rate"], 1.0)
        self.assertTrue(response.data["suggestions"])

    def test_yesterday_review_drives_today_plan_context(self):
        DailyReview.objects.create(
            user=self.user,
            date=timezone.localdate() - timedelta(days=1),
            tomorrow_priority="完成项目说明",
            planned_pomodoros=4,
        )
        response = self.client.get("/api/reviews/context/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["priority"], "完成项目说明")
        self.assertEqual(response.data["remaining_pomodoros"], 4)
        self.assertTrue(response.data["has_review_context"])

    def test_task_can_move_to_tomorrow(self):
        response = self.client.post(f"/api/tasks/{self.task.id}/move_tomorrow/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["scheduled_date"], str(timezone.localdate() + timedelta(days=1)))
        self.assertEqual(response.data["rollover_count"], 1)

    def test_focus_response_reports_when_task_goal_is_reached(self):
        for index in range(2):
            response = self.client.post("/api/sessions/", {
                "task": self.task.id, "duration_minutes": 25, "is_completed": True,
                "client_session_id": f"goal-{index}",
            })
        self.assertTrue(response.data["goal_reached"])
        self.assertEqual(response.data["task_progress"]["progress_percentage"], 100)

    def test_garden_item_contains_growth_and_task_context(self):
        self.client.post("/api/sessions/", {"task": self.task.id, "duration_minutes": 45, "is_completed": True, "client_session_id": "garden-context"})
        response = self.client.get("/api/garden/items/?range=day")
        self.assertEqual(response.data[0]["growth_stage"], "bloom")
        self.assertEqual(response.data[0]["task_title"], "准备面试")

    def test_focus_sessions_can_be_exported(self):
        self.client.post("/api/sessions/", {"duration_minutes": 10, "is_completed": True, "client_session_id": "export"})
        response = self.client.get("/api/stats/export/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/csv", response["Content-Type"])
        self.assertIn("自由专注", response.content.decode("utf-8-sig"))


class AuthenticationTests(APITestCase):
    def test_demo_accounts_can_login_with_expected_roles(self):
        call_command("seed_demo_users", verbosity=0)
        cases = [("demo_user", "timegarden123", "user"), ("demo_admin", "admin123456", "admin")]
        for username, password, role in cases:
            response = self.client.post("/api/auth/login/", {"username": username, "password": password})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data["user"]["role"], role)

    def test_registration_returns_a_token(self):
        response = self.client.post("/api/auth/register/", {"username": "new_user", "password": "Pass12345", "nickname": "新人"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["token"])


class AnnouncementEngagementTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("reader", password="Pass12345")
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_opening_published_announcement_marks_it_read(self):
        from .models import Announcement
        announcement = Announcement.objects.create(title="重要通知", content="完整内容", is_published=True, is_important=True)
        listing = self.client.get("/api/announcements/")
        self.assertFalse(listing.data[0]["is_read"])
        self.assertEqual(self.client.post(f"/api/announcements/{announcement.id}/read/").status_code, 200)
        self.assertTrue(self.client.get("/api/announcements/").data[0]["is_read"])

    def test_expired_announcement_is_hidden(self):
        from .models import Announcement
        Announcement.objects.create(title="过期", content="旧内容", is_published=True, expires_at=timezone.now() - timedelta(minutes=1))
        self.assertEqual(len(self.client.get("/api/announcements/").data), 0)
