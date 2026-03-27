from django.contrib import admin

from candidates.models import CandidateProfile, Resume, Apply, CandidateWishlist


@admin.register(CandidateProfile)
class CandidateProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'title_headline', 'experience')
    search_fields = ('user__first_name', 'user__last_name', 'title_headline')
    list_filter = ('experience',)


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'user')
    search_fields = ('name', 'user__first_name')


@admin.register(Apply)
class ApplyAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'job', 'status', 'applied_at')
    list_filter = ('status',)
    search_fields = ('user__first_name', 'job__title')


@admin.register(CandidateWishlist)
class CandidateWishlistAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'job', 'saved_at')
