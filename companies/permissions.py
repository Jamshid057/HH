from rest_framework.permissions import BasePermission


class IsEmployer(BasePermission):
    """Faqat employer roli."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'employer'


class IsCompanyOwner(BasePermission):
    """Faqat kompaniya egasi."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return hasattr(request.user, 'company')
