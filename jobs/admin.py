from django.contrib import admin

from jobs.models import Job, JobAlert


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'company', 'type', 'status', 'promote_type', 'created_at')
    search_fields = ('title', 'company__name')
    list_filter = ('type', 'status', 'promote_type', 'level', 'experience')


@admin.register(JobAlert)
class JobAlertAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'job', 'alerted_at')
