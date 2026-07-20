from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def remove_fixed_demo_accounts(apps, schema_editor):
    apps.get_model("auth", "User").objects.filter(username__in=["demo_user", "demo_admin"]).delete()


class Migration(migrations.Migration):
    dependencies = [("core", "0010_task_parent_and_rollover")]
    operations = [
        migrations.AddField(model_name="announcement", name="expires_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="announcement", name="is_important", field=models.BooleanField(default=False)),
        migrations.CreateModel(
            name="AnnouncementRead",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("read_at", models.DateTimeField(auto_now_add=True)),
                ("announcement", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="read_records", to="core.announcement")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="announcement_reads", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddConstraint(model_name="announcementread", constraint=models.UniqueConstraint(fields=("user", "announcement"), name="unique_announcement_read")),
        migrations.RunPython(remove_fixed_demo_accounts, migrations.RunPython.noop),
    ]
