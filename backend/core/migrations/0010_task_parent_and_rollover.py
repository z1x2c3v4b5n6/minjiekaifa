from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("core", "0009_seed_demo_users")]
    operations = [
        migrations.AddField(model_name="task", name="parent", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="subtasks", to="core.task")),
        migrations.AddField(model_name="task", name="rollover_count", field=models.PositiveIntegerField(default=0)),
        migrations.AddField(model_name="task", name="scheduled_date", field=models.DateField(blank=True, null=True)),
    ]
