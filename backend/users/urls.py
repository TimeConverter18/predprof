from django.urls import path
from users.views import UserStatsApiView, render_profile_page, AdminUsersListApiView

urlpatterns = [
    path('', render_profile_page, name="users"),
    path('me/', UserStatsApiView.as_view(), name='user-me'),
    path('<int:pk>/', UserStatsApiView.as_view(), name='user-stats'),
    path('admin_list/', AdminUsersListApiView.as_view(), name='admin-users-list'),
]