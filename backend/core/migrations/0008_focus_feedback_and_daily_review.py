from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    dependencies = [("core", "0007_configure_ambient_sounds")]

    operations = [
        migrations.AddField(model_name="task", name="actual_focus_minutes", field=models.DecimalField(decimal_places=2, default=0, max_digits=8)),
        migrations.AddField(model_name="task", name="completed_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="task", name="completed_pomodoros", field=models.PositiveIntegerField(default=0)),
        migrations.AddField(model_name="focussession", name="client_session_id", field=models.CharField(blank=True, db_index=True, max_length=64)),
        migrations.AddField(model_name="focussession", name="focus_quality", field=models.PositiveSmallIntegerField(blank=True, null=True)),
        migrations.AddField(model_name="focussession", name="interruption_type", field=models.CharField(blank=True, max_length=30)),
        migrations.AddField(model_name="focussession", name="pause_count", field=models.PositiveIntegerField(default=0)),
        migrations.CreateModel(
            name="DailyReview",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date", models.DateField(default=django.utils.timezone.now)),
                ("achievement", models.TextField(blank=True)),
                ("blocker", models.CharField(blank=True, max_length=40)),
                ("reflection", models.TextField(blank=True)),
                ("tomorrow_priority", models.CharField(blank=True, max_length=200)),
                ("planned_pomodoros", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="daily_reviews", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-date"]},
        ),
        migrations.AddConstraint(model_name="dailyreview", constraint=models.UniqueConstraint(fields=("user", "date"), name="unique_daily_review")),
        migrations.AddConstraint(model_name="focussession", constraint=models.UniqueConstraint(condition=~models.Q(client_session_id=""), fields=("user", "client_session_id"), name="unique_user_client_session")),
    ]
