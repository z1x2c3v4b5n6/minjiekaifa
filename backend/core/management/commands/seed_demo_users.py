from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from core.models import UserProfile


class Command(BaseCommand):
    help = "Create local demonstration accounts. Do not run in production."

    def handle(self, *args, **options):
        accounts = [
            ("demo_user", "timegarden123", "普通用户", "user", False),
            ("demo_admin", "admin123456", "管理员", "admin", True),
        ]
        for username, password, nickname, role, staff in accounts:
            user, _ = User.objects.get_or_create(username=username)
            user.set_password(password)
            user.is_staff = staff
            user.is_superuser = staff
            user.save()
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.nickname = nickname
            profile.role = role
            profile.save()
        self.stdout.write(self.style.SUCCESS("Local demo users are ready."))
