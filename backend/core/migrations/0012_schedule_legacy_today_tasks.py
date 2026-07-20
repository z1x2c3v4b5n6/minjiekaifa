from django.db import migrations
from django.utils import timezone


def schedule_legacy_tasks(apps, schema_editor):
    Task = apps.get_model("core", "Task")
    Task.objects.filter(is_today=True, scheduled_date__isnull=True).update(scheduled_date=timezone.localdate())


class Migration(migrations.Migration):
    dependencies = [("core", "0011_announcement_engagement_and_remove_demo_accounts")]
    operations = [migrations.RunPython(schedule_legacy_tasks, migrations.RunPython.noop)]
