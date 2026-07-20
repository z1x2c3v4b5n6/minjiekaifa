from django.contrib.auth.hashers import make_password
from django.db import migrations


def seed_demo_users(apps, schema_editor):
    User = apps.get_model("auth", "User")
    UserProfile = apps.get_model("core", "UserProfile")
    accounts = [
        ("demo_user", "timegarden123", "普通用户", "user", False),
        ("demo_admin", "admin123456", "管理员", "admin", True),
    ]
    for username, password, nickname, role, is_staff in accounts:
        user, _ = User.objects.get_or_create(username=username)
        user.password = make_password(password)
        user.is_active = True
        user.is_staff = is_staff
        user.is_superuser = is_staff
        user.save()
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.nickname = nickname
        profile.role = role
        profile.save()


def remove_demo_users(apps, schema_editor):
    apps.get_model("auth", "User").objects.filter(username__in=["demo_user", "demo_admin"]).delete()


class Migration(migrations.Migration):
    dependencies = [("core", "0008_focus_feedback_and_daily_review")]
    operations = [migrations.RunPython(seed_demo_users, remove_demo_users)]
