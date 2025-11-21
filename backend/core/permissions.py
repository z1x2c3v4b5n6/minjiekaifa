from rest_framework.permissions import BasePermission


class IsAdminUserRole(BasePermission):
    message = "仅管理员可访问"

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        profile = getattr(user, "profile", None)
        return bool(user and user.is_authenticated and getattr(profile, "role", "user") == "admin")
