from django.contrib import admin

from companies.models import Company, SavedCandidate


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'owner', 'organization_type', 'team_size')
    search_fields = ('name', 'email')
    list_filter = ('organization_type', 'team_size')


@admin.register(SavedCandidate)
class SavedCandidateAdmin(admin.ModelAdmin):
    list_display = ('id', 'company', 'candidate', 'saved_at')
    list_filter = ('company',)
