from django.contrib import admin

from socials.models import Social, SocialLink


@admin.register(Social)
class SocialAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(SocialLink)
class SocialLinkAdmin(admin.ModelAdmin):
    list_display = ('id', 'social', 'url', 'user', 'company')
    list_filter = ('social',)
