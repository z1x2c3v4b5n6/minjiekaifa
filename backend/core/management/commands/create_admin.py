from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from core.models import UserProfile


class Command(BaseCommand):
    help = "Create or update an admin user with proper role"

    def add_arguments(self, parser):
        parser.add_argument("--username", required=True)
        parser.add_argument("--password", required=True)
        parser.add_argument("--nickname", default="")

    def handle(self, *args, **options):
        username = options["username"]
        password = options["password"]
        nickname = options["nickname"]

        user, created = User.objects.get_or_create(username=username)
        user.set_password(password)
        user.is_staff = True
        user.save()

        profile, _ = UserProfile.objects.get_or_create(user=user)
        if nickname:
            profile.nickname = nickname
        profile.role = "admin"
        profile.save()

        action = "创建" if created else "更新"
        self.stdout.write(self.style.SUCCESS(f"{action}管理员用户: {username}"))
