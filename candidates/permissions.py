from rest_framework.permissions import BasePermission


class IsCandidate(BasePermission):
    """Faqat candidate roli."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'candidate'


class IsEmployerOrAdmin(BasePermission):
    """Faqat employer yoki admin."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('employer', 'admin')
